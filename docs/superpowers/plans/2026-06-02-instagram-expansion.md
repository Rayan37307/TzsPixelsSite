# Instagram DM Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Instagram Direct Message auto-reply alongside the existing Facebook Messenger DM automation, and disable all comment automation (keep the code, remove the trigger).

**Architecture:** A `MessagingAdapter` interface (DM methods only) implemented by `FacebookAdapter` and a new `InstagramAdapter`, resolved per-conversation by an `adapterRegistry`. `ConversationOrchestrator` becomes platform-aware (default `'facebook'`, FB callers unchanged). The shared `POST /webhooks/facebook` route gains an `object === 'instagram'` DM branch and drops the FB comment/feed branch. No DB migration — `conversations.platform` already exists.

**Tech Stack:** TypeScript (NodeNext ESM), Express, Prisma, axios, Meta Graph API v21.0. Tests via **vitest**.

**Scope note (revised):** No comment automation. `CommentHandler` and `FacebookAdapter.replyToComment` stay in the tree, unused. `MessagingAdapter` is DM-only; comment methods are NOT part of the interface.

---

## File Structure

- `backend/vitest.config.ts` — DONE (Task 1).
- `backend/package.json` — DONE (Task 1).
- `backend/src/services/messaging/MessagingAdapter.ts` — NEW, interface + shared types (DM-only).
- `backend/src/services/messaging/FacebookAdapter.ts` — MODIFY, instance class + singleton, `implements MessagingAdapter`, keep `replyToComment`/`sendQuickReply`/`sendAttachment` as extra methods.
- `backend/src/services/messaging/InstagramAdapter.ts` — NEW (DM only).
- `backend/src/services/messaging/adapterRegistry.ts` — NEW.
- `backend/src/services/messaging/webhookParser.ts` — NEW, pure IG DM parser.
- `backend/src/services/messaging/CommentHandler.ts` — MINOR, switch to `facebookAdapter` singleton (kept, untriggered).
- `backend/src/services/messaging/ConversationOrchestrator.ts` — MODIFY, platform-aware via registry.
- `backend/src/services/chatbot/ChatbotService.ts` — MODIFY, migrate static `FacebookAdapter.isConfigured()` to singleton.
- `backend/src/routes/messagingRoutes.ts` — MODIFY, add IG DM branch, remove FB feed/comment branch.
- `backend/.env` — MODIFY, add `IG_BUSINESS_ACCOUNT_ID`.

Test files under `backend/src/services/messaging/__tests__/`:
- `InstagramAdapter.test.ts`, `adapterRegistry.test.ts`, `webhookParser.test.ts`, `FacebookAdapter.test.ts`.

---

## Task 1: Set up vitest — ✅ DONE

(Committed: `chore: add vitest test runner`.)

---

## Task 2: MessagingAdapter interface (DM-only)

**Files:**
- Create: `backend/src/services/messaging/MessagingAdapter.ts`

No test (types only; compilation is the check).

- [ ] **Step 1: Create the interface file**

Create `backend/src/services/messaging/MessagingAdapter.ts`:
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

export type Platform = 'facebook' | 'instagram';
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/messaging/MessagingAdapter.ts
git commit -m "feat: add MessagingAdapter interface (DM-only)"
```

---

## Task 3: FacebookAdapter implements interface (+ CommentHandler/ChatbotService singleton migration)

**Files:**
- Modify: `backend/src/services/messaging/FacebookAdapter.ts`
- Modify: `backend/src/services/messaging/CommentHandler.ts`
- Modify: `backend/src/services/chatbot/ChatbotService.ts`
- Test: `backend/src/services/messaging/__tests__/FacebookAdapter.test.ts`

`FacebookAdapter` is currently a class with `static` methods. Convert to instance methods + exported singleton so it can `implements MessagingAdapter`. Then migrate every static call site (`CommentHandler`, `ChatbotService`, and `ConversationOrchestrator` in Task 6).

`replyToComment` is kept (comment code retained but untriggered) — it is NOT part of the `MessagingAdapter` interface, just an extra method on the class.

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/FacebookAdapter.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { facebookAdapter } from '../FacebookAdapter.js';

vi.mock('axios');

describe('FacebookAdapter', () => {
  beforeEach(() => {
    process.env.FB_PAGE_ID = 'PAGE123';
    process.env.FB_ACCESS_TOKEN = 'TOKEN123';
  });

  it('isConfigured true when page id and token set', () => {
    expect(facebookAdapter.isConfigured()).toBe(true);
  });

  it('sendTextMessage posts to page messages endpoint', async () => {
    (axios.post as any).mockResolvedValue({ data: { message_id: 'm1' } });
    const id = await facebookAdapter.sendTextMessage('USER1', 'hi');
    expect(id).toBe('m1');
    const [url, body] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/PAGE123/messages');
    expect(body.recipient.id).toBe('USER1');
    expect(body.message.text).toBe('hi');
  });

  it('replyToComment posts to comment comments endpoint', async () => {
    (axios.post as any).mockResolvedValue({ data: {} });
    await facebookAdapter.replyToComment('C1', 'thanks');
    const [url] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/C1/comments');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/FacebookAdapter.test.ts`
Expected: FAIL — `facebookAdapter` is not exported.

- [ ] **Step 3: Refactor FacebookAdapter to an instance class + singleton**

Replace the full contents of `backend/src/services/messaging/FacebookAdapter.ts` with:
```ts
import axios from 'axios';
import type { MessagingAdapter, NormalizedProfile } from './MessagingAdapter.js';

interface FacebookUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
}

export class FacebookAdapter implements MessagingAdapter {
  private get PAGE_ID() {
    return process.env.FB_PAGE_ID || '';
  }

  private get ACCESS_TOKEN() {
    return process.env.FB_ACCESS_TOKEN || '';
  }

  private get BASE_URL() {
    return `https://graph.facebook.com/v21.0/${this.PAGE_ID}`;
  }

  isConfigured(): boolean {
    return !!(this.PAGE_ID && this.ACCESS_TOKEN);
  }

  async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: { text: message },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send text error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendQuickReply(
    recipientId: string,
    text: string,
    buttons: { title: string; payload: string }[]
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: {
            text,
            quick_replies: buttons.map((btn) => ({
              content_type: 'text',
              title: btn.title,
              payload: btn.payload,
            })),
          },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send quick reply error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendAttachment(
    recipientId: string,
    attachmentType: 'image' | 'audio' | 'video' | 'file',
    attachmentUrl: string
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: attachmentType,
              payload: { url: attachmentUrl, is_reusable: true },
            },
          },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send attachment error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<NormalizedProfile> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${userId}`, {
        params: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.ACCESS_TOKEN,
        },
      });
      const data = response.data as FacebookUser;
      return {
        id: userId,
        first_name: data.first_name || 'Unknown',
        last_name: data.last_name || 'User',
        profile_pic: data.profile_pic,
      };
    } catch (error: any) {
      console.error('[Facebook] Get user profile error:', error.response?.data || error.message);
      return { id: userId, first_name: 'Unknown', last_name: 'User' };
    }
  }

  async setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await axios.post(
        `${this.BASE_URL}/messages`,
        {
          recipient: { id: recipientId },
          sender_action: state === 'on' ? 'typing_on' : 'typing_off',
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Facebook] Typing indicator error:', error.message);
    }
  }

  // Comment automation is currently disabled (no webhook trigger). Kept for re-enable.
  async replyToComment(commentId: string, message: string): Promise<void> {
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
}

export const facebookAdapter = new FacebookAdapter();
```

Note: the old static `sendMessage` and `verifyWebhook` methods are dropped (unused — the route verifies the token inline). Before finishing, run `grep -rn "FacebookAdapter\.\(sendMessage\|verifyWebhook\|sendTextMessage\|getUserProfile\|setTypingIndicator\|replyToComment\|sendQuickReply\|sendAttachment\|isConfigured\)" backend/src` to find every static call site; Steps 4–5 cover `CommentHandler` and `ChatbotService`, and Task 6 covers `ConversationOrchestrator`. If any other call site exists, report it as DONE_WITH_CONCERNS.

- [ ] **Step 4: Migrate CommentHandler to the singleton (keep code, untriggered)**

In `backend/src/services/messaging/CommentHandler.ts`:

Change the import:
```ts
import { FacebookAdapter } from './FacebookAdapter.js';
```
to:
```ts
import { facebookAdapter } from './FacebookAdapter.js';
```

Change the call (currently `await FacebookAdapter.replyToComment(commentId, aiReply);`):
```ts
      await facebookAdapter.replyToComment(commentId, aiReply);
```
Leave everything else in `CommentHandler.ts` unchanged. (It is no longer triggered after Task 7, but must still compile.)

- [ ] **Step 5: Migrate ChatbotService static calls to the singleton**

In `backend/src/services/chatbot/ChatbotService.ts`:

Change the import:
```ts
import { FacebookAdapter } from '../messaging/FacebookAdapter.js';
```
to:
```ts
import { facebookAdapter } from '../messaging/FacebookAdapter.js';
```

Change line ~24:
```ts
    return !!(this.GEMINI_API_KEY && FacebookAdapter.isConfigured());
```
to:
```ts
    return !!(this.GEMINI_API_KEY && facebookAdapter.isConfigured());
```

Change line ~133:
```ts
    const fbConfigured = FacebookAdapter.isConfigured();
```
to:
```ts
    const fbConfigured = facebookAdapter.isConfigured();
```

- [ ] **Step 6: Run test + typecheck**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/FacebookAdapter.test.ts && npx tsc --noEmit`
Expected: 3 tests PASS; typecheck clean. (Typecheck confirms no remaining static call sites except `ConversationOrchestrator`, which is still `FacebookAdapter.*` static and WILL error here — that's expected and fixed in Task 6. If the only tsc errors are in `ConversationOrchestrator.ts`, proceed; otherwise fix the other call sites.)

Note: because `ConversationOrchestrator` still uses the old static API until Task 6, `tsc --noEmit` will report errors there. That is acceptable for this task. Confirm the errors are confined to `ConversationOrchestrator.ts`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/messaging/FacebookAdapter.ts backend/src/services/messaging/CommentHandler.ts backend/src/services/chatbot/ChatbotService.ts backend/src/services/messaging/__tests__/FacebookAdapter.test.ts
git commit -m "refactor: FacebookAdapter implements MessagingAdapter as singleton"
```

---

## Task 4: InstagramAdapter (DM only)

**Files:**
- Create: `backend/src/services/messaging/InstagramAdapter.ts`
- Test: `backend/src/services/messaging/__tests__/InstagramAdapter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/InstagramAdapter.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { instagramAdapter } from '../InstagramAdapter.js';

vi.mock('axios');

describe('InstagramAdapter', () => {
  beforeEach(() => {
    process.env.IG_BUSINESS_ACCOUNT_ID = 'IG123';
    process.env.FB_ACCESS_TOKEN = 'TOKEN123';
  });

  it('isConfigured true when ig id and token set', () => {
    expect(instagramAdapter.isConfigured()).toBe(true);
  });

  it('isConfigured false when ig id missing', () => {
    delete process.env.IG_BUSINESS_ACCOUNT_ID;
    expect(instagramAdapter.isConfigured()).toBe(false);
  });

  it('sendTextMessage posts to ig account messages endpoint with igsid recipient', async () => {
    (axios.post as any).mockResolvedValue({ data: { message_id: 'm1' } });
    const id = await instagramAdapter.sendTextMessage('IGSID1', 'hi');
    expect(id).toBe('m1');
    const [url, body] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/IG123/messages');
    expect(body.recipient.id).toBe('IGSID1');
    expect(body.message.text).toBe('hi');
  });

  it('getUserProfile normalizes name/username into first_name', async () => {
    (axios.get as any).mockResolvedValue({ data: { name: 'Jane Doe', username: 'jane' } });
    const profile = await instagramAdapter.getUserProfile('IGSID1');
    expect(profile.id).toBe('IGSID1');
    expect(profile.first_name).toBe('Jane Doe');
    expect(profile.last_name).toBe('');
  });

  it('getUserProfile falls back on error', async () => {
    (axios.get as any).mockRejectedValue(new Error('boom'));
    const profile = await instagramAdapter.getUserProfile('IGSID1');
    expect(profile.first_name).toBe('Instagram');
    expect(profile.last_name).toBe('User');
  });

  it('setTypingIndicator swallows errors', async () => {
    (axios.post as any).mockRejectedValue(new Error('nope'));
    await expect(instagramAdapter.setTypingIndicator('IGSID1', 'on')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/InstagramAdapter.test.ts`
Expected: FAIL — cannot find module `../InstagramAdapter.js`.

- [ ] **Step 3: Create InstagramAdapter**

Create `backend/src/services/messaging/InstagramAdapter.ts`:
```ts
import axios from 'axios';
import type { MessagingAdapter, NormalizedProfile } from './MessagingAdapter.js';

export class InstagramAdapter implements MessagingAdapter {
  private get IG_ID() {
    return process.env.IG_BUSINESS_ACCOUNT_ID || '';
  }

  private get ACCESS_TOKEN() {
    return process.env.FB_ACCESS_TOKEN || '';
  }

  private get BASE_URL() {
    return `https://graph.facebook.com/v21.0/${this.IG_ID}`;
  }

  isConfigured(): boolean {
    return !!(this.IG_ID && this.ACCESS_TOKEN);
  }

  async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: { text: message },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Instagram] Send text error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<NormalizedProfile> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${userId}`, {
        params: {
          fields: 'name,username,profile_pic',
          access_token: this.ACCESS_TOKEN,
        },
      });
      const data = response.data as { name?: string; username?: string; profile_pic?: string };
      return {
        id: userId,
        first_name: data.name || data.username || 'Instagram User',
        last_name: '',
        profile_pic: data.profile_pic,
      };
    } catch (error: any) {
      console.error('[Instagram] Get user profile error:', error.response?.data || error.message);
      return { id: userId, first_name: 'Instagram', last_name: 'User' };
    }
  }

  async setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await axios.post(
        `${this.BASE_URL}/messages`,
        {
          recipient: { id: recipientId },
          sender_action: state === 'on' ? 'typing_on' : 'typing_off',
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Instagram] Typing indicator error:', error.message);
    }
  }
}

export const instagramAdapter = new InstagramAdapter();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/InstagramAdapter.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/InstagramAdapter.ts backend/src/services/messaging/__tests__/InstagramAdapter.test.ts
git commit -m "feat: add InstagramAdapter (DM)"
```

---

## Task 5: adapterRegistry

**Files:**
- Create: `backend/src/services/messaging/adapterRegistry.ts`
- Test: `backend/src/services/messaging/__tests__/adapterRegistry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/adapterRegistry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getAdapter } from '../adapterRegistry.js';
import { FacebookAdapter } from '../FacebookAdapter.js';
import { InstagramAdapter } from '../InstagramAdapter.js';

describe('adapterRegistry', () => {
  it('returns FacebookAdapter for facebook', () => {
    expect(getAdapter('facebook')).toBeInstanceOf(FacebookAdapter);
  });

  it('returns InstagramAdapter for instagram', () => {
    expect(getAdapter('instagram')).toBeInstanceOf(InstagramAdapter);
  });

  it('throws on unknown platform', () => {
    expect(() => getAdapter('twitter' as any)).toThrow('Unknown platform: twitter');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/adapterRegistry.test.ts`
Expected: FAIL — cannot find module `../adapterRegistry.js`.

- [ ] **Step 3: Create the registry**

Create `backend/src/services/messaging/adapterRegistry.ts`:
```ts
import type { MessagingAdapter } from './MessagingAdapter.js';
import { facebookAdapter } from './FacebookAdapter.js';
import { instagramAdapter } from './InstagramAdapter.js';

const adapters: Record<string, MessagingAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
};

export function getAdapter(platform: string): MessagingAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/adapterRegistry.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/adapterRegistry.ts backend/src/services/messaging/__tests__/adapterRegistry.test.ts
git commit -m "feat: add messaging adapter registry"
```

---

## Task 6: Make ConversationOrchestrator platform-aware

**Files:**
- Modify: `backend/src/services/messaging/ConversationOrchestrator.ts`

No new unit test (integration-heavy; exercised via the webhook). Check = typecheck + full suite green. This task also resolves the `tsc` errors left open in Task 3.

- [ ] **Step 1: Update imports**

In `backend/src/services/messaging/ConversationOrchestrator.ts`, replace:
```ts
import { FacebookAdapter } from '../messaging/FacebookAdapter.js';
```
with:
```ts
import { getAdapter } from './adapterRegistry.js';
```

- [ ] **Step 2: Replace `handleIncomingMessage`**

Replace the entire `handleIncomingMessage` method (from `static async handleIncomingMessage(` through its closing `}` before `takeOverConversation`) with:
```ts
  static async handleIncomingMessage(
    platformUserId: string,
    messageText: string,
    platformMessageId?: string,
    platform: string = 'facebook'
  ): Promise<void> {
    console.log(`[Orchestrator] Processing ${platform} message from ${platformUserId}: ${messageText.substring(0, 50)}`);

    const adapter = getAdapter(platform);

    try {
      let conversation = await db.getConversationByPlatformUserId(platformUserId, platform);

      let customerName = 'Customer';
      let profilePic: string | undefined;

      if (!conversation) {
        const userProfile = await adapter.getUserProfile(platformUserId);
        customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
        profilePic = userProfile.profile_pic;

        conversation = await db.createConversation({
          platform_user_id: platformUserId,
          platform,
          customer_name: customerName,
          profile_pic: profilePic,
        });
        console.log(`[Orchestrator] Created new conversation ${conversation.id}`);
      }

      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'customer',
        sender_id: platformUserId,
        sender_name: conversation.customerName ?? undefined,
        content: messageText,
        platform_message_id: platformMessageId,
      });

      if (!conversation.aiMode) {
        console.log(`[Orchestrator] Conversation ${conversation.id} in human mode - awaiting admin response`);
        return;
      }

      const takeoverTrigger = ['মানুষ', 'এজেন্ট', 'talk to human', 'কথা বলতে চাই', 'admin', 'support'];
      const shouldTakeover = takeoverTrigger.some((t) => messageText.toLowerCase().includes(t));

      if (shouldTakeover) {
        await db.updateConversation(conversation.id, {
          ai_mode: false,
          status: 'pending_human',
        });
        console.log(`[Orchestrator] User requested human takeover for conversation ${conversation.id}`);
        return;
      }

      await adapter.setTypingIndicator(platformUserId, 'on');

      console.log(`[Orchestrator] Calling ChatbotService for message: "${messageText.substring(0, 50)}..."`);
      const aiResponse = await ChatbotService.processMessage(
        {
          conversationId: conversation.id,
          platformUserId,
          customerName: conversation.customerName ?? 'Customer',
          customerPhone: conversation.customerPhone ?? undefined,
        },
        messageText
      );

      console.log(`[Orchestrator] AI response received: "${aiResponse.substring(0, 100)}..."`);

      await adapter.sendTextMessage(platformUserId, aiResponse);

      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'ai',
        sender_id: 'system',
        sender_name: 'AI Assistant',
        content: aiResponse,
      });

      await adapter.setTypingIndicator(platformUserId, 'off');
      console.log(`[Orchestrator] AI response sent to ${platformUserId}`);
    } catch (error: any) {
      console.error('[Orchestrator] Error:', error.message);
    }
  }
```

- [ ] **Step 3: Replace `sendAdminMessage`**

Replace the `sendAdminMessage` method with:
```ts
  static async sendAdminMessage(conversationId: string, message: string): Promise<void> {
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const adapter = getAdapter(conversation.platform);
    await adapter.sendTextMessage(conversation.platformUserId, message);

    await db.addMessage({
      conversation_id: conversationId,
      sender: 'admin',
      sender_id: 'admin',
      sender_name: 'Support Team',
      content: message,
    });
  }
```

- [ ] **Step 4: Typecheck + full suite**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: typecheck clean (the Task 3 errors are now resolved); all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/ConversationOrchestrator.ts
git commit -m "refactor: make ConversationOrchestrator platform-aware via adapter registry"
```

---

## Task 7: Disable Facebook comment automation (remove webhook trigger)

**Files:**
- Modify: `backend/src/routes/messagingRoutes.ts`

Remove the `feed`/comment branch from the `object === 'page'` handler. This is the only trigger for `CommentHandler`; the class stays in the tree, unused.

- [ ] **Step 1: Remove the comment branch**

In `backend/src/routes/messagingRoutes.ts`, inside the `if (body.object === 'page')` block, delete the entire feed/comment loop:
```ts
        // Handle feed events (post comments)
        for (const change of entry.changes || []) {
          if (change.field === 'feed') {
            const val = change.value;
            const pageId = process.env.FB_PAGE_ID;
            if (
              val.item === 'comment' &&
              val.verb === 'add' &&
              val.message &&
              pageId &&
              val.from?.id !== pageId
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
Leave the DM (`entry.messaging`) loop intact.

- [ ] **Step 2: Remove the now-unused CommentHandler import**

In `backend/src/routes/messagingRoutes.ts`, delete the import line:
```ts
import { CommentHandler } from '../services/messaging/CommentHandler.js';
```
(`CommentHandler.ts` itself stays in the repo — only the route no longer references it.)

- [ ] **Step 3: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors (no unused-import error since `noUnusedLocals` is not enabled, but removing it is cleaner regardless).

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/messagingRoutes.ts
git commit -m "feat: disable Facebook comment automation (remove webhook trigger)"
```

---

## Task 8: Instagram DM webhook parser + route wiring

**Files:**
- Create: `backend/src/services/messaging/webhookParser.ts`
- Test: `backend/src/services/messaging/__tests__/webhookParser.test.ts`
- Modify: `backend/src/routes/messagingRoutes.ts`

### Part A — pure parser (TDD)

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/webhookParser.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { parseInstagramDms } from '../webhookParser.js';

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

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/webhookParser.test.ts`
Expected: FAIL — cannot find module `../webhookParser.js`.

- [ ] **Step 3: Create the parser**

Create `backend/src/services/messaging/webhookParser.ts`:
```ts
export interface IgDmEvent {
  senderId: string;
  text: string;
  mid?: string;
}

export function parseInstagramDms(body: any): IgDmEvent[] {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  const dms: IgDmEvent[] = [];

  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text;
      const isEcho = messaging.message?.is_echo === true;
      if (senderId && text && !isEcho && senderId !== igId) {
        dms.push({ senderId, text, mid: messaging.message?.mid });
      }
    }
  }

  return dms;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/webhookParser.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/webhookParser.ts backend/src/services/messaging/__tests__/webhookParser.test.ts
git commit -m "feat: add Instagram DM webhook parser"
```

### Part B — wire into the route

- [ ] **Step 6: Import the parser**

In `backend/src/routes/messagingRoutes.ts`, add to the imports block:
```ts
import { parseInstagramDms } from '../services/messaging/webhookParser.js';
```

- [ ] **Step 7: Add the instagram branch**

In `backend/src/routes/messagingRoutes.ts`, find the trailing `else` that logs unknown object types:
```ts
    } else {
      console.log('[Webhook] Unknown object type:', body.object);
    }
```
Replace it with:
```ts
    } else if (body.object === 'instagram') {
      res.status(200).send('OK');

      const dms = parseInstagramDms(body);
      console.log(`[Webhook] Instagram: ${dms.length} dm(s)`);

      for (const dm of dms) {
        console.log(`[Webhook] IG message from ${dm.senderId}: ${dm.text}`);
        await ConversationOrchestrator.handleIncomingMessage(dm.senderId, dm.text, dm.mid, 'instagram');
      }
    } else {
      console.log('[Webhook] Unknown object type:', body.object);
    }
```

- [ ] **Step 8: Verify ConversationOrchestrator import present**

Run: `grep -n "ConversationOrchestrator" backend/src/routes/messagingRoutes.ts`
Expected: import line present (already used by the `page` branch). No change needed.

- [ ] **Step 9: Typecheck + full suite**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: typecheck clean; all tests pass.

- [ ] **Step 10: Commit**

```bash
git add backend/src/routes/messagingRoutes.ts
git commit -m "feat: handle Instagram DM webhook events in route"
```

---

## Task 9: Config / env

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add IG env var**

Append to `backend/.env`:
```
IG_BUSINESS_ACCOUNT_ID=
```
Leave the value blank for the deployer (the Instagram-scoped business account id). `FB_ACCESS_TOKEN` + `FB_VERIFY_TOKEN` reused.

- [ ] **Step 2: Commit**

First check whether `.env` is tracked: `git check-ignore backend/.env`.
- If it prints nothing (tracked): commit it.
```bash
git add backend/.env
git commit -m "chore: add IG_BUSINESS_ACCOUNT_ID env var

Meta app setup (manual): subscribe instagram product, webhook field
messages only (no comments), grant instagram_manage_messages."
```
- If it prints the path (gitignored): skip the commit; add `IG_BUSINESS_ACCOUNT_ID=` to a committed `.env.example` if one exists, otherwise just note the variable in the PR description. Report which path was taken.

---

## Final Verification

- [ ] **Full suite:** `cd backend && npm test` → all tests pass.
- [ ] **Typecheck:** `cd backend && npx tsc --noEmit` → no errors.
- [ ] **Build:** `cd backend && npm run build` → compiles clean.
- [ ] **No stray static FacebookAdapter calls:** `grep -rn "FacebookAdapter\.\(send\|get\|set\|reply\|isConfigured\|verify\)" backend/src --include=*.ts | grep -v "__tests__"` → returns nothing (all migrated to the singleton).
- [ ] **Comment automation off:** confirm `backend/src/routes/messagingRoutes.ts` has no `CommentHandler` reference and no `field === 'feed'` branch.
