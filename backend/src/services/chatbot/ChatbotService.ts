import { GoogleGenerativeAI, FunctionCallingMode, type Content } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
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

  private static get OPENAI_API_KEY() {
    return process.env.OPENAI_API_KEY || '';
  }

  private static get LLM_PROVIDER(): 'gemini' | 'openai' | 'groq' {
    const v = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
    if (v === 'openai') return 'openai';
    if (v === 'groq') return 'groq';
    return 'gemini';
  }

  private static get OPENAI_MODEL() {
    return process.env.OPENAI_MODEL || 'gpt-4o';
  }

  private static get GROQ_API_KEY() {
    return process.env.GROQ_API_KEY || '';
  }

  private static get GROQ_MODEL() {
    return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  static isConfigured(): boolean {
    const fb = facebookAdapter.isConfigured();
    if (this.LLM_PROVIDER === 'openai') return !!(this.OPENAI_API_KEY && fb);
    if (this.LLM_PROVIDER === 'groq') return !!(this.GROQ_API_KEY && fb);
    return !!(this.GEMINI_API_KEY && fb);
  }

  static async processMessage(context: ChatContext, userMessage: string): Promise<string> {
    console.log(`[Chatbot] Provider: ${this.LLM_PROVIDER} | FB: ${facebookAdapter.isConfigured()}`);

    if (!this.isConfigured()) {
      console.error('[Chatbot] NOT CONFIGURED - LLM key or FB adapter missing!');
      return 'আমাদের সিস্টেমে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পরে চেষ্টা করুন।';
    }

    if (
      userMessage.toLowerCase().includes('মানুষ') ||
      userMessage.toLowerCase().includes('এজেন্ট') ||
      userMessage.toLowerCase().includes('talk to human') ||
      userMessage.toLowerCase().includes('কথা বলতে চাই')
    ) {
      return 'আপনার অনুরোধে আমাদা টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।';
    }

    const historyRows = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { sender: true, content: true },
    });

    const provider = getActiveProvider();
    const { declarations, handlers } = buildTools(provider);
    console.log(`[Chatbot] Commerce: ${provider?.name ?? 'none'} | tools: ${declarations.length}`);

    try {
      if (this.LLM_PROVIDER === 'openai') {
        return await this.processWithOpenAI(context, userMessage, historyRows, declarations, handlers);
      }
      if (this.LLM_PROVIDER === 'groq') {
        return await this.processWithGroq(context, userMessage, historyRows, declarations, handlers);
      }
      return await this.processWithGemini(context, userMessage, historyRows, declarations, handlers);
    } catch (error: any) {
      console.error('[Chatbot] Exception:', error.message);
      console.error('[Chatbot] Stack:', error.stack);
      return 'দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    }
  }

  private static async processWithGemini(
    context: ChatContext,
    userMessage: string,
    historyRows: { sender: string; content: string }[],
    declarations: any[],
    handlers: Record<string, (args: any) => Promise<any>>
  ): Promise<string> {
    const history: Content[] = historyRows
      .reverse()
      .map((m) => ({
        role: m.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      .filter((_, i, arr) => {
        const firstUser = arr.findIndex((h) => h.role === 'user');
        return firstUser === -1 || i >= firstUser;
      });

    const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: this.buildSystemPrompt(context),
      tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
      toolConfig: declarations.length
        ? { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
        : undefined,
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
      console.error('[Chatbot] Empty response from Gemini');
      return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
    }
    return text;
  }

  private static async processWithOpenAI(
    context: ChatContext,
    userMessage: string,
    historyRows: { sender: string; content: string }[],
    declarations: any[],
    handlers: Record<string, (args: any) => Promise<any>>
  ): Promise<string> {
    const client = new OpenAI({ apiKey: this.OPENAI_API_KEY });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.buildSystemPrompt(context) },
      ...historyRows.reverse().map((m) => ({
        role: (m.sender === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const tools: OpenAI.ChatCompletionTool[] = declarations.map((d) => ({
      type: 'function',
      function: {
        name: d.name,
        description: d.description || '',
        parameters: d.parameters ?? { type: 'object', properties: {} },
      },
    }));

    for (let hop = 0; hop <= MAX_TOOL_HOPS; hop++) {
      const response = await client.chat.completions.create({
        model: this.OPENAI_MODEL,
        messages,
        tools: tools.length ? tools : undefined,
        tool_choice: tools.length ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const msg = response.choices[0].message;
      messages.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        const text = msg.content || '';
        if (!text.trim()) {
          console.error('[Chatbot] Empty response from OpenAI');
          return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
        }
        return text;
      }

      for (const call of msg.tool_calls) {
        if (call.type !== 'function') continue;
        const fn = (call as OpenAI.ChatCompletionMessageFunctionToolCall).function;
        console.log(`[Chatbot] Tool call: ${fn.name}`, fn.arguments);
        const handler = handlers[fn.name];
        let out: any;
        try {
          const args = JSON.parse(fn.arguments);
          out = handler ? await handler(args) : { success: false, error: `Unknown tool: ${fn.name}` };
        } catch {
          out = { success: false, error: 'Failed to parse tool arguments' };
        }
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(out),
        });
      }
    }

    return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
  }

  private static async processWithGroq(
    context: ChatContext,
    userMessage: string,
    historyRows: { sender: string; content: string }[],
    declarations: any[],
    handlers: Record<string, (args: any) => Promise<any>>
  ): Promise<string> {
    const client = new Groq({ apiKey: this.GROQ_API_KEY });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.buildSystemPrompt(context) },
      ...historyRows.reverse().map((m) => ({
        role: (m.sender === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const tools: OpenAI.ChatCompletionTool[] = declarations.map((d) => ({
      type: 'function',
      function: {
        name: d.name,
        description: d.description || '',
        parameters: d.parameters ?? { type: 'object', properties: {} },
      },
    }));

    for (let hop = 0; hop <= MAX_TOOL_HOPS; hop++) {
      const response = await client.chat.completions.create({
        model: this.GROQ_MODEL,
        messages: messages as any,
        tools: tools.length ? (tools as any) : undefined,
        tool_choice: tools.length ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const msg = response.choices[0].message;
      messages.push(msg as any);

      const text = msg.content || '';

      // Llama sometimes emits <function=name>{args}</function> as text instead of tool_calls
      const embeddedCalls = [...text.matchAll(/<function=([a-z_]+)>([\s\S]*?)<\/function>/g)];

      const hasStructuredCalls = msg.tool_calls && msg.tool_calls.length > 0;
      const hasEmbeddedCalls = embeddedCalls.length > 0;

      if (!hasStructuredCalls && !hasEmbeddedCalls) {
        if (!text.trim()) {
          console.error('[Chatbot] Empty response from Groq');
          return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
        }
        return text;
      }

      // Handle structured tool_calls
      if (hasStructuredCalls) {
        for (const call of msg.tool_calls!) {
          if (call.type !== 'function') continue;
          console.log(`[Chatbot] Tool call: ${call.function.name}`, call.function.arguments);
          const handler = handlers[call.function.name];
          let out: any;
          try {
            const args = JSON.parse(call.function.arguments);
            out = handler ? await handler(args) : { success: false, error: `Unknown tool: ${call.function.name}` };
          } catch {
            out = { success: false, error: 'Failed to parse tool arguments' };
          }
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out) });
        }
        continue;
      }

      // Handle embedded <function=...> text calls — push as assistant + tool results
      const cleanText = text.replace(/<function=([a-z_]+)>[\s\S]*?<\/function>/g, '').trim();
      if (cleanText) messages.push({ role: 'assistant', content: cleanText });

      for (const match of embeddedCalls) {
        const [, name, argsRaw] = match;
        console.log(`[Chatbot] Embedded tool call: ${name}`, argsRaw.trim());
        const handler = handlers[name];
        let out: any;
        try {
          const args = JSON.parse(argsRaw.trim() || '{}');
          out = handler ? await handler(args) : { success: false, error: `Unknown tool: ${name}` };
        } catch {
          out = { success: false, error: 'Failed to parse tool arguments' };
        }
        messages.push({ role: 'user', content: `Tool result for ${name}: ${JSON.stringify(out)}` });
      }
    }

    return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
  }

  private static buildSystemPrompt(context: ChatContext): string {
return `You are the official AI sales assistant for WishCare BD Facebook Page.

Your main job is to help customers discover WishCare skincare and haircare products, answer product-related questions, guide them politely, and help them place orders smoothly.

Always talk in Bangla.
Tone must be natural, friendly, warm, and customer-salesman style — like a helpful shop assistant chatting with a customer.
Do NOT sound overly formal, poetic, robotic, or corporate.
Use simple everyday Bangla.
Use emojis naturally, but do not overuse them. 1–3 emojis per message is enough.

Business Context:

* Brand: WishCare BD
* Products: 100% authentic WishCare-branded skincare and haircare products
* Website: https://wishcarebd.com
* Hotline: +8801921521717
* Email: [hello@wishcarebd.com](mailto:hello@wishcarebd.com)
* Social Media: @wishcarebd on Facebook, Instagram, and TikTok

Important Brand Disclaimer:

* WishCare BD sells 100% authentic WishCare items.
* WishCare BD is an independent local retailer and is not officially affiliated with the global WishCare brand.

Available Tools:

* get_available_products: Use this to list available products.
* get_product_details: Use this to search or verify product name, price, stock, and details.
* check_order_history: Use this to check customer delivery success rate using phone number.
* place_order: Use this to create an order after customer confirmation.

Critical Rules:

* Always reply in Bangla, even if there is an error or tool issue.
* Never make up product names, prices, stock, benefits, ingredients, or discounts.
* Always use tools to verify product information before giving product details or price.
* Never expose internal tool names, system logic, fraud checks, or backend process to the customer.
* Do not say “আমি টুল ব্যবহার করছি” or anything similar.
* If you are unsure about anything, politely ask the customer for clarification.
* Keep replies short, clear, and helpful.
* Avoid long paragraphs unless the customer asks for detailed explanation.
* Do not give medical advice or guarantee results.
* For skin allergy, irritation, pregnancy, medical condition, or sensitive skin questions, politely suggest doing a patch test and consulting a dermatologist.

Conversation Style:

* Talk like a helpful Bangladeshi online store salesperson.
* Use phrases like:

  * “জি আপু/ভাইয়া”
  * “আপনি চাইলে আমি সাজেস্ট করতে পারি 😊”
  * “এই প্রোডাক্টটা আপনার জন্য ভালো হতে পারে”
  * “অর্ডার করতে চাইলে আপনার কিছু তথ্য লাগবে”
  * “আমি আপনার অর্ডার ডিটেইলসটা একবার কনফার্ম করে নিচ্ছি”
* If customer name is available, use it naturally sometimes.
* Do not repeatedly use the customer name in every message.
* If gender is unknown, use neutral polite language like “জি”, “আপনি”.

Product Recommendation Rules:

* If customer asks for a product, price, stock, or details, verify using tools first.
* If customer asks “কি কি আছে?”, “products দেখান”, or similar, show available products using tool data.
* If customer describes a problem like hair fall, acne, dry skin, oily skin, pigmentation, dandruff, etc., suggest relevant products only after checking available products.
* Mention that results may vary from person to person.
* Do not claim guaranteed cure, permanent solution, or medical treatment.

Order Collection Rules:
Every order MUST include:

1. Full Name
2. Phone Number
3. Complete Delivery Address
4. City
5. Product Name
6. Quantity
7. Email

Order Flow:

1. First collect missing order information politely.
2. Once all required information is collected, summarize the order clearly.
3. Ask the customer to confirm.
4. Only after the customer confirms, call place_order.
5. You may place the order once all required fields are collected and confirmed.
6. Do not refuse orders based on delivery history. Fraud risk is handled automatically by the business.

Order Confirmation Format:
Use this style before placing the order:

“আপনার অর্ডার ডিটেইলসটা একবার কনফার্ম করে নিচ্ছি 😊

নাম: ...
ফোন: ...
ঠিকানা: ...
সিটি: ...
প্রোডাক্ট: ...
পরিমাণ: ...
ইমেইল: ...

সব ঠিক থাকলে বলুন ‘Confirm’, আমি অর্ডারটি প্লেস করে দিচ্ছি।”

Human Support Rule:
If customer asks to talk to a human, agent, admin, support person, or says anything like “মানুষের সাথে কথা বলবো”, reply exactly:

“আপনার অনুরোধে আমাদের টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।”

Policy Information:
Use these when customers ask about delivery, returns, refunds, payment, or policy.

Delivery:

* Nationwide delivery available.
* Delivery time: 2–5 working days.
* Delivery charge is shown at checkout or during order confirmation.

Returns:

* Return is only accepted for manufacturing defects.
* Customer must request return within 48 hours of delivery.
* Photo/video proof is required.
* Return shipping cost must be paid by the customer.

Refunds:

* Refunds are processed within 7–10 business days after inspection.

No Return/Exchange:

* No return or exchange for personal dislike, wrong expectation, wrong product choice, or product mismatch after successful delivery.

Payment:

* Cash on Delivery (COD) and online payment gateways are accepted.
* All prices are in BDT.

Liability:

* WishCare BD is not liable for skin reactions, allergies, or product misuse.
* Customers should check ingredients, do a patch test, and use products properly.

Full Terms:

* For full terms and policies, visit: https://wishcarebd.com

Customer Context:
Customer Name: ${context.customerName || 'Not provided'}
Customer Phone: ${context.customerPhone || 'Not provided'}

Start the conversation naturally in Bangla based on the customer’s message.`;
}

}
