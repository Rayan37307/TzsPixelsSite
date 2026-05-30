# Facebook Comment Auto-Reply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-reply to every new Facebook page comment using the existing Gemini AI chatbot.

**Architecture:** Handle `entry.changes[].field === "feed"` events in the existing webhook POST handler. A new `CommentHandler` service calls `ChatbotService` (stateless, zero UUID context) then posts the reply via a new `FacebookAdapter.replyToComment` method.

**Tech Stack:** TypeScript, Node.js, Express, axios, `@google/generative-ai` (via ChatbotService), Facebook Graph API v21.0

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `backend/src/services/messaging/FacebookAdapter.ts` | Add `replyToComment(commentId, message)` |
| Create | `backend/src/services/messaging/CommentHandler.ts` | Orchestrate comment → AI reply → FB reply |
| Modify | `backend/src/routes/messagingRoutes.ts` | Handle `entry.changes` feed events in webhook |

---

### Task 1: Add `replyToComment` to FacebookAdapter

**Files:**
- Modify: `backend/src/services/messaging/FacebookAdapter.ts`

- [ ] **Step 1: Add the method**

Open `backend/src/services/messaging/FacebookAdapter.ts`. After the closing brace of `setTypingIndicator`, add this method before the closing brace of the class:

```typescript
  static async replyToComment(commentId: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${commentId}/comments`,
        { message },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Facebook] Reply to comment error:', error.response?.data || error.message);
      throw error;
    }
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/messaging/FacebookAdapter.ts
git commit -m "feat: add replyToComment method to FacebookAdapter"
```

---

### Task 2: Create CommentHandler service

**Files:**
- Create: `backend/src/services/messaging/CommentHandler.ts`

- [ ] **Step 1: Create the file**

Create `backend/src/services/messaging/CommentHandler.ts` with this content:

```typescript
import { FacebookAdapter } from './FacebookAdapter.js';
import { ChatbotService } from '../chatbot/ChatbotService.js';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export class CommentHandler {
  static async handleComment(
    commentId: string,
    commenterName: string,
    commentText: string
  ): Promise<void> {
    console.log(`[CommentHandler] Replying to comment ${commentId} from ${commenterName}: ${commentText.substring(0, 80)}`);

    try {
      const aiReply = await ChatbotService.processMessage(
        {
          conversationId: ZERO_UUID,
          platformUserId: commentId,
          customerName: commenterName,
        },
        commentText
      );

      await FacebookAdapter.replyToComment(commentId, aiReply);
      console.log(`[CommentHandler] Replied to ${commentId}`);
    } catch (error: any) {
      console.error(`[CommentHandler] Failed to reply to comment ${commentId}:`, error.message);
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/messaging/CommentHandler.ts
git commit -m "feat: add CommentHandler service for comment auto-reply"
```

---

### Task 3: Wire comment handling into the webhook

**Files:**
- Modify: `backend/src/routes/messagingRoutes.ts`

- [ ] **Step 1: Add CommentHandler import**

At the top of `backend/src/routes/messagingRoutes.ts`, add this import after the existing imports:

```typescript
import { CommentHandler } from '../services/messaging/CommentHandler.js';
```

- [ ] **Step 2: Add feed change handler inside the entry loop**

In the webhook POST handler, find this comment:

```typescript
        // (Feed/comment event handling removed - keeping only direct Messenger automation)
```

Replace it with:

```typescript
        // Handle feed events (post comments)
        for (const change of entry.changes || []) {
          if (change.field === 'feed') {
            const val = change.value;
            if (
              val.item === 'comment' &&
              val.verb === 'add' &&
              val.message &&
              val.from?.id !== process.env.FB_PAGE_ID
            ) {
              console.log(`[Webhook] Comment from ${val.from?.name}: ${val.message?.substring(0, 80)}`);
              await CommentHandler.handleComment(
                val.comment_id,
                val.from?.name ?? 'User',
                val.message
              );
            }
          }
        }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/messagingRoutes.ts
git commit -m "feat: handle Facebook comment events in webhook for auto-reply"
```

---

### Task 4: Manual smoke test

**No test framework is installed — verify via logs.**

- [ ] **Step 1: Start dev server**

```bash
cd backend && npm run dev
```

Expected: `Tzs Pixels Backend running on http://localhost:5000`

- [ ] **Step 2: Simulate a comment webhook event**

```bash
curl -X POST http://localhost:5000/webhooks/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "103737791438607",
      "changes": [{
        "field": "feed",
        "value": {
          "item": "comment",
          "verb": "add",
          "comment_id": "103737791438607_999999",
          "from": { "id": "111111111111111", "name": "Test User" },
          "message": "এই প্রোডাক্টের দাম কত?"
        }
      }]
    }]
  }'
```

Expected response: `OK` (200)

Expected server logs:
```
[Webhook] Facebook event received
[Webhook] Comment from Test User: এই প্রোডাক্টের দাম কত?
[CommentHandler] Replying to comment 103737791438607_999999 from Test User: এই প্রোডাক্টের দাম কত?
[Chatbot] Processing message: ...
[CommentHandler] Replied to 103737791438607_999999
```

Note: The actual Graph API call will fail (fake comment ID) — that's expected. You're verifying the code path executes. Real test requires a live comment on the actual page.

- [ ] **Step 3: Verify edge case — own page comment is ignored**

```bash
curl -X POST http://localhost:5000/webhooks/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "103737791438607",
      "changes": [{
        "field": "feed",
        "value": {
          "item": "comment",
          "verb": "add",
          "comment_id": "103737791438607_111111",
          "from": { "id": "103737791438607", "name": "Saajba Page" },
          "message": "Thanks!"
        }
      }]
    }]
  }'
```

Expected: `OK` (200) — no `[CommentHandler]` log lines. The page's own comment is silently skipped.

---

### Task 5: Facebook App webhook subscription (manual — Facebook Console)

This cannot be automated. The Facebook App must subscribe the page webhook to the `feed` field to receive comment events.

- [ ] **Step 1: Open Facebook Developer Console**

Go to: `https://developers.facebook.com/apps/` → select your app → Webhooks

- [ ] **Step 2: Add `feed` subscription to page webhook**

Under "Page" subscriptions, ensure `feed` is checked/subscribed. If not present, add it. The existing `messages` subscription handles DMs — `feed` handles post comments.

- [ ] **Step 3: Verify via a real live comment**

Comment on a post on the Facebook page. Check server logs for:
```
[Webhook] Comment from <your name>: <comment text>
[CommentHandler] Replying to comment ...
[CommentHandler] Replied to ...
```

Check the Facebook post — the page should have replied to your comment.
