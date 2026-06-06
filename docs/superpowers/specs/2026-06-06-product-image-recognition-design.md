# Product Image Recognition — Design

Date: 2026-06-06

## Problem

Customers on Facebook Messenger / Instagram DM frequently send a photo of a
product — a screenshot from elsewhere, an unfocused phone photo, a picture of
the bottle/box — and ask "do you have this?" or "what's this called?". The
chatbot currently only handles text messages: webhook parsing extracts
`message.text` and ignores `message.attachments`. There is no way to identify
a product from an image.

## Goal

When a customer sends a product image (with or without a caption), the bot
should:
1. Identify what product the image shows.
2. Match it against the WishCare BD catalog via existing commerce tools.
3. If no match, suggest the closest similar products from the catalog.

All of this in the bot's normal conversational flow, in Bangla, without
exposing internal tool/recognition mechanics to the customer.

## Approach: Image-as-Tool

Rather than making every LLM provider handle images natively (Approach B —
requires per-provider multimodal plumbing and a weaker Groq vision model), or
running a separate vision pre-pass on every image regardless of whether the
conversation needs it (Approach A), the image URL is surfaced to the
conversational LLM as plain text, and a new tool —
`recognize_product_from_image` — does the actual vision work on demand.

This keeps `ChatbotService.processMessage`'s signature and all three provider
code paths (Gemini / OpenAI / Groq) untouched — they already know how to call
tools and use the results. Vision itself always runs on **Gemini 2.5 Flash**
(cheapest multimodal option, ~$0.00002/image), independent of the
`LLM_PROVIDER` driving the conversation. Groq's text models, which have no
usable vision, work fine here because they never see the raw image — only the
tool's text description.

## Design

### 1. Webhook layer — extract image attachments

Both Facebook (`messagingRoutes.ts`, POST `/webhooks/facebook`) and Instagram
(`webhookParser.ts`, `parseInstagramDms`) read the same Messenger Platform
attachment shape:

```
messaging.message.attachments[0] = { type: 'image', payload: { url: '...' } }
```

Extraction becomes:

```ts
const messageText = messaging.message?.text ?? '';
const imageUrl = messaging.message?.attachments
  ?.find((a: any) => a.type === 'image')?.payload?.url;

// proceed if EITHER is present — not just messageText
if (senderId && (messageText || imageUrl)) {
  await ConversationOrchestrator.handleIncomingMessage(senderId, messageText, messageId, 'facebook', imageUrl);
}
```

`IgDmEvent` gains an optional `imageUrl?: string` field, populated the same
way from `messaging.message.attachments`.

Two real-world delivery patterns both work:
- **Combined**: a single message object carries both `text` (caption) and
  `attachments` (image) — both extracted from the same object, passed together.
- **Sequential**: image arrives as one webhook event, caption as a separate
  text message moments later — handled naturally as two independent
  `handleIncomingMessage` calls; conversation history already ties them
  together for the LLM.

### 2. Orchestrator → enriched message text

`ConversationOrchestrator.handleIncomingMessage` gains an optional
`imageUrl?: string` parameter (after `platform`). When present, it builds a
single enriched string that becomes both the DB-stored customer message and
the `userMessage` passed to `ChatbotService.processMessage`:

```
[Customer sent an image: <imageUrl>]
<original caption text, if any — omitted if empty>
```

This keeps `ChatbotService.processMessage(context, userMessage: string)` and
all three provider methods completely unchanged. The enriched string is
readable as-is in the admin conversation view (`db.addMessage` stores it
verbatim).

### 3. New tool — `recognize_product_from_image`

Added to `buildTools` in `tools.ts`. Unlike the commerce tools (`get_available_products`,
`place_order`, etc.), this tool is **always present** — it doesn't depend on
`getActiveProvider()` returning a commerce provider, since recognition itself
needs no catalog access.

```ts
{
  name: 'recognize_product_from_image',
  description: 'Analyze a product image URL and identify what product it shows (name, brand, type, visible text). Use this whenever the customer sends an image.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      imageUrl: { type: SchemaType.STRING, description: 'URL of the customer-sent image.' },
    },
    required: ['imageUrl'],
  },
}
```

Handler:
1. Fetches the image via axios (`responseType: 'arraybuffer'`), converts to
   base64, reads `content-type` for `mimeType`.
2. Calls Gemini 2.5 Flash directly (`new GoogleGenerativeAI(process.env.GEMINI_API_KEY)`,
   independent of the active `LLM_PROVIDER`) with `inlineData` + a prompt
   tailored to skincare/haircare product recognition — asks for product name,
   visible brand/text, product type/size, and to flag if the image is blurry
   or a screenshot (lowering confidence accordingly).
3. Returns `{ success: true, description: '<free text>', confidence: 'high' | 'low' }`.
4. On fetch failure, missing `GEMINI_API_KEY`, or Gemini error: returns
   `{ success: false, error: '...' }` — the conversational LLM falls back to
   asking the customer to describe the product in words (per system prompt
   rules below — no special handling needed beyond the existing
   "ask for clarification" guidance).

### 4. System prompt — image recognition rules

New rule block added to `ChatbotService.buildSystemPrompt`:

```
Image Recognition:
* When the customer's message contains "[Customer sent an image: <url>]",
  call recognize_product_from_image with that url FIRST, before responding.
* Use the recognition result to search the catalog with get_product_details.
* If no matching product is found, call get_available_products and suggest
  the closest alternatives from what's actually in stock.
* Never expose the raw recognition text or mention "image recognition",
  "AI vision", or tool names to the customer — speak naturally, as if you
  personally looked at the photo (e.g., "ছবি দেখে মনে হচ্ছে এটা আমাদের ... প্রোডাক্ট").
* If recognition fails or the photo is too unclear, politely ask the customer
  to confirm the product name or send a clearer photo.
```

This slots alongside the existing "Critical Rules" sections — no restructuring
of the prompt needed. The existing "Available Tools" enumeration (which lists
each tool by name with a one-line description) also gets a new line for
`recognize_product_from_image`, matching the style of the other five entries.

## Out of scope

- Storing/caching recognized images or building a learned product-image index.
- Editing or re-sending images back to the customer.
- Video/GIF attachments — only `type === 'image'` is handled.
- Per-provider native multimodal (Approach B) — explicitly rejected; revisit
  only if Gemini-as-vision-tool proves insufficient in practice.

## Testing

- Unit test for FB/IG attachment extraction (combined text+image, image-only,
  text-only — existing cases must keep passing).
- Unit test for `recognize_product_from_image` handler: success path (mocked
  Gemini response), fetch failure, missing API key.
- Existing `ChatbotService`/`tools` test suites extended to assert the new
  tool declaration is present and provider-independent (i.e., present even
  when `getActiveProvider()` returns `null`).
