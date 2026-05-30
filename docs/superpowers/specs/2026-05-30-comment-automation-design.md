# Facebook Comment Auto-Reply — Design Spec
**Date:** 2026-05-30

## Overview

Auto-reply to every new comment on any Facebook page post using the same AI (ChatbotService/Gemini) that handles DM automation. Comments are stateless — no conversation tracking, no takeover flow.

## Architecture

### New Files
- `backend/src/services/messaging/CommentHandler.ts`

### Modified Files
- `backend/src/services/messaging/FacebookAdapter.ts` — add `replyToComment(commentId, message)`
- `backend/src/routes/messagingRoutes.ts` — handle `entry.changes` feed events in webhook POST

## Data Flow

```
FB user comments on post
  → Facebook POSTs to /webhooks/facebook
  → entry.changes[].field === "feed"
  → CommentHandler.handleComment(commentId, commenterName, commentText)
  → ChatbotService.processMessage({ conversationId: ZERO_UUID, platformUserId: commentId, customerName: commenterName }, commentText)
  → FacebookAdapter.replyToComment(commentId, aiReply)
  → POST https://graph.facebook.com/v21.0/{comment-id}/comments { message: aiReply }
```

## Components

### CommentHandler.ts
Single static method. Calls ChatbotService with a zero UUID (no history — comments are stateless). Calls FacebookAdapter.replyToComment with the result.

```typescript
export class CommentHandler {
  static async handleComment(commentId: string, commenterName: string, commentText: string): Promise<void>
}
```

### FacebookAdapter.replyToComment
New method on existing class. POSTs to Graph API `/{comment-id}/comments`.

```typescript
static async replyToComment(commentId: string, message: string): Promise<void>
```

### Webhook Handler (messagingRoutes.ts)
Inside existing `for (const entry of body.entry)` loop, add a second loop over `entry.changes`:

```typescript
for (const change of entry.changes || []) {
  if (change.field === 'feed') {
    const val = change.value;
    if (val.item === 'comment' && val.verb === 'add' && val.from?.id !== process.env.FB_PAGE_ID) {
      await CommentHandler.handleComment(val.comment_id, val.from?.name ?? 'User', val.message ?? '');
    }
  }
}
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Comment edit/delete | `verb !== "add"` — skip |
| Post like/share/reaction | `item !== "comment"` — skip |
| Page replies to own comments | `from.id === FB_PAGE_ID` — skip (prevents reply loops) |
| Empty comment text | Skip if `val.message` is falsy |
| AI/FB error | Log error, do not crash — 200 already sent before processing |
| ChatbotService not configured | Returns fallback message string — still attempts reply |

## Facebook Webhook Subscription Requirement

For comment events to arrive, the Facebook App must have **`feed`** added to the page webhook subscriptions (in addition to `messages`). This is configured in the Facebook Developer Console → Webhooks → Page subscriptions.

## No Database Changes

Comments are not stored. No Prisma schema changes needed. ChatbotService receives a zero UUID (`00000000-0000-0000-0000-000000000000`) so history query returns empty — each comment reply is context-free.
