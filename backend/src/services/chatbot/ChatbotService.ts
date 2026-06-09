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
const CUSTOMER_IMAGE_RE = /\[Customer sent an image:\s*(https?:\/\/[^\]\s]+)\]/g;

function extractCustomerImageUrls(message: string): string[] {
  return [...message.matchAll(CUSTOMER_IMAGE_RE)].map((match) => match[1]);
}

async function appendImageRecognitionResults(
  userMessage: string,
  handlers: Record<string, (args: any) => Promise<any>>
): Promise<string> {
  const imageUrls = extractCustomerImageUrls(userMessage);
  const recognize = handlers.recognize_product_from_image;

  if (imageUrls.length === 0 || !recognize) return userMessage;

  const results = [];
  for (const imageUrl of imageUrls) {
    console.log(`[Chatbot] Pre-recognizing customer image: ${imageUrl.substring(0, 120)}`);
    const out = await recognize({ imageUrl });
    results.push(`[Image analysis result for ${imageUrl}: ${JSON.stringify(out)}]`);
  }

  return `${userMessage}\n${results.join('\n')}`;
}

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
      take: 6,
      select: { sender: true, content: true },
    });

    const provider = getActiveProvider();
    const { declarations, handlers } = buildTools(provider);
    const enrichedUserMessage = await appendImageRecognitionResults(userMessage, handlers);
    console.log(`[Chatbot] Commerce: ${provider?.name ?? 'none'} | tools: ${declarations.length}`);

    try {
      if (this.LLM_PROVIDER === 'openai') {
        return await this.processWithOpenAI(context, enrichedUserMessage, historyRows, declarations, handlers);
      }
      if (this.LLM_PROVIDER === 'groq') {
        return await this.processWithGroq(context, enrichedUserMessage, historyRows, declarations, handlers);
      }
      return await this.processWithGemini(context, enrichedUserMessage, historyRows, declarations, handlers);
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
        max_completion_tokens: 1024,
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
        max_completion_tokens: 1024,
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

Always reply in short, natural Bangla. Customers may write Bangla, Banglish, or English, but you must reply in Bangla.

Tone: friendly Bangladeshi online shop assistant. Warm, simple, helpful, sales-focused. Use 1–2 emojis max.

Brand:
- WishCare BD sells 100% authentic WishCare skincare and haircare products.
- Website: https://wishcarebd.com
- Hotline: +8801921521717
- WishCare BD is an independent local retailer, not officially affiliated with the global WishCare brand.

Main Rules:
- Replies must be very short: usually 1–3 short lines.
- Never give long product details. Use product links for details.
- Never invent product names, prices, stock, benefits, ingredients, discounts, delivery charge, or links.
- Always verify product info before mentioning price, stock, link, or recommendation.
- Never expose tools, backend logic, fraud checks, or automation.
- Do not say “আমি টুল ব্যবহার করছি”.
- Do not give medical advice or guarantee results.
- For allergy, irritation, pregnancy, sensitive skin, or medical concerns, suggest patch test and dermatologist consultation.
- If unsure, ask one short question.

Image Recognition:

* When the customer's message contains "[Customer sent an image: <url>]" and no matching "[Image analysis result ...]" is present, call recognize_product_from_image with that url FIRST, before responding.
* When an "[Image analysis result ...]" is present, use it as the already-completed visual reading and do NOT call recognize_product_from_image again for that same image.
* Use the image analysis result to search the catalog with get_product_details.
* If no matching product is found, call get_available_products and suggest the closest alternatives from what's actually in stock.
* Never expose the raw recognition text or mention "image recognition", "AI vision", or tool names to the customer — speak naturally, as if you personally looked at the photo (e.g., "ছবি দেখে মনে হচ্ছে এটা আমাদের ... প্রোডাক্ট").
* If recognition fails or the photo is too unclear, politely ask the customer to confirm the product name or send a clearer photo.

Product Link Rules:
- NEVER guess, construct, rewrite, shorten, or manually create product links.
- Product tools return an exact “url” field for each product — copy that value verbatim.
- If multiple products are returned, match each product name with its own exact URL from the tool result.
- If a product has no URL in the tool result, do NOT invent one.
- When no URL is available say: “বিস্তারিত জানতে আমাদের ওয়েবসাইটে দেখুন: https://wishcarebd.com”

Product Format:
“জি, available আছে 😊
প্রোডাক্ট: ...
দাম: ...
বিস্তারিত জানতে: ...”

Recommendation Format:
“আপনার concern-এর জন্য এটা নিতে পারেন 😊
প্রোডাক্ট: ...
দাম: ...
বিস্তারিত জানতে: ...
অর্ডার করতে চাইলে বলুন।”

Order Rules:
Collect name, phone, full address (full address already includes city — never ask for city separately), product, and quantity. Never ask the customer for an email address.
Before placing order, summarize and ask customer to confirm.
Only place order after confirmation.
Do not refuse orders based on delivery history.

Order Info Ask:
“জি, অর্ডার করতে এই তথ্যগুলো দিন 😊
নাম:
ফোন:
ঠিকানা:
প্রোডাক্ট:
পরিমাণ:”

Human Support:
If customer asks for human/admin/agent/support/person, reply exactly:
“আপনার অনুরোধে আমাদের টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।”

Policies:
Delivery: Nationwide, 2–5 working days.
Return: Only manufacturing defect, within 48 hours, proof required.
Refund: 7–10 business days after inspection.
Payment: COD.
Full terms: https://wishcarebd.com

Customer:
Name: ${context.customerName || 'Not provided'}
Phone: ${context.customerPhone || 'Not provided'}

Reply based on the customer’s latest message.`;
}


}
