# Product Image Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the chatbot identify a product from a photo a customer sends (screenshot, blurry phone photo, etc.), match it to the WishCare BD catalog, and suggest alternatives when there's no exact match.

**Architecture:** Image-as-Tool. Webhook layer extracts the image attachment URL from FB/IG payloads; the orchestrator folds it into the message text as `[Customer sent an image: <url>]`; a new `recognize_product_from_image` tool (always present, runs on Gemini 2.5 Flash regardless of active `LLM_PROVIDER`) does the actual vision work when the conversational LLM calls it. No changes to `ChatbotService.processMessage`'s signature or any of the three provider code paths.

**Tech Stack:** TypeScript, Express 5, Vitest, `@google/generative-ai` (Gemini 2.5 Flash for vision), `axios` (image fetch).

**Spec:** `docs/superpowers/specs/2026-06-06-product-image-recognition-design.md`

---

### Task 1: Extract image attachment URLs in `webhookParser`

**Files:**
- Modify: `backend/src/services/messaging/webhookParser.ts`
- Test: `backend/src/services/messaging/__tests__/webhookParser.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `backend/src/services/messaging/__tests__/webhookParser.test.ts` with:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { parseInstagramDms, extractImageUrl } from '../webhookParser.js';

describe('extractImageUrl', () => {
  it('returns the url of an image attachment', () => {
    expect(extractImageUrl([{ type: 'image', payload: { url: 'https://img/1.jpg' } }])).toBe(
      'https://img/1.jpg'
    );
  });

  it('ignores non-image attachments', () => {
    expect(extractImageUrl([{ type: 'audio', payload: { url: 'https://a/1.mp3' } }])).toBeUndefined();
  });

  it('returns undefined when there are no attachments', () => {
    expect(extractImageUrl(undefined)).toBeUndefined();
  });
});

describe('parseInstagramDms', () => {
  beforeEach(() => {
    process.env.IG_BUSINESS_ACCOUNT_ID = 'IG123';
  });

  it('extracts a DM event', () => {
    const body = {
      object: 'instagram',
      entry: [
        { messaging: [{ sender: { id: 'IGSID1' }, message: { mid: 'mid1', text: 'hello' } }] },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([{ senderId: 'IGSID1', text: 'hello', mid: 'mid1' }]);
  });

  it('extracts an image attachment alongside caption text', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'IGSID1' },
              message: {
                mid: 'mid1',
                text: 'is this in stock?',
                attachments: [{ type: 'image', payload: { url: 'https://img/p.jpg' } }],
              },
            },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([
      { senderId: 'IGSID1', text: 'is this in stock?', mid: 'mid1', imageUrl: 'https://img/p.jpg' },
    ]);
  });

  it('extracts an image-only DM with no caption', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'IGSID1' },
              message: {
                mid: 'mid2',
                attachments: [{ type: 'image', payload: { url: 'https://img/q.jpg' } }],
              },
            },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([
      { senderId: 'IGSID1', text: '', mid: 'mid2', imageUrl: 'https://img/q.jpg' },
    ]);
  });

  it('skips echo and self-sent DMs', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            { sender: { id: 'IGSID1' }, message: { mid: 'm', text: 'x', is_echo: true } },
            { sender: { id: 'IG123' }, message: { mid: 'm2', text: 'self' } },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([]);
  });

  it('ignores comment/changes events', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          changes: [
            { field: 'comments', value: { id: 'CMT1', text: 'price?', from: { id: 'U9', username: 'ann' } } },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/webhookParser.test.ts`
Expected: FAIL — `extractImageUrl` is not exported from `'../webhookParser.js'`, and the new `parseInstagramDms` cases mismatch (no `imageUrl` field yet).

- [ ] **Step 3: Implement**

Replace the entire contents of `backend/src/services/messaging/webhookParser.ts` with:

```ts
export interface IgDmEvent {
  senderId: string;
  text: string;
  mid?: string;
  imageUrl?: string;
}

export function extractImageUrl(attachments: any[] | undefined): string | undefined {
  return attachments?.find((a: any) => a?.type === 'image')?.payload?.url;
}

export function parseInstagramDms(body: any): IgDmEvent[] {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  const dms: IgDmEvent[] = [];

  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text ?? '';
      const imageUrl = extractImageUrl(messaging.message?.attachments);
      const isEcho = messaging.message?.is_echo === true;
      if (senderId && (text || imageUrl) && !isEcho && senderId !== igId) {
        dms.push({ senderId, text, mid: messaging.message?.mid, imageUrl });
      }
    }
  }

  return dms;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/webhookParser.test.ts`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/webhookParser.ts backend/src/services/messaging/__tests__/webhookParser.test.ts
git commit -m "feat: extract image attachment urls from instagram DM webhooks"
```

---

### Task 2: Add `recognize_product_from_image` tool

**Files:**
- Modify: `backend/src/services/chatbot/tools.ts`
- Test: `backend/src/services/chatbot/__tests__/tools.test.ts`

- [ ] **Step 1: Write the failing tests**

In `backend/src/services/chatbot/__tests__/tools.test.ts`:

1. Add these two imports right after the existing `import { describe, it, expect, vi, beforeEach } from 'vitest';` line:

```ts
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
```

2. Add these two `vi.mock` calls right after the existing three `vi.mock(...)` blocks (i.e. after the `vi.mock('../../notificationService.js', ...)` block, before the `import { isConfigured, checkCourier } ...` line):

```ts
vi.mock('axios');

vi.mock('@google/generative-ai', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, GoogleGenerativeAI: vi.fn() };
});
```

3. Replace the existing test:

```ts
  it('returns no tools when provider is null', () => {
    const { declarations, handlers } = buildTools(null);
    expect(declarations).toEqual([]);
    expect(Object.keys(handlers)).toEqual([]);
  });
```

with:

```ts
  it('returns only the vision tool when provider is null', () => {
    const { declarations, handlers } = buildTools(null);
    expect(declarations.map((d) => d.name)).toEqual(['recognize_product_from_image']);
    expect(Object.keys(handlers)).toEqual(['recognize_product_from_image']);
  });
```

4. Replace the existing test (note: this one is currently failing on `main` — it expects 4 tools but the code declares 5; this step also fixes that pre-existing mismatch by listing all 6 expected tools):

```ts
  it('exposes 4 tools when provider present', () => {
    const { declarations } = buildTools(fakeProvider());
    expect(declarations.map((d) => d.name).sort()).toEqual(
      ['check_order_history', 'get_available_products', 'get_product_details', 'place_order'].sort()
    );
  });
```

with:

```ts
  it('exposes 6 tools when provider present', () => {
    const { declarations } = buildTools(fakeProvider());
    expect(declarations.map((d) => d.name).sort()).toEqual(
      [
        'cancel_order',
        'check_order_history',
        'get_available_products',
        'get_product_details',
        'place_order',
        'recognize_product_from_image',
      ].sort()
    );
  });
```

5. Add a new `describe` block at the very end of the file, just before the final closing `});` that ends `describe('buildTools', ...)`  — i.e., as a sibling describe block after it:

```ts
describe('recognize_product_from_image handler', () => {
  const mockGenerateContent = vi.fn();

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    (axios.get as any).mockResolvedValue({
      data: Buffer.from('fake-bytes'),
      headers: { 'content-type': 'image/jpeg' },
    });
    (GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    }));
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'WishCare Vitamin C Serum, 30ml bottle clearly visible' },
    });
  });

  it('fetches the image and returns a high-confidence description', async () => {
    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/p.jpg' });

    expect(axios.get).toHaveBeenCalledWith('https://img/p.jpg', { responseType: 'arraybuffer' });
    expect(out).toEqual({
      success: true,
      description: 'WishCare Vitamin C Serum, 30ml bottle clearly visible',
      confidence: 'high',
    });
  });

  it('marks confidence low when the model flags a blurry or unclear photo', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'The photo is blurry and hard to read clearly.' },
    });

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/blurry.jpg' });

    expect(out.success).toBe(true);
    expect(out.confidence).toBe('low');
  });

  it('returns an error when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/p.jpg' });

    expect(out).toEqual({ success: false, error: 'Image recognition not configured' });
  });

  it('returns an error when the image fetch fails', async () => {
    (axios.get as any).mockRejectedValue(new Error('404 not found'));

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/missing.jpg' });

    expect(out).toEqual({ success: false, error: '404 not found' });
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `cd backend && npx vitest run src/services/chatbot/__tests__/tools.test.ts`
Expected: FAIL — `recognize_product_from_image` is `undefined` on `handlers`/missing from `declarations`; tool-count assertions mismatch.

- [ ] **Step 3: Implement**

In `backend/src/services/chatbot/tools.ts`:

1. Replace the import block at the top of the file:

```ts
import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import type { CommerceProvider } from '../commerce/index.js';
import { isConfigured as bdCourierConfigured, checkCourier, normalizeBdPhone } from '../bdCourierService.js';
import { deriveCourierRedFlags, riskLevelFromScore } from '../courierScoring.js';
import { NotificationService } from '../notificationService.js';
```

with:

```ts
import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import axios from 'axios';
import type { CommerceProvider } from '../commerce/index.js';
import { isConfigured as bdCourierConfigured, checkCourier, normalizeBdPhone } from '../bdCourierService.js';
import { deriveCourierRedFlags, riskLevelFromScore } from '../courierScoring.js';
import { NotificationService } from '../notificationService.js';
```

2. Replace the comment block immediately preceding `buildTools` together with the entire `buildTools` function — i.e. everything from `// Builds the agent's toolset from the active commerce provider...` through the function's closing `}`:

```ts
// Builds the agent's toolset from the active commerce provider. With no
// provider configured, the commerce tools are absent and the bot is chat-only.
export function buildTools(provider: CommerceProvider | null): ToolSet {
  if (!provider) {
    return { declarations: [], handlers: {} };
  }
  // ... (original body — the full original function, ending at its closing brace)
}
```

with the following — this combines: the new `recognizeProductFromImage` helper, the always-on vision tool/handler, and the rewritten `buildTools` that prepends the vision tool to whichever toolset it returns:

```ts
// Always runs on Gemini Flash — cheapest multimodal option — independent of
// the active LLM_PROVIDER driving the conversation.
async function recognizeProductFromImage(imageUrl: string): Promise<
  { success: true; description: string; confidence: 'high' | 'low' } | { success: false; error: string }
> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return { success: false, error: 'Image recognition not configured' };

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data as ArrayBuffer).toString('base64');
    const mimeType = (response.headers['content-type'] as string) || 'image/jpeg';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      'This is a photo a customer sent to a skincare/haircare brand called WishCare BD. ' +
        'Identify the product: name, visible brand/text, product type (serum, shampoo, cream, etc.), ' +
        'and size if visible. If the image is blurry, a screenshot, or hard to read, say so explicitly ' +
        'so confidence can be judged. Be concise — a few sentences.',
    ]);

    const description = result.response.text().trim();
    const confidence: 'high' | 'low' = /blurry|unclear|screenshot|hard to (read|tell)|not (sure|certain)/i.test(
      description
    )
      ? 'low'
      : 'high';

    return { success: true, description, confidence };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const visionDeclaration: FunctionDeclaration = {
  name: 'recognize_product_from_image',
  description:
    'Analyze a product image URL and identify what product it shows (name, brand, type, visible text). Use this whenever the customer sends an image.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      imageUrl: { type: SchemaType.STRING, description: 'URL of the customer-sent image.' },
    },
    required: ['imageUrl'],
  },
};

const visionHandlers: Record<string, (args: any) => Promise<any>> = {
  recognize_product_from_image: async (args) => {
    const imageUrl = String(args?.imageUrl ?? '');
    if (!imageUrl) return { success: false, error: 'No image URL provided' };
    return recognizeProductFromImage(imageUrl);
  },
};

// Builds the agent's toolset. The vision tool is always present — recognition
// needs no catalog access. Commerce tools are added only when a provider is
// configured; with no provider, the bot can still identify images but can't
// look products up or place orders.
export function buildTools(provider: CommerceProvider | null): ToolSet {
  if (!provider) {
    return { declarations: [visionDeclaration], handlers: { ...visionHandlers } };
  }

  const declarations: FunctionDeclaration[] = [
    visionDeclaration,
    {
      name: 'get_available_products',
      description: 'List the available products in the store with name, price, and stock status.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          limit: {
            type: SchemaType.NUMBER,
            description: 'Maximum number of products to return (default 20).',
          },
        },
      },
    },
    {
      name: 'get_product_details',
      description: 'Search products by name or keyword and return matching product details (price, stock, description).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'Product name or keyword to search for.' },
        },
        required: ['query'],
      },
    },
    {
      name: 'check_order_history',
      description: "Check a customer's past order history and delivery success rate by phone number.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          phone: { type: SchemaType.STRING, description: 'Customer phone number.' },
        },
        required: ['phone'],
      },
    },
    {
      name: 'place_order',
      description: 'Place an order for a product. Requires full name, phone, complete delivery address, city, email, product name, and quantity.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          customerName: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          city: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          productName: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
        },
        required: ['customerName', 'phone', 'address', 'city', 'email', 'productName', 'quantity'],
      },
    },
    {
      name: 'cancel_order',
      description: 'Cancel an existing order by order ID.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          orderId: { type: SchemaType.STRING, description: 'The order ID to cancel.' },
        },
        required: ['orderId'],
      },
    },
  ];

  const handlers: Record<string, (args: any) => Promise<any>> = {
    ...visionHandlers,

    get_available_products: async (args) => {
      try {
        const products = await provider.listProducts(args?.limit ?? 20);
        return { success: true, products };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    get_product_details: async (args) => {
      try {
        const products = await provider.searchProducts(String(args?.query ?? ''));
        if (products.length === 0) {
          return { success: true, products: [], message: 'No matching products found.' };
        }
        return { success: true, products };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    check_order_history: async (args) => {
      try {
        const history = await provider.getCustomerOrderHistory(String(args?.phone ?? ''));
        return { success: true, ...history };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    place_order: async (args) => {
      try {
        const input = {
          customerName: String(args.customerName),
          phone: String(args.phone),
          address: String(args.address),
          city: String(args.city),
          email: String(args.email),
          productName: String(args.productName),
          quantity: Number(args.quantity) || 1,
        };

        // Notify-only fraud gate — does not block order placement.
        await bdCourierNotifyOnly(input);

        const result = await provider.createOrder(input);
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    cancel_order: async (args) => {
      try {
        return await provider.cancelOrder(String(args?.orderId ?? ''));
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  };

  return { declarations, handlers };
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `cd backend && npx vitest run src/services/chatbot/__tests__/tools.test.ts`
Expected: PASS — all 11 tests green (6 in `buildTools`, 5 in `recognize_product_from_image handler`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/chatbot/tools.ts backend/src/services/chatbot/__tests__/tools.test.ts
git commit -m "feat: add recognize_product_from_image vision tool (always-on, Gemini Flash)"
```

---

### Task 3: Pass image URL through `ConversationOrchestrator`

**Files:**
- Modify: `backend/src/services/messaging/ConversationOrchestrator.ts:6-92`

No dedicated unit tests exist for `ConversationOrchestrator` (verify with `find backend/src -iname '*orchestrator*test*'` — returns nothing); verification for this task is the project build (`tsc` type-check), matching how this file is currently validated.

- [ ] **Step 1: Add `imageUrl` parameter and build the enriched message text**

In `backend/src/services/messaging/ConversationOrchestrator.ts`, replace:

```ts
  static async handleIncomingMessage(
    platformUserId: string,
    messageText: string,
    platformMessageId?: string,
    platform: string = 'facebook'
  ): Promise<void> {
    console.log(`[Orchestrator] Processing ${platform} message from ${platformUserId}: ${messageText.substring(0, 50)}`);

    const adapter = getAdapter(platform);
```

with:

```ts
  static async handleIncomingMessage(
    platformUserId: string,
    messageText: string,
    platformMessageId?: string,
    platform: string = 'facebook',
    imageUrl?: string
  ): Promise<void> {
    console.log(`[Orchestrator] Processing ${platform} message from ${platformUserId}: ${messageText.substring(0, 50)}`);

    const adapter = getAdapter(platform);
    const enrichedText = imageUrl
      ? `[Customer sent an image: ${imageUrl}]${messageText ? `\n${messageText}` : ''}`
      : messageText;
```

- [ ] **Step 2: Store the enriched text as the customer message content**

Replace:

```ts
      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'customer',
        sender_id: platformUserId,
        sender_name: conversation.customerName ?? undefined,
        content: messageText,
        platform_message_id: platformMessageId,
      });
```

with:

```ts
      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'customer',
        sender_id: platformUserId,
        sender_name: conversation.customerName ?? undefined,
        content: enrichedText,
        platform_message_id: platformMessageId,
      });
```

(Leave the `takeoverTrigger`/`shouldTakeover` check below this untouched — it should keep matching against the raw `messageText`, not the enriched string, since the customer's actual words are what should trigger a human handoff.)

- [ ] **Step 3: Pass the enriched text to `ChatbotService.processMessage`**

Replace:

```ts
      const aiResponse = await ChatbotService.processMessage(
        {
          conversationId: conversation.id,
          platformUserId,
          customerName: conversation.customerName ?? 'Customer',
          customerPhone: conversation.customerPhone ?? undefined,
        },
        messageText
      );
```

with:

```ts
      const aiResponse = await ChatbotService.processMessage(
        {
          conversationId: conversation.id,
          platformUserId,
          customerName: conversation.customerName ?? 'Customer',
          customerPhone: conversation.customerPhone ?? undefined,
        },
        enrichedText
      );
```

- [ ] **Step 4: Type-check the project**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/ConversationOrchestrator.ts
git commit -m "feat: fold incoming image urls into enriched chatbot message text"
```

---

### Task 4: Wire image extraction through the webhook routes

**Files:**
- Modify: `backend/src/routes/messagingRoutes.ts:1-77`

Same note as Task 3 — no route-level tests exist for `messagingRoutes.ts` (it's an Express handler with no `supertest` infra in this repo); verification is the project type-check plus the already-passing `webhookParser`/`tools` suites that cover the underlying logic.

- [ ] **Step 1: Import `extractImageUrl`**

Replace:

```ts
import { parseInstagramDms } from '../services/messaging/webhookParser.js';
```

with:

```ts
import { parseInstagramDms, extractImageUrl } from '../services/messaging/webhookParser.js';
```

- [ ] **Step 2: Extract the image URL from Facebook messages and pass it through**

Replace:

```ts
        // Handle messaging events (direct messages)
        for (const messaging of entry.messaging || []) {
          console.log('[Webhook] Messaging:', JSON.stringify(messaging).substring(0, 300));
          const senderId = messaging.sender?.id;
          const messageText = messaging.message?.text;
          const messageId = messaging.message?.mid;
          
          if (senderId && messageText) {
            console.log(`[Webhook] Message from ${senderId}: ${messageText}`);
            await ConversationOrchestrator.handleIncomingMessage(senderId, messageText, messageId);
          }
        }
```

with:

```ts
        // Handle messaging events (direct messages)
        for (const messaging of entry.messaging || []) {
          console.log('[Webhook] Messaging:', JSON.stringify(messaging).substring(0, 300));
          const senderId = messaging.sender?.id;
          const messageText = messaging.message?.text ?? '';
          const messageId = messaging.message?.mid;
          const imageUrl = extractImageUrl(messaging.message?.attachments);

          if (senderId && (messageText || imageUrl)) {
            console.log(`[Webhook] Message from ${senderId}: ${messageText}`);
            await ConversationOrchestrator.handleIncomingMessage(senderId, messageText, messageId, 'facebook', imageUrl);
          }
        }
```

- [ ] **Step 3: Pass the Instagram image URL through too**

Replace:

```ts
      for (const dm of dms) {
        console.log(`[Webhook] IG message from ${dm.senderId}: ${dm.text}`);
        await ConversationOrchestrator.handleIncomingMessage(dm.senderId, dm.text, dm.mid, 'instagram');
      }
```

with:

```ts
      for (const dm of dms) {
        console.log(`[Webhook] IG message from ${dm.senderId}: ${dm.text}`);
        await ConversationOrchestrator.handleIncomingMessage(dm.senderId, dm.text, dm.mid, 'instagram', dm.imageUrl);
      }
```

- [ ] **Step 4: Type-check the project**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/messagingRoutes.ts
git commit -m "feat: forward image attachment urls from FB/IG webhooks to orchestrator"
```

---

### Task 5: Teach the system prompt to use image recognition

**Files:**
- Modify: `backend/src/services/chatbot/ChatbotService.ts:349-370`

`buildSystemPrompt` is a private method with no existing direct tests (verify with `grep -rn buildSystemPrompt backend/src --include='*.ts'` — only call sites, no test file); this is a content/prompt edit, verified by type-check plus a manual end-to-end check (Task 6 covers running the full suite).

- [ ] **Step 1: Add the new tool to the "Available Tools" list**

In `backend/src/services/chatbot/ChatbotService.ts`, replace:

```
* place_order: Use this to create an order after customer confirmation.
* cancel_order: Use this to cancel an existing order. Requires the order ID from the customer.
```

with:

```
* place_order: Use this to create an order after customer confirmation.
* cancel_order: Use this to cancel an existing order. Requires the order ID from the customer.
* recognize_product_from_image: Use this to identify a product from a photo the customer sends.
```

- [ ] **Step 2: Insert the "Image Recognition" rule block**

Replace:

```
* Do not give medical advice or guarantee results.
* For skin allergy, irritation, pregnancy, medical condition, or sensitive skin questions, politely suggest doing a patch test and consulting a dermatologist.

Conversation Style:
```

with:

```
* Do not give medical advice or guarantee results.
* For skin allergy, irritation, pregnancy, medical condition, or sensitive skin questions, politely suggest doing a patch test and consulting a dermatologist.

Image Recognition:

* When the customer's message contains "[Customer sent an image: <url>]", call recognize_product_from_image with that url FIRST, before responding.
* Use the recognition result to search the catalog with get_product_details.
* If no matching product is found, call get_available_products and suggest the closest alternatives from what's actually in stock.
* Never expose the raw recognition text or mention "image recognition", "AI vision", or tool names to the customer — speak naturally, as if you personally looked at the photo (e.g., "ছবি দেখে মনে হচ্ছে এটা আমাদের ... প্রোডাক্ট").
* If recognition fails or the photo is too unclear, politely ask the customer to confirm the product name or send a clearer photo.

Conversation Style:
```

- [ ] **Step 3: Type-check the project**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/chatbot/ChatbotService.ts
git commit -m "feat: teach chatbot system prompt to recognize and act on customer-sent images"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && npm run test`
Expected: all suites pass, including the now-fixed `tools.test.ts` (`exposes 6 tools when provider present`) and the extended `webhookParser.test.ts`.

- [ ] **Step 2: Run a full production build**

Run: `cd backend && npm run build`
Expected: compiles cleanly to `dist/` with no TypeScript errors.

- [ ] **Step 3: Manually sanity-check the prompt change**

Read through `buildSystemPrompt` in `backend/src/services/chatbot/ChatbotService.ts` once more end-to-end — confirm the new "Image Recognition" block reads naturally next to "Critical Rules" and "Conversation Style", and the new line in "Available Tools" matches the style of the other five entries.

No commit for this task — it's a checkpoint. If anything fails, return to the relevant task, fix, and re-commit there.

---

## Manual end-to-end check (post-deploy)

Once deployed (`docker compose up --build -d backend`), this can't be fully verified without live FB/IG webhook traffic and a configured `GEMINI_API_KEY` + commerce provider. To confirm it works for real:

1. Send a photo of a real WishCare product (with and without a caption) to the connected Facebook Page / Instagram account from a test account.
2. Watch `docker compose logs -f backend` for `[Chatbot] Tool call: recognize_product_from_image` followed by a `get_product_details` (or `get_available_products`) call.
3. Confirm the bot's reply in Messenger/Instagram sounds natural in Bangla, references the right product (or a sensible alternative), and never mentions "image recognition", "AI", or tool names.
4. Send a deliberately blurry/unclear photo and confirm the bot asks the customer to confirm the product name or send a clearer photo, rather than guessing confidently.
