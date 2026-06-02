# Instagram Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Instagram DM auto-reply and Instagram comment→private-DM handoff alongside the existing Facebook messaging/comment automation.

**Architecture:** Introduce a `MessagingAdapter` interface implemented by `FacebookAdapter` and a new `InstagramAdapter`, resolved per-conversation by an `adapterRegistry`. `ConversationOrchestrator` and `CommentHandler` become platform-aware (default `'facebook'`, FB callers unchanged). The shared `POST /webhooks/facebook` route gains an `object === 'instagram'` branch. No DB migration — `conversations.platform` already exists.

**Tech Stack:** TypeScript (NodeNext ESM), Express, Prisma, axios, Meta Graph API v21.0. Tests via **vitest** (new dev dependency).

---

## File Structure

- `backend/vitest.config.ts` — NEW, vitest config.
- `backend/package.json` — MODIFY, add vitest + `test` script.
- `backend/src/services/messaging/MessagingAdapter.ts` — NEW, interface + shared types.
- `backend/src/services/messaging/FacebookAdapter.ts` — MODIFY, `implements MessagingAdapter` + add `sendPrivateReply`.
- `backend/src/services/messaging/InstagramAdapter.ts` — NEW.
- `backend/src/services/messaging/adapterRegistry.ts` — NEW, `getAdapter(platform)`.
- `backend/src/services/messaging/webhookParser.ts` — NEW, pure parser for IG webhook entries (testable).
- `backend/src/services/messaging/ConversationOrchestrator.ts` — MODIFY, platform-aware via registry.
- `backend/src/services/messaging/CommentHandler.ts` — MODIFY, platform-aware + IG private reply + dedup.
- `backend/src/routes/messagingRoutes.ts` — MODIFY, add `object:'instagram'` branch.
- `backend/.env` — MODIFY, add `IG_BUSINESS_ACCOUNT_ID`.

Test files (co-located under `backend/src/services/messaging/__tests__/`):
- `InstagramAdapter.test.ts`, `adapterRegistry.test.ts`, `CommentHandler.test.ts`, `webhookParser.test.ts`, `FacebookAdapter.test.ts`.

---

## Task 1: Set up vitest

**Files:**
- Modify: `backend/package.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/src/services/messaging/__tests__/smoke.test.ts`

- [ ] **Step 1: Install vitest**

Run:
```bash
cd backend && npm install -D vitest
```
Expected: vitest added to devDependencies, exit 0.

- [ ] **Step 2: Add test script to package.json**

In `backend/package.json`, change the `scripts` block to:
```json
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Create vitest config**

Create `backend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
});
```

- [ ] **Step 4: Write a smoke test**

Create `backend/src/services/messaging/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `cd backend && npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/vitest.config.ts backend/src/services/messaging/__tests__/smoke.test.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: MessagingAdapter interface

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
  replyToComment(commentId: string, message: string): Promise<void>;
  sendPrivateReply(commentId: string, message: string): Promise<string | null>;
}

export type Platform = 'facebook' | 'instagram';
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/messaging/MessagingAdapter.ts
git commit -m "feat: add MessagingAdapter interface"
```

---

## Task 3: FacebookAdapter implements interface

**Files:**
- Modify: `backend/src/services/messaging/FacebookAdapter.ts`
- Test: `backend/src/services/messaging/__tests__/FacebookAdapter.test.ts`

`FacebookAdapter` is currently a class with `static` methods. The interface is instance-shaped. To satisfy `implements MessagingAdapter` without rewriting every call site at once, convert the static methods to instance methods and export a singleton. Call sites are updated in Tasks 6–7.

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

  it('sendPrivateReply throws (unsupported for FB)', async () => {
    await expect(facebookAdapter.sendPrivateReply('C1', 'x')).rejects.toThrow(
      'Facebook private reply not supported'
    );
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

  async sendPrivateReply(_commentId: string, _message: string): Promise<string | null> {
    throw new Error('Facebook private reply not supported');
  }
}

export const facebookAdapter = new FacebookAdapter();
```

Note: the static `sendMessage` and `verifyWebhook` methods are dropped. `verifyWebhook` was unused (the route checks the token inline). If a grep shows `FacebookAdapter.sendMessage(` or `FacebookAdapter.verifyWebhook(` used anywhere, add the missing method instead of dropping it. Run `grep -rn "FacebookAdapter.sendMessage\|FacebookAdapter.verifyWebhook\|FacebookAdapter.getUserProfile\|FacebookAdapter.sendTextMessage\|FacebookAdapter.setTypingIndicator\|FacebookAdapter.replyToComment\|FacebookAdapter.sendQuickReply\|FacebookAdapter.sendAttachment" backend/src` first; all static call sites are updated in Tasks 6–7, but confirm none are missed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/FacebookAdapter.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/FacebookAdapter.ts backend/src/services/messaging/__tests__/FacebookAdapter.test.ts
git commit -m "refactor: FacebookAdapter implements MessagingAdapter as singleton"
```

---

## Task 4: InstagramAdapter

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

  it('sendPrivateReply posts with comment_id recipient', async () => {
    (axios.post as any).mockResolvedValue({ data: { message_id: 'm2' } });
    const id = await instagramAdapter.sendPrivateReply('CMT1', 'check dm');
    expect(id).toBe('m2');
    const [url, body] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/IG123/messages');
    expect(body.recipient.comment_id).toBe('CMT1');
    expect(body.message.text).toBe('check dm');
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

  it('replyToComment posts to comment replies endpoint', async () => {
    (axios.post as any).mockResolvedValue({ data: {} });
    await instagramAdapter.replyToComment('CMT1', 'hello');
    const [url] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/CMT1/replies');
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

  async sendPrivateReply(commentId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          recipient: { comment_id: commentId },
          message: { text: message },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Instagram] Private reply error:', error.response?.data || error.message);
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

  async replyToComment(commentId: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${commentId}/replies`,
        { message },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Instagram] Reply to comment error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const instagramAdapter = new InstagramAdapter();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/InstagramAdapter.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/InstagramAdapter.ts backend/src/services/messaging/__tests__/InstagramAdapter.test.ts
git commit -m "feat: add InstagramAdapter"
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
- Modify: `backend/src/services/chatbot/ChatbotService.ts` (migrate static `FacebookAdapter.isConfigured()` calls)

This task has no new unit test (the orchestrator is integration-heavy and exercised via the webhook in Task 8). The check is a typecheck + the existing FB flow staying intact. Replace direct `FacebookAdapter.*` static calls with `getAdapter(platform)`.

- [ ] **Step 1: Update imports**

In `backend/src/services/messaging/ConversationOrchestrator.ts`, replace the import line:
```ts
import { FacebookAdapter } from '../messaging/FacebookAdapter.js';
```
with:
```ts
import { getAdapter } from './adapterRegistry.js';
```

- [ ] **Step 2: Update `handleIncomingMessage` signature and body**

Replace the `handleIncomingMessage` method (everything from `static async handleIncomingMessage(` through its closing `}` before `takeOverConversation`) with:
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

- [ ] **Step 3: Update `sendAdminMessage` to resolve adapter from conversation platform**

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

- [ ] **Step 4: Migrate ChatbotService static FacebookAdapter calls**

`Task 3` removed the static `FacebookAdapter.isConfigured()`. `ChatbotService` calls it at two sites. In `backend/src/services/chatbot/ChatbotService.ts`:

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

- [ ] **Step 5: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Run full test suite (FB adapter tests still pass)**

Run: `cd backend && npm test`
Expected: PASS, all prior tests green.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/messaging/ConversationOrchestrator.ts backend/src/services/chatbot/ChatbotService.ts
git commit -m "refactor: make ConversationOrchestrator platform-aware via adapter registry"
```

---

## Task 7: Make CommentHandler platform-aware with IG private reply + dedup

**Files:**
- Modify: `backend/src/services/messaging/CommentHandler.ts`
- Test: `backend/src/services/messaging/__tests__/CommentHandler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/CommentHandler.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../adapterRegistry.js', () => {
  const fb = { replyToComment: vi.fn(), sendPrivateReply: vi.fn() };
  const ig = { replyToComment: vi.fn(), sendPrivateReply: vi.fn() };
  return {
    getAdapter: (platform: string) => (platform === 'instagram' ? ig : fb),
    __fb: fb,
    __ig: ig,
  };
});

vi.mock('../../chatbot/ChatbotService.js', () => ({
  ChatbotService: { processMessage: vi.fn().mockResolvedValue('AI ANSWER') },
}));

import { CommentHandler } from '../CommentHandler.js';
import * as registry from '../adapterRegistry.js';

const fb = (registry as any).__fb;
const ig = (registry as any).__ig;

describe('CommentHandler', () => {
  beforeEach(() => {
    fb.replyToComment.mockClear();
    fb.sendPrivateReply.mockClear();
    ig.replyToComment.mockClear();
    ig.sendPrivateReply.mockClear();
    CommentHandler._resetProcessed();
  });

  it('facebook comment uses public replyToComment', async () => {
    await CommentHandler.handleComment('FBC1', 'Bob', 'price?', 'facebook');
    expect(fb.replyToComment).toHaveBeenCalledWith('FBC1', 'AI ANSWER');
    expect(fb.sendPrivateReply).not.toHaveBeenCalled();
  });

  it('instagram comment uses private reply only', async () => {
    await CommentHandler.handleComment('IGC1', 'Ann', 'price?', 'instagram');
    expect(ig.sendPrivateReply).toHaveBeenCalledWith('IGC1', 'AI ANSWER');
    expect(ig.replyToComment).not.toHaveBeenCalled();
  });

  it('dedups repeated comment ids', async () => {
    await CommentHandler.handleComment('IGC2', 'Ann', 'price?', 'instagram');
    await CommentHandler.handleComment('IGC2', 'Ann', 'price?', 'instagram');
    expect(ig.sendPrivateReply).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/CommentHandler.test.ts`
Expected: FAIL — `_resetProcessed` / platform arg not implemented.

- [ ] **Step 3: Rewrite CommentHandler**

Replace the full contents of `backend/src/services/messaging/CommentHandler.ts` with:
```ts
import { getAdapter } from './adapterRegistry.js';
import { ChatbotService } from '../chatbot/ChatbotService.js';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export class CommentHandler {
  private static processed = new Set<string>();

  /** Test helper: clear the dedup cache. */
  static _resetProcessed(): void {
    this.processed.clear();
  }

  static async handleComment(
    commentId: string,
    commenterName: string,
    commentText: string,
    platform: string = 'facebook'
  ): Promise<void> {
    if (this.processed.has(commentId)) {
      console.log(`[CommentHandler] Skipping already-processed comment ${commentId}`);
      return;
    }
    this.processed.add(commentId);

    console.log(
      `[CommentHandler] (${platform}) Replying to comment ${commentId} from ${commenterName}: ${commentText.substring(0, 80)}`
    );

    try {
      const adapter = getAdapter(platform);

      const aiReply = await ChatbotService.processMessage(
        {
          conversationId: ZERO_UUID,
          platformUserId: commentId,
          customerName: commenterName,
        },
        commentText
      );

      if (platform === 'instagram') {
        // Instagram: private DM only, no public reply.
        await adapter.sendPrivateReply(commentId, aiReply);
      } else {
        // Facebook: public reply under the comment.
        await adapter.replyToComment(commentId, aiReply);
      }

      console.log(`[CommentHandler] Replied to ${commentId}`);
    } catch (error: any) {
      console.error(`[CommentHandler] Failed to reply to comment ${commentId}:`, error.message);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/CommentHandler.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/CommentHandler.ts backend/src/services/messaging/__tests__/CommentHandler.test.ts
git commit -m "feat: CommentHandler platform-aware with IG private reply and dedup"
```

---

## Task 8: Instagram webhook parser + route wiring

**Files:**
- Create: `backend/src/services/messaging/webhookParser.ts`
- Test: `backend/src/services/messaging/__tests__/webhookParser.test.ts`
- Modify: `backend/src/routes/messagingRoutes.ts`

### Part A — pure parser (TDD)

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/messaging/__tests__/webhookParser.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { parseInstagramEvents } from '../webhookParser.js';

describe('parseInstagramEvents', () => {
  beforeEach(() => {
    process.env.IG_BUSINESS_ACCOUNT_ID = 'IG123';
  });

  it('extracts a DM event', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            { sender: { id: 'IGSID1' }, message: { mid: 'mid1', text: 'hello' } },
          ],
        },
      ],
    };
    const result = parseInstagramEvents(body);
    expect(result.dms).toEqual([{ senderId: 'IGSID1', text: 'hello', mid: 'mid1' }]);
    expect(result.comments).toEqual([]);
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
    expect(parseInstagramEvents(body).dms).toEqual([]);
  });

  it('extracts a comment event', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          changes: [
            {
              field: 'comments',
              value: { id: 'CMT1', text: 'price?', from: { id: 'U9', username: 'ann' } },
            },
          ],
        },
      ],
    };
    const result = parseInstagramEvents(body);
    expect(result.comments).toEqual([{ commentId: 'CMT1', username: 'ann', text: 'price?' }]);
  });

  it('skips comments from the business account itself', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          changes: [
            {
              field: 'comments',
              value: { id: 'CMT1', text: 'hi', from: { id: 'IG123', username: 'me' } },
            },
          ],
        },
      ],
    };
    expect(parseInstagramEvents(body).comments).toEqual([]);
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

export interface IgCommentEvent {
  commentId: string;
  username: string;
  text: string;
}

export interface IgEvents {
  dms: IgDmEvent[];
  comments: IgCommentEvent[];
}

export function parseInstagramEvents(body: any): IgEvents {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  const dms: IgDmEvent[] = [];
  const comments: IgCommentEvent[] = [];

  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text;
      const isEcho = messaging.message?.is_echo === true;
      if (senderId && text && !isEcho && senderId !== igId) {
        dms.push({ senderId, text, mid: messaging.message?.mid });
      }
    }

    for (const change of entry.changes || []) {
      if (change.field !== 'comments') continue;
      const val = change.value || {};
      if (val.id && val.text && val.from?.id !== igId) {
        comments.push({
          commentId: val.id,
          username: val.from?.username ?? 'User',
          text: val.text,
        });
      }
    }
  }

  return { dms, comments };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/messaging/__tests__/webhookParser.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messaging/webhookParser.ts backend/src/services/messaging/__tests__/webhookParser.test.ts
git commit -m "feat: add Instagram webhook event parser"
```

### Part B — wire into the route

- [ ] **Step 6: Import the parser in messagingRoutes**

In `backend/src/routes/messagingRoutes.ts`, add to the imports block (after the `CommentHandler` import):
```ts
import { parseInstagramEvents } from '../services/messaging/webhookParser.js';
```

- [ ] **Step 7: Add the instagram branch in the POST handler**

In `backend/src/routes/messagingRoutes.ts`, find the `else` that currently logs unknown object types:
```ts
    } else {
      console.log('[Webhook] Unknown object type:', body.object);
    }
```
Replace it with:
```ts
    } else if (body.object === 'instagram') {
      res.status(200).send('OK');

      const { dms, comments } = parseInstagramEvents(body);
      console.log(`[Webhook] Instagram: ${dms.length} dm(s), ${comments.length} comment(s)`);

      for (const dm of dms) {
        console.log(`[Webhook] IG message from ${dm.senderId}: ${dm.text}`);
        await ConversationOrchestrator.handleIncomingMessage(dm.senderId, dm.text, dm.mid, 'instagram');
      }

      for (const c of comments) {
        console.log(`[Webhook] IG comment from ${c.username}: ${c.text.substring(0, 80)}`);
        await CommentHandler.handleComment(c.commentId, c.username, c.text, 'instagram');
      }
    } else {
      console.log('[Webhook] Unknown object type:', body.object);
    }
```

- [ ] **Step 8: Add ConversationOrchestrator import check**

Confirm `ConversationOrchestrator` is already imported in `messagingRoutes.ts` (it is, used by the `page` branch). No change needed — this step is a verification only.

Run: `grep -n "ConversationOrchestrator" backend/src/routes/messagingRoutes.ts`
Expected: import line present.

- [ ] **Step 9: Typecheck + full suite**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: typecheck clean; all tests pass.

- [ ] **Step 10: Commit**

```bash
git add backend/src/routes/messagingRoutes.ts
git commit -m "feat: handle Instagram webhook events (DM + comment) in route"
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
Leave the value blank for the deployer to fill (the Instagram-scoped business account id). `FB_ACCESS_TOKEN` and `FB_VERIFY_TOKEN` are reused — no new token rows.

- [ ] **Step 2: Document Meta app setup (commit message body)**

No code change. Record the manual Meta dashboard steps in the commit message: subscribe the `instagram` product, set webhook fields `messages` + `comments` on the same callback URL, and grant `instagram_manage_messages` + `instagram_manage_comments` permissions.

- [ ] **Step 3: Commit**

```bash
git add backend/.env
git commit -m "chore: add IG_BUSINESS_ACCOUNT_ID env var

Meta app setup (manual): subscribe instagram product, webhook fields
messages + comments on existing callback URL, grant
instagram_manage_messages + instagram_manage_comments permissions."
```

> Note: if `backend/.env` is gitignored, skip the commit and instead add the variable to any committed `.env.example` (run `git check-ignore backend/.env` to confirm). If no example file exists, document the variable in the PR description.

---

## Final Verification

- [ ] **Run the full suite:** `cd backend && npm test` → all tests pass.
- [ ] **Typecheck:** `cd backend && npx tsc --noEmit` → no errors.
- [ ] **Build:** `cd backend && npm run build` → compiles clean.
- [ ] **FB regression (manual sanity):** confirm `FacebookAdapter` static call sites were all migrated — `grep -rn "FacebookAdapter\." backend/src --include=*.ts | grep -v "__tests__" | grep -v "FacebookAdapter.ts"` should return nothing except possibly `ChatbotService.ts` (see note below).

> **ChatbotService note:** `ChatbotService` uses `FacebookAdapter.isConfigured()` as a static at two sites (lines ~24 and ~133). These are migrated to the `facebookAdapter` singleton in Task 6 Step 4 — the only call sites outside the messaging module. The grep above should return nothing once that step is done.
```
