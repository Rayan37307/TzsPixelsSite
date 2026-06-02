# Instagram DM Expansion — Design

**Date:** 2026-06-02 (revised — scope narrowed)
**Status:** Approved
**Scope:** Stable Facebook Messenger DM automation + new Instagram Direct Message auto-reply. Disable all comment automation.

## Goal

Extend the existing Facebook Messenger automation to Instagram **Direct Messages**, reusing the AI chatbot pipeline. And disable the existing Facebook comment automation so the service focuses on stable DM auto-reply across both channels.

- **Facebook Messenger DM** — existing flow, kept stable.
- **Instagram DM auto-reply** — new; mirrors the Messenger flow via `ConversationOrchestrator`.
- **Comment automation (FB + IG)** — disabled. The webhook stops processing comment/feed events. Existing Facebook comment code (`CommentHandler`, `FacebookAdapter.replyToComment`) stays in the tree, unused, for easy re-enable later.

Out of scope: any comment auto-reply (FB or IG), comment→DM private reply, Instagram stories.

## Background / Current State

- All messaging runs through the Meta Graph API (`graph.facebook.com/v21.0`), Facebook hardcoded throughout:
  - `FacebookAdapter` — all Graph API calls (currently `static` methods).
  - `ConversationOrchestrator.handleIncomingMessage` — calls `FacebookAdapter` directly.
  - `CommentHandler.handleComment` — calls `FacebookAdapter.replyToComment` directly (to be left intact but untriggered).
  - Webhook `POST /webhooks/facebook` handles `object === 'page'`: FB DMs via `entry[].messaging[]`, FB comments via `entry[].changes[]` field `feed`.
- `conversations` table already has `platform` (default `'facebook'`) with unique `[platform_user_id, platform]`; `getConversationByPlatformUserId` already accepts a `platform`. **No DB migration required.**
- `ChatbotService.isConfigured()` calls `FacebookAdapter.isConfigured()` (static) at two sites.
- Config: `FB_PAGE_ID`, `FB_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`.

## API Path Decision

Instagram Professional account linked to the existing Facebook Page, **same Meta app**.

- Reuse `FB_ACCESS_TOKEN` (Page token grants Instagram access once IG permission added).
- Reuse the **same webhook URL**; IG events arrive with `object: "instagram"` once the IG product is subscribed.
- All calls stay on `graph.facebook.com/v21.0`.
- New env var: `IG_BUSINESS_ACCOUNT_ID` (Instagram-scoped sender id).
- Meta app config: subscribe `instagram` product, webhook field `messages` (DMs only — do **not** subscribe `comments`); add permission `instagram_manage_messages`.

Key API fact:
- **IG DM** → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages`, recipient is IGSID (Instagram-scoped user id).

## Architecture

Introduce a `MessagingAdapter` interface covering the **DM methods only**. `FacebookAdapter` and a new `InstagramAdapter` implement it. An `adapterRegistry` resolves the adapter by `conversation.platform`. `ConversationOrchestrator` becomes platform-aware (default `'facebook'`, FB callers unchanged) and resolves via the registry.

```
services/messaging/
  MessagingAdapter.ts         // interface + shared types (NEW)
  FacebookAdapter.ts          // implements MessagingAdapter; keeps comment/extra methods (REFACTOR)
  InstagramAdapter.ts         // implements MessagingAdapter (DM only) (NEW)
  adapterRegistry.ts          // getAdapter(platform): MessagingAdapter (NEW)
  webhookParser.ts            // pure parser for IG DM webhook entries (NEW)
  ConversationOrchestrator.ts // resolve adapter via registry, platform-aware (REFACTOR)
  CommentHandler.ts           // kept, untriggered; switched to facebookAdapter singleton (MINOR)
```

### Interface (DM-only)

```ts
export interface NormalizedProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
}

export interface MessagingAdapter {
  isConfigured(): boolean;
  sendTextMessage(recipientId: string, message: string): Promise<string | null>;
  getUserProfile(userId: string): Promise<NormalizedProfile>;
  setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void>;
}
```

- Comment-related methods (`replyToComment`) are **not** in the interface. `FacebookAdapter` keeps `replyToComment` (plus existing `sendQuickReply`, `sendAttachment`) as FB-specific methods outside the interface, since comment code is retained but unused. `InstagramAdapter` implements only the interface.
- `FacebookAdapter` is converted from static methods to an instance class with an exported singleton `facebookAdapter`, so it can satisfy `implements MessagingAdapter`. All call sites move to the singleton.

### adapterRegistry

`getAdapter(platform: string): MessagingAdapter` → `facebookAdapter` for `'facebook'`, `instagramAdapter` for `'instagram'`. Throws on unknown platform.

## InstagramAdapter specifics

- Base: `https://graph.facebook.com/v21.0`. Token: `FB_ACCESS_TOKEN`. Sender id: `IG_BUSINESS_ACCOUNT_ID`.
- `isConfigured()` → both `FB_ACCESS_TOKEN` and `IG_BUSINESS_ACCOUNT_ID` present.
- `sendTextMessage(igsid, msg)` → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages`, body `{ messaging_type: 'RESPONSE', recipient: { id: igsid }, message: { text: msg } }`. Returns `message_id`.
- `getUserProfile(igsid)` → `GET /{igsid}?fields=name,username,profile_pic`. IG returns `name`/`username` (not first/last); normalize into `NormalizedProfile` (`first_name = name || username`, `last_name = ''`). On error, fallback `{ id, first_name: 'Instagram', last_name: 'User' }`.
- `setTypingIndicator(igsid, state)` → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages` with `{ recipient: { id: igsid }, sender_action }`; swallow errors.

## Webhook routing

In `POST /webhooks/facebook`:

- **`object === 'page'` (FB)**: keep the DM branch (`entry[].messaging[]`). **Remove** the comment/feed branch (`entry[].changes[]` field `feed` → `CommentHandler`). This disables FB comment automation at the trigger.
- **`object === 'instagram'` (new)**: handle DMs only. Parse `entry[].messaging[]` → `sender.id` (IGSID) + `message.text`, skipping `message.is_echo` and self-sent events (`sender.id === IG_BUSINESS_ACCOUNT_ID`) → `ConversationOrchestrator.handleIncomingMessage(senderId, text, mid, 'instagram')`. Ignore any IG `changes`/comment events.

The handler keeps sending `200 OK` before processing.

## Disabling comment automation

- Remove the `feed`-comment branch from the webhook POST handler (the only trigger).
- Leave `CommentHandler.ts` and `FacebookAdapter.replyToComment` in place, unused. `CommentHandler` is updated only to use the `facebookAdapter` singleton instead of static calls (so the project still compiles after the adapter refactor).
- Do not subscribe the IG `comments` webhook field in the Meta app.

## Orchestrator changes

- `ConversationOrchestrator.handleIncomingMessage(platformUserId, messageText, platformMessageId?, platform = 'facebook')`:
  - Resolve adapter via `getAdapter(platform)`.
  - Pass `platform` to `db.getConversationByPlatformUserId` and `db.createConversation`.
  - Replace direct `FacebookAdapter.*` calls with the resolved adapter.
  - Human-takeover trigger logic unchanged.
- `ConversationOrchestrator.sendAdminMessage` resolves the adapter from `conversation.platform`.
- `ChatbotService` static `FacebookAdapter.isConfigured()` calls migrate to the `facebookAdapter` singleton.

## Data model — no migration

`conversations.platform` + unique `[platform_user_id, platform]` already exist. IG conversations stored with `platform='instagram'`.

## Config changes

- Add `IG_BUSINESS_ACCOUNT_ID` to `backend/.env`. Reuse `FB_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`.

## Error handling / edge cases

- **24-hour messaging window**: IG DM sends outside the window fail with a Meta error — log, don't crash.
- **Profile fetch failure**: fallback "Instagram User".
- **Adapter not configured**: throw; caught by webhook try/catch (200 already acked).
- **Echo / self events**: skip `is_echo` and events where sender id equals `IG_BUSINESS_ACCOUNT_ID`.

## Testing

- **Unit — InstagramAdapter** (mock axios): endpoint + payload for `sendTextMessage`, `getUserProfile` normalization + fallback, `isConfigured`, `setTypingIndicator` error-swallowing.
- **Unit — FacebookAdapter** (mock axios): `isConfigured`, `sendTextMessage` payload, singleton export.
- **Unit — adapterRegistry**: resolves facebook/instagram, throws on unknown.
- **Unit — webhookParser**: `object:'instagram'` DM fixture → DM list; `is_echo` and self-id events skipped; comment/`changes` events ignored.
- **Regression**: existing Facebook DM flow unchanged after refactor; comments no longer trigger replies.

## Non-goals

- Any comment auto-reply (FB or IG), comment→DM private reply.
- Instagram stories.
- Standalone Instagram Login (graph.instagram.com) path.
- Quick replies / attachments for Instagram.
- Deleting comment code (kept, just untriggered).
