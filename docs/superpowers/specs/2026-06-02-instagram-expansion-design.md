# Instagram Expansion — Design

**Date:** 2026-06-02
**Status:** Approved
**Scope:** Add Instagram DM auto-reply and Instagram comment → private-DM handoff, alongside existing Facebook messaging/comment automation.

## Goal

Extend the existing Facebook (Messenger + Page comment) automation to Instagram, reusing the AI chatbot pipeline. Instagram support covers:

- **IG Direct Message auto-reply** — mirrors the current Facebook Messenger flow via `ConversationOrchestrator`.
- **IG comment → private DM** — when someone comments on an Instagram post/reel, the bot sends the AI answer **only as a private DM** (no public reply), using Meta's private-reply API.

Out of scope: Instagram story mentions/replies, public IG comment replies.

## Background / Current State

- All messaging runs through the Meta Graph API (`graph.facebook.com/v21.0`), with Facebook hardcoded throughout:
  - `FacebookAdapter` — all Graph API calls.
  - `ConversationOrchestrator.handleIncomingMessage` — calls `FacebookAdapter` directly.
  - `CommentHandler.handleComment` — calls `FacebookAdapter.replyToComment` directly.
  - Webhook `POST /webhooks/facebook` handles only `object === 'page'` (FB DMs via `entry[].messaging[]`, FB comments via `entry[].changes[]` field `feed`).
- The `conversations` table already has a `platform` column (default `'facebook'`) with a unique constraint on `[platform_user_id, platform]`, and `getConversationByPlatformUserId` already accepts a `platform` argument. **No DB migration is required.**
- Config: `FB_PAGE_ID`, `FB_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`.

## API Path Decision

Instagram Professional account linked to the existing Facebook Page, **same Meta app**.

- Reuse `FB_ACCESS_TOKEN` (Page token grants Instagram access once IG permissions are added).
- Reuse the **same webhook URL**; Meta delivers IG events to it with `object: "instagram"` once the IG product is subscribed.
- All calls stay on `graph.facebook.com/v21.0`.
- New env var: `IG_BUSINESS_ACCOUNT_ID` (Instagram-scoped sender id).
- Meta app config: subscribe `instagram` product, webhook fields `messages` + `comments`; add permissions `instagram_manage_messages` + `instagram_manage_comments`.

## Architecture

Introduce a `MessagingAdapter` interface. `FacebookAdapter` and a new `InstagramAdapter` both implement it. A registry resolves the adapter by `conversation.platform`. `ConversationOrchestrator` and `CommentHandler` stop calling `FacebookAdapter` directly and instead resolve via the registry.

```
services/messaging/
  MessagingAdapter.ts         // interface + shared types (NEW)
  FacebookAdapter.ts          // implements MessagingAdapter (REFACTOR)
  InstagramAdapter.ts         // implements MessagingAdapter (NEW)
  adapterRegistry.ts          // getAdapter(platform): MessagingAdapter (NEW)
  ConversationOrchestrator.ts // resolve adapter via registry, platform-aware (REFACTOR)
  CommentHandler.ts           // platform-aware, IG private-reply path (REFACTOR)
```

### Interface

```ts
interface NormalizedProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
}

interface MessagingAdapter {
  isConfigured(): boolean;
  sendTextMessage(recipientId: string, message: string): Promise<string | null>;
  getUserProfile(userId: string): Promise<NormalizedProfile>;
  setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void>;
  replyToComment(commentId: string, message: string): Promise<void>;
  sendPrivateReply(commentId: string, message: string): Promise<string | null>;
}
```

- FacebookAdapter behavior is unchanged for existing methods. It implements `sendPrivateReply` by throwing `Error('Facebook private reply not supported')` — the FB flow uses `replyToComment` only and never calls it. (Keeps the interface honest without adding an unused FB endpoint.)
- Existing FB-only convenience methods (`sendMessage`, `sendQuickReply`, `sendAttachment`) remain on `FacebookAdapter` but are not part of the shared interface (YAGNI for IG now).

### adapterRegistry

`getAdapter(platform: string): MessagingAdapter` returns `FacebookAdapter` for `'facebook'`, `InstagramAdapter` for `'instagram'`. Throws on unknown platform.

## InstagramAdapter specifics

- Base URL: `https://graph.facebook.com/v21.0`. Token: `FB_ACCESS_TOKEN`. Sender id: `IG_BUSINESS_ACCOUNT_ID`.
- `isConfigured()` → both `FB_ACCESS_TOKEN` and `IG_BUSINESS_ACCOUNT_ID` present.
- `sendTextMessage(igsid, msg)` → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages`, body `{ messaging_type: 'RESPONSE', recipient: { id: igsid }, message: { text: msg } }`. Returns `message_id`.
- `getUserProfile(igsid)` → `GET /{igsid}?fields=name,username,profile_pic`. IG returns `name`/`username` (not first/last); adapter normalizes into `NormalizedProfile` (e.g. `first_name = name || username`, `last_name = ''`). On error, fallback `{ id, first_name: 'Instagram', last_name: 'User' }`.
- `setTypingIndicator(igsid, state)` → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages` with `{ recipient: { id: igsid }, sender_action: 'typing_on'|'typing_off' }`; swallow errors (best-effort).
- `replyToComment(commentId, msg)` → `POST /{commentId}/replies` with `{ message }`. (Implemented for completeness; not used by the chosen IG flow.)
- `sendPrivateReply(commentId, msg)` → `POST /{IG_BUSINESS_ACCOUNT_ID}/messages` with `{ recipient: { comment_id: commentId }, message: { text: msg } }`. Returns `message_id`.

## Webhook routing

In `POST /webhooks/facebook`, add an `object === 'instagram'` branch (same URL; FB `object === 'page'` branch unchanged).

- **IG DM**: iterate `entry[].messaging[]`. For each with `sender.id` (IGSID) + `message.text` and **not** `message.is_echo` and `sender.id !== IG_BUSINESS_ACCOUNT_ID` → `ConversationOrchestrator.handleIncomingMessage(senderId, text, mid, 'instagram')`.
- **IG comment**: iterate `entry[].changes[]` where `field === 'comments'`. Guard `value.from?.id !== IG_BUSINESS_ACCOUNT_ID`. Call `CommentHandler.handleComment(value.id, value.from?.username ?? 'User', value.text, 'instagram')`.
  - Note: IG comment webhook payload uses `value.id` (comment id), `value.text`, `value.from.{id,username}` — distinct from FB feed payload which uses `comment_id`, `message`, `from.{id,name}`. The parser handles each shape in its own branch.

The handler already sends `200 OK` before processing; keep that.

## Orchestrator / CommentHandler changes

- `ConversationOrchestrator.handleIncomingMessage(platformUserId, messageText, platformMessageId?, platform = 'facebook')`:
  - Resolve adapter via `getAdapter(platform)`.
  - Pass `platform` to `db.getConversationByPlatformUserId` and `db.createConversation`.
  - Replace direct `FacebookAdapter.*` calls with the resolved adapter.
  - Existing human-takeover trigger logic unchanged.
- `ConversationOrchestrator.sendAdminMessage` resolves the adapter from `conversation.platform`.
- `CommentHandler.handleComment(commentId, commenterName, commentText, platform = 'facebook')`:
  - `facebook` → keep current behavior: `adapter.replyToComment(commentId, aiReply)` (public reply).
  - `instagram` → `adapter.sendPrivateReply(commentId, aiReply)` (private DM only, no public reply).
  - Dedup: keep an in-memory `Set<string>` of processed `commentId`s; skip if already processed (Meta redelivers webhooks; private reply allowed once per comment). Process-local — acceptable for single instance; documented limitation for horizontal scaling.

## Data flow (IG comment → DM → conversation)

1. User comments on IG post → webhook `comments` change.
2. `CommentHandler` runs AI on comment text → `sendPrivateReply(commentId, aiReply)` → DM delivered.
3. If user replies in DM → arrives as IG `messaging` event with their IGSID → `ConversationOrchestrator` creates/looks up conversation keyed by `(igsid, 'instagram')` → normal AI flow.

## Config changes

- Add `IG_BUSINESS_ACCOUNT_ID` to `backend/.env` and any env documentation.
- No new tokens; `FB_ACCESS_TOKEN` and `FB_VERIFY_TOKEN` reused.

## Error handling / edge cases

- **24-hour messaging window**: IG DM sends outside the standard messaging window fail with a specific Meta error — log and continue, do not crash. Private reply is exempt (allowed once per comment).
- **Profile fetch failure**: fallback to "Instagram User".
- **Adapter not configured**: throw; caught by webhook try/catch (200 already acked).
- **Echo / self events**: skip `is_echo` and events where sender/from id equals `IG_BUSINESS_ACCOUNT_ID`.
- **Comment dedup**: in-memory Set; note as future work to persist if scaled to multiple instances.

## Testing

- **Unit — InstagramAdapter** (mock axios): correct endpoint + payload for `sendTextMessage`, `sendPrivateReply`, `getUserProfile` normalization, `isConfigured` logic, `setTypingIndicator` error-swallowing.
- **Unit — adapterRegistry**: resolves facebook/instagram, throws on unknown.
- **Unit — CommentHandler**: IG path calls `sendPrivateReply` (not `replyToComment`); FB path unchanged; dedup skips repeat `commentId`.
- **Unit — webhook parser**: `object:'instagram'` DM fixture routes to orchestrator with `'instagram'`; IG comment fixture routes to CommentHandler with `'instagram'`; `is_echo` and self-id events skipped.
- **Regression**: existing Facebook DM + comment flows unchanged after refactor.

## Non-goals

- Instagram story mentions/replies.
- Public Instagram comment replies.
- Standalone Instagram Login (graph.instagram.com) path.
- Quick replies / attachments for Instagram.
- Persisted (cross-instance) comment dedup.
