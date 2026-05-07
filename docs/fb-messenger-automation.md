# Facebook Messenger Automation - Technical Documentation

## Architecture Overview

```
User Message → Facebook Webhook → ConversationOrchestrator → ChatbotService → Facebook Adapter → User
                ↓
           Database (conversations, messages)
```

---

## 1. Webhook Verification

**Endpoint**: `GET /webhooks/facebook`

From `messagingRoutes.ts`:

### Verification Process

1. Facebook sends GET request with:
   - `hub.mode` = "subscribe"
   - `hub.verify_token` = "saajba_webhook_verify" (from .env)
   - `hub.challenge` = random string

2. Server validates: `mode === "subscribe" && token === FB_VERIFY_TOKEN`

3. Returns `hub.challenge` back to Facebook to confirm subscription

This happens when you set up the webhook in Facebook Developer Console.

### Code Reference

```typescript
// backend/src/routes/messagingRoutes.ts:12-26
router.get('/webhooks/facebook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.FB_VERIFY_TOKEN || 'saajba_webhook_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Facebook verified');
    res.status(200).send(challenge);
  } else {
    console.log('[Webhook] Verification failed');
    res.status(403).send('Verification failed');
  }
});
```

---

## 2. Webhook Message Handler

**Endpoint**: `POST /webhooks/facebook`

### Flow

1. Receives POST payload from Facebook (JSON)
2. Immediately returns 200 OK (Facebook expects this within 5s)
3. Processes each entry in `body.entry[]`
4. Extracts: sender ID, message text, message ID
5. Passes to `ConversationOrchestrator.handleIncomingMessage()`

### Code Reference

```typescript
// backend/src/routes/messagingRoutes.ts:28-59
router.post('/webhooks/facebook', async (req: Request, res: Response) => {
  console.log('[Webhook] Facebook message received');

  try {
    const body = req.body;

    if (body.object === 'page') {
      // Send 200 immediately
      res.status(200).send('OK');

      // Process each entry
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          const senderId = messaging.sender?.id;
          const messageText = messaging.message?.text;
          const messageId = messaging.message?.mid;

          if (senderId && messageText) {
            console.log(`[Webhook] Message from ${senderId}: ${messageText}`);
            await ConversationOrchestrator.handleIncomingMessage(senderId, messageText, messageId);
          }
        }
      }
    } else {
      console.log('[Webhook] Unknown object type');
    }
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message);
    res.status(500).send('Error');
  }
});
```

---

## 3. Conversation Orchestrator

From `ConversationOrchestrator.ts`:

### Flow

1. **Get/Create Conversation** - Looks up by `platform_user_id` in `conversations` table. If new, fetches FB profile (name, profile pic) and creates record.

2. **Save User Message** - Stores in `messages` table with sender="customer"

3. **Human Takeover Check** - If `ai_mode=false` (already taken over), skips AI processing

4. **Takeover Trigger Detection** - Triggers on keywords:
   ```typescript
   const takeoverTrigger = ['মানুষ', 'এজেন্ট', 'talk to human', 'কথা বলতে চাই', 'admin', 'support'];
   ```

5. **AI Processing** - Sends to ChatbotService with:
   - conversation ID
   - user ID
   - customer name
   - last 10 messages for context

6. **Send Response** - Uses `FacebookAdapter.sendTextMessage()` to reply

7. **Save AI Response** - Stores in `messages` table with sender="ai"

### Code Reference

```typescript
// backend/src/services/messaging/ConversationOrchestrator.ts:6-95
static async handleIncomingMessage(
  platformUserId: string,
  messageText: string,
  platformMessageId?: string
): Promise<void> {
  // Get or create conversation
  let conversation = await db.getConversationByPlatformUserId(platformUserId, 'facebook');

  if (!conversation) {
    // Get user profile from Facebook
    const userProfile = await FacebookAdapter.getUserProfile(platformUserId);
    customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();

    conversation = await db.createConversation({
      platform_user_id: platformUserId,
      platform: 'facebook',
      customer_name: customerName,
      profile_pic: profilePic
    });
  }

  // Save user message
  await db.addMessage({
    conversation_id: conversation.id,
    sender: 'customer',
    sender_id: platformUserId,
    sender_name: conversation.customer_name,
    content: messageText,
    platform_message_id: platformMessageId
  });

  // Check if human takeover
  if (!conversation.ai_mode) {
    return; // Human mode - awaiting admin response
  }

  // Check for human takeover trigger
  const shouldTakeover = takeoverTrigger.some(t => messageText.toLowerCase().includes(t));

  if (shouldTakeover) {
    await db.updateConversation(conversation.id, {
      ai_mode: false,
      status: 'pending_human'
    });
    return;
  }

  // Send typing indicator
  await FacebookAdapter.setTypingIndicator(platformUserId, 'on');

  // Process with AI
  const aiResponse = await ChatbotService.processMessage({...}, messageText);

  // Send response to user
  await FacebookAdapter.sendTextMessage(platformUserId, aiResponse);

  // Save AI response
  await db.addMessage({
    conversation_id: conversation.id,
    sender: 'ai',
    sender_id: 'system',
    sender_name: 'AI Assistant',
    content: aiResponse
  });
}
```

---

## 4. Chatbot Service (AI Brain)

From `ChatbotService.ts`:

### System Prompt

```
You are the official AI assistant for Saajba Facebook Page.
You help customers discover products, answer questions, and complete orders seamlessly.
Always communicate in Bangla — sound natural, friendly, and human-like.

Business Context:
- Brand: Saajba
- Products: All skincare, hair care and other beauty products
- Human Support Hotline: 0173543636
- Website: shajba.com
```

### Available Tools

1. **checkUserOrderHistory(phone)** - Checks WooCommerce orders, calculates success rate
2. **getProductDetails(search)** - Searches WooCommerce products
3. **placeOrder(...)** - Creates order in WooCommerce

### Rules

- Always reply in Bangla (unless customer explicitly uses English)
- Check order history BEFORE accepting orders
- Decline if success rate < 70%
- Never fabricate product info
- Every order MUST include: Full Name, Phone Number, Complete Delivery Address, Product (Name), Quantity, Email

### Code Reference

```typescript
// backend/src/services/chatbot/ChatbotService.ts:134-211
static async processMessage(context: ChatContext, userMessage: string): Promise<string> {
  if (!this.isConfigured()) {
    return 'আমাদের সিস্টেমে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পরে চেষ্টা করুন।';
  }

  // Get conversation history (last 10 messages)
  const historyResult = await query(
    `SELECT sender, content FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [context.conversationId]
  );

  // Build prompt with context
  const systemPrompt = this.buildSystemPrompt(context);
  const fullPrompt = `${systemPrompt}

আগের কথোপকথন:
${conversationHistory}

গ্রাহকের নতুন বার্তা: ${userMessage}

নির্দেশনা:
- প্রথমে গ্রাহকের অর্ডার ইতিহাস চেক করুন (ফোন নম্বর দিয়ে)
- তারপর প্রোডাক্ট সার্চ করুন প্রয়োজনে
- অর্ডার নেওয়ার আগে অবশ্যই অর্ডার ইতিহাস চেক করুন
- ৭০% এর বেশি সাফল্য হলে অর্ডার নিন, নাহলে নিন না`;

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`,
    {...}
  );

  return aiResponse;
}
```

---

## 5. Facebook Adapter (Sending Messages)

From `FacebookAdapter.ts`:

### Capabilities

- `sendTextMessage()` - Send text
- `sendQuickReply()` - Buttons with payloads
- `sendAttachment()` - Image/audio/video/file
- `getUserProfile()` - Fetch user name, profile pic
- `setTypingIndicator()` - Show "typing..." bubble

### API Endpoint

Uses Graph API v21.0:
```
https://graph.facebook.com/v21.0/{PAGE_ID}/messages
```

### Code Reference

```typescript
// backend/src/services/messaging/FacebookAdapter.ts
private static get BASE_URL() {
  return `https://graph.facebook.com/v21.0/${this.PAGE_ID}`;
}

static async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
  const response = await axios.post(
    `${this.BASE_URL}/messages`,
    {
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: { text: message }
    },
    {
      params: { access_token: this.ACCESS_TOKEN }
    }
  );
  return response.data.message_id || null;
}
```

---

## 6. Database Schema

### Tables

**conversations**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| platform_user_id | string | Facebook user ID |
| platform | string | 'facebook' |
| customer_name | string | User's name from FB profile |
| profile_pic | string | URL to profile picture |
| customer_phone | string | Phone number (collected during chat) |
| ai_mode | boolean | true = AI handling, false = human |
| status | string | 'active', 'pending_human', 'human' |
| assigned_to | string | Admin ID if assigned |
| created_at | timestamp | Creation time |

**messages**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| sender | string | 'customer', 'ai', 'admin' |
| sender_id | string | Platform user ID or 'system'/'admin' |
| sender_name | string | Display name |
| content | string | Message text |
| platform_message_id | string | Facebook message ID |
| created_at | timestamp | Creation time |

---

## 7. Admin Controls

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messaging/conversations` | List all conversations |
| GET | `/api/messaging/conversations/:id` | Get single conversation with messages |
| POST | `/api/messaging/conversations/:id/takeover` | Admin takes over |
| POST | `/api/messaging/conversations/:id/return-to-ai` | Hands back to AI |
| POST | `/api/messaging/conversations/:id/message` | Admin replies manually |
| GET | `/api/messaging/stats` | Get messaging statistics |

---

## 8. Configuration

### Environment Variables (.env)

```env
# Facebook Messenger Configuration
FB_PAGE_ID=103737791438607
FB_ACCESS_TOKEN=EAAN3wGT4FfIBRdvgzdZCWv5qAdxI7zqcfvwWYipgbAKL3...
FB_VERIFY_TOKEN=saajba_webhook_verify

# AI
GEMINI_API_KEY=your_gemini_api_key
```

### Verification Summary

The webhook is verified through the standard Facebook Messenger verification process:

1. You register the webhook URL in Facebook Developer Console (Meta for Developers)
2. Facebook sends a GET request to your `/webhooks/facebook` endpoint
3. Your server validates the `hub.verify_token` against `FB_VERIFY_TOKEN` in `.env`
4. Server returns the `hub.challenge` string
5. Facebook confirms the subscription
6. After verification, Facebook sends POST requests for each incoming message

---

## 9. Human Takeover Flow

### Trigger Keywords
- মানুষ (human)
- এজেন্ট (agent)
- talk to human
- কথা বলতে চাই (want to talk)
- admin
- support

### Flow
1. User sends message containing trigger keyword
2. Orchestrator sets `ai_mode = false` and `status = 'pending_human'`
3. Admin sees conversation in dashboard
4. Admin takes over via `/takeover` endpoint
5. Admin replies via `/message` endpoint
6. Optionally, admin returns to AI via `/return-to-ai`

---

## 10. Full URL

### Webhook URL

```
Production: https://your-domain.com/webhooks/facebook
Local: http://localhost:5000/webhooks/facebook
```

### Verify Token
```
saajba_webhook_verify
```