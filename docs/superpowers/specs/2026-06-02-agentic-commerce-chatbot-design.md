# Agentic Commerce Chatbot — Design

Date: 2026-06-02

## Goal

Make the customer-facing chatbot (`ChatbotService`, used by both Messenger and
Instagram via `ConversationOrchestrator`) fully agentic with real tool calling.
The agent gets commerce tools — place an order, get product details, list
available products, check order history — backed by whichever commerce platform
is configured in the environment. **The environment determines the toolset:** if
no commerce platform is configured, the commerce tools are absent and the bot is
chat-only.

Only one commerce platform is configured at a time (WooCommerce or Shopify).
Both being configured simultaneously is out of scope.

## Architecture

### 1. Commerce module — `backend/src/services/commerce/`

A thin abstraction over the existing `WooCommerceService` and `ShopifyService`
so the agent talks to one interface regardless of platform.

**`types.ts`**

```ts
export interface NormalizedProduct {
  id: string;
  name: string;
  price: string;
  currency?: string;
  inStock: boolean;
  description?: string;
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  productName: string;
  quantity: number;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
}

export interface CustomerOrderHistory {
  total: number;
  delivered: number;
  successRate: number; // 0..100
}

export interface CommerceProvider {
  name: 'woocommerce' | 'shopify';
  listProducts(limit?: number): Promise<NormalizedProduct[]>;
  searchProducts(query: string): Promise<NormalizedProduct[]>;
  createOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  getCustomerOrderHistory(phone: string): Promise<CustomerOrderHistory>;
}
```

**`wooProvider.ts`** — wraps `WooCommerceService`.
- `listProducts` / `searchProducts`: `getProducts()` → map to `NormalizedProduct`
  (`stock_status === 'instock'` → `inStock`). Search filters by name/description
  substring.
- `createOrder`: resolve `product_id` via `findProductId(productName)` (name-only
  line items are fragile), then build the billing + `line_items: [{product_id,
  quantity}]` payload and call `createOrder`.
- `getCustomerOrderHistory`: `fetchOrders()` (already normalized), filter by phone,
  count `status === 'Delivered'`, compute success rate.

**`shopifyProvider.ts`** — wraps `ShopifyService`.
- `listProducts` / `searchProducts`: `getProducts()` → map (`variants[0].price`,
  `variants[0].inventory_quantity > 0` → `inStock`).
- `createOrder`: resolve product via `searchProducts`, take first variant id, build
  Shopify order payload `{ line_items: [{variant_id, quantity}], email, phone,
  shipping_address {...}, customer {...} }`, call `createOrder`.
- `getCustomerOrderHistory`: same pattern as Woo using Shopify's normalized
  `fetchOrders`.

**`index.ts`**

```ts
export function getActiveProvider(): CommerceProvider | null {
  if (WooCommerceService.isConfigured()) return wooProvider;
  if (ShopifyService.isConfigured()) return shopifyProvider;
  return null;
}
```

Add `ShopifyService.isConfigured()`:
`!!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET)`.

### 2. Tool registry — `backend/src/services/chatbot/tools.ts`

```ts
buildTools(provider: CommerceProvider | null): {
  declarations: FunctionDeclaration[];
  handlers: Record<string, (args: any) => Promise<any>>;
}
```

- `provider === null` → empty declarations + empty handlers (commerce tools
  vanish from the agent).
- `provider` present → 4 tools:
  - `get_available_products` → `provider.listProducts()`
  - `get_product_details({ query })` → `provider.searchProducts(query)`
  - `place_order({ customerName, phone, address, city, email, productName,
    quantity })` → BDCourier gate (below) then `provider.createOrder(...)`
  - `check_order_history({ phone })` → `provider.getCustomerOrderHistory(phone)`

Handlers return plain JSON. On error they return `{ success: false, error }` so
the model can recover and apologize rather than throwing the loop.

### 3. Agentic loop — `ChatbotService.processMessage`

Replace the single-shot `fetch` with the `@google/generative-ai` SDK (already a
dependency, used by `aiService.ts`).

```ts
const provider = getActiveProvider();
const { declarations, handlers } = buildTools(provider);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction,
  tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
});
const chat = model.startChat({ history });
let result = await chat.sendMessage(userMessage);
for (let hop = 0; hop < 5; hop++) {
  const calls = result.response.functionCalls();
  if (!calls?.length) break;
  const responses = [];
  for (const call of calls) {
    const handler = handlers[call.name];
    const out = handler ? await handler(call.args) : { success: false, error: 'unknown tool' };
    responses.push({ functionResponse: { name: call.name, response: out } });
  }
  result = await chat.sendMessage(responses);
}
return result.response.text();
```

- History: prisma rows → SDK `Content[]`; `sender === 'ai'` → `role: 'model'`,
  else `role: 'user'`.
- Max 5 tool hops guards against loops.
- Keep the existing Gemini-unavailable Bangla fallback and human-takeover early
  return.
- Delete the dead inline tool methods (`checkUserOrderHistory`,
  `getProductDetails`, `placeOrder`) — logic now lives in providers/tools.

### 4. BDCourier gate (inside `place_order` handler)

```ts
if (bdCourier.isConfigured()) {
  const phone = normalizeBdPhone(input.phone);
  if (phone) {
    try {
      const data = await checkCourier(phone);
      const flags = deriveCourierRedFlags(data);
      const score = flags.reduce((s, f) => s + f.points, 0);
      if (riskLevelFromScore(score) === 'high') {
        await NotificationService.addNotification({
          type: 'fraud',
          title: 'High Risk Order Placed by AI',
          message: `AI placed order for ${input.customerName} (${input.phone}); courier fraud score ${score}.`,
          time: 'Just now',
        });
      }
    } catch (e) { /* log + continue */ }
  }
}
// order placed regardless
return provider.createOrder(input);
```

**Notify-only — never blocks.**

### 5. System prompt update

- Remove the hard rule "if success rate < 70%, decline order". The agent is now
  allowed to place orders; courier risk is handled server-side (notify admin).
- Keep: reply in Bangla, never fabricate product info (always use tools),
  required order fields, don't expose internal tool names, human-takeover line,
  hotline.

## Data flow

```
Messenger/IG webhook
  → ConversationOrchestrator
    → ChatbotService.processMessage
       → Gemini (with env-derived tools)
         ⇄ tool handlers → CommerceProvider → Woo/Shopify API
                          → place_order → BDCourier check → (notify admin if high) → createOrder
       → final Bangla text
    → adapter.sendTextMessage
```

## Error handling

- Tool handler failures return `{success:false,error}` to the model; it apologizes
  or retries with corrected args.
- Loop capped at 5 hops.
- BDCourier failure inside `place_order` is logged and swallowed (does not block).
- Gemini API failure → existing Bangla fallback message.

## Testing

- `commerce/__tests__`: Woo + Shopify product normalization; `getActiveProvider`
  resolution (Woo wins, Shopify fallback, null when neither configured) with
  mocked services.
- `tools` tests: empty declarations when provider null; each handler dispatches to
  provider.
- `place_order` test: high BDCourier risk → `NotificationService.addNotification`
  called AND `provider.createOrder` still called.
- Existing 41 tests stay green.

## Out of scope

- Both commerce platforms active at once.
- Making the general assistant (`aiService.ts` / AI Assistant page) agentic.
- Stock decrement after order, payment handling, multi-product carts.
