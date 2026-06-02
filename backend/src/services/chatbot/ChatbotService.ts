import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { facebookAdapter } from '../messaging/FacebookAdapter.js';
import { getActiveProvider } from '../commerce/index.js';
import { buildTools } from './tools.js';
import prisma from '../../config/db.js';

interface ChatContext {
  conversationId: string;
  platformUserId: string;
  customerName: string;
  customerPhone?: string;
}

const MAX_TOOL_HOPS = 5;

export class ChatbotService {
  private static get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY || '';
  }

  static isConfigured(): boolean {
    return !!(this.GEMINI_API_KEY && facebookAdapter.isConfigured());
  }

  static async processMessage(context: ChatContext, userMessage: string): Promise<string> {
    const geminiKeyConfigured = !!this.GEMINI_API_KEY;
    const fbConfigured = facebookAdapter.isConfigured();
    console.log(`[Chatbot] isConfigured check - Gemini: ${geminiKeyConfigured}, Facebook: ${fbConfigured}`);

    if (!this.isConfigured()) {
      console.error('[Chatbot] NOT CONFIGURED - Gemini key or FB adapter missing!');
      return 'আমাদের সিস্টেমে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পরে চেষ্টা করুন।';
    }

    if (userMessage.toLowerCase().includes('মানুষ') ||
        userMessage.toLowerCase().includes('এজেন্ট') ||
        userMessage.toLowerCase().includes('talk to human') ||
        userMessage.toLowerCase().includes('কথা বলতে চাই')) {
      return 'আপনার অনুরোধে আমাদা টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।';
    }

    const historyRows = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { sender: true, content: true },
    });
    const history: Content[] = historyRows
      .reverse()
      .map((m) => ({
        role: m.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const provider = getActiveProvider();
    const { declarations, handlers } = buildTools(provider);
    console.log(`[Chatbot] Active commerce provider: ${provider?.name ?? 'none'} | tools: ${declarations.length}`);

    try {
      const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: this.buildSystemPrompt(context),
        tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
      });

      const chat = model.startChat({
        history,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      });

      let result = await chat.sendMessage(userMessage);

      for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
        const calls = result.response.functionCalls();
        if (!calls || calls.length === 0) break;

        const responses = [];
        for (const call of calls) {
          console.log(`[Chatbot] Tool call: ${call.name}`, JSON.stringify(call.args));
          const handler = handlers[call.name];
          const out = handler
            ? await handler(call.args)
            : { success: false, error: `Unknown tool: ${call.name}` };
          responses.push({ functionResponse: { name: call.name, response: out } });
        }

        result = await chat.sendMessage(responses);
      }

      const text = result.response.text();
      if (!text || text.trim() === '') {
        console.error('[Chatbot] Empty response from Gemini - returning fallback');
        return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
      }
      return text;
    } catch (error: any) {
      console.error('[Chatbot] Exception:', error.message);
      console.error('[Chatbot] Stack:', error.stack);
      return 'দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    }
  }

  private static buildSystemPrompt(context: ChatContext): string {
    return `You are the official AI assistant for Saajba Facebook Page.
You help customers discover products, answer questions, and complete orders seamlessly.
Always communicate in Bangla — sound natural, friendly, and human-like.

Business Context:
- Brand: Saajba
- Products: All skincare, hair care and other beauty products
- Human Support Hotline: 0173543636
- Website: shajba.com

Your Capabilities (via tools):
- get_available_products — list products in the store
- get_product_details — search products by name/keyword
- check_order_history — check a customer's past delivery success rate by phone
- place_order — create an order

Non-Negotiable Rules (MUST DO):
🔴 CRITICAL REQUIREMENTS:
- Always reply in Bangla (unless customer explicitly uses English)
- NEVER fabricate product info — always use the tools to verify products and prices
- Every order MUST include: Full Name, Phone Number, Complete Delivery Address, City, Product Name, Quantity, Email
- Confirm the order details with the customer before calling place_order
- You MAY place the order once all required fields are collected — do not refuse based on delivery history (fraud risk is handled automatically on our side)

Important:
- If customer asks to talk to human, respond: "আপনার অনুরোধে আমাদা টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।"
- Don't expose internal logic or tool names to the customer
- When unsure, ask the customer politely
- Provide hotline 0173543636 when needed

Customer: ${context.customerName}
Phone: ${context.customerPhone || 'Not provided'}

Start the conversation naturally!`;
  }
}
