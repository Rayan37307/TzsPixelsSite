import { facebookAdapter } from '../messaging/FacebookAdapter.js';
import { WooCommerceService } from '../woocommerceService.js';
import prisma from '../../config/db.js';

interface ChatContext {
  conversationId: string;
  platformUserId: string;
  customerName: string;
  customerPhone?: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ChatbotService {
  private static get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY || '';
  }

  static isConfigured(): boolean {
    return !!(this.GEMINI_API_KEY && facebookAdapter.isConfigured());
  }

  static async checkUserOrderHistory(phone: string): Promise<ToolResult> {
    try {
      if (WooCommerceService.isConfigured()) {
        const orders = await WooCommerceService.fetchOrders();
        const userOrders = orders.filter((o: any) =>
          o.phone?.includes(phone) || o.customer?.includes(phone)
        );

        if (userOrders.length > 0) {
          const successfulOrders = userOrders.filter((o: any) => o.status === 'Delivered').length;
          const successRate = (successfulOrders / userOrders.length) * 100;
          return {
            success: true,
            data: {
              totalOrders: userOrders.length,
              successfulOrders,
              successRate: successRate.toFixed(0) + '%',
              lastOrder: userOrders[0]
            }
          };
        }
      }
      return { success: true, data: { totalOrders: 0, message: 'No order history found' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getProductDetails(productId?: string, search?: string): Promise<ToolResult> {
    try {
      if (!WooCommerceService.isConfigured()) {
        return { success: false, error: 'WooCommerce not configured' };
      }

      if (productId) {
        return { success: true, data: { message: 'Product lookup by ID not yet implemented' } };
      }

      if (search) {
        const products = await WooCommerceService.getProducts();
        const matched = products.filter((p: any) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5);

        return {
          success: true,
          data: {
            products: matched.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              status: p.status,
              stock: p.stock_status
            }))
          }
        };
      }

      return { success: false, error: 'Provide productId or search term' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async placeOrder(orderData: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    email: string;
    productName: string;
    quantity: number;
  }): Promise<ToolResult> {
    try {
      if (!WooCommerceService.isConfigured()) {
        return { success: false, error: 'WooCommerce not configured' };
      }

      const order = await WooCommerceService.createOrder({
        billing: {
          first_name: orderData.customerName.split(' ')[0],
          last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
          email: orderData.email,
          phone: orderData.phone,
          address_1: orderData.address,
          city: orderData.city,
          country: 'BD'
        },
        line_items: [
          {
            name: orderData.productName,
            quantity: orderData.quantity
          }
        ],
        status: 'processing'
      });

      return { success: true, data: { orderId: order.id, orderNumber: order.number } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async processMessage(context: ChatContext, userMessage: string): Promise<string> {
    const geminiKeyConfigured = !!this.GEMINI_API_KEY;
    const fbConfigured = facebookAdapter.isConfigured();
    console.log(`[Chatbot] isConfigured check - Gemini: ${geminiKeyConfigured}, Facebook: ${fbConfigured}`);

    if (!this.isConfigured()) {
      console.error('[Chatbot] NOT CONFIGURED - Gemini key or FB adapter missing!');
      return 'আমাদের সিস্টেমে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পরে চেষ্টা করুন।';
    }

    const historyRows = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { sender: true, content: true },
    });
    const history = historyRows.reverse();

    const conversationHistory = history.map(m =>
      `${m.sender === 'ai' ? 'AI' : 'গ্রাহক'}: ${m.content}`
    ).join('\n');

    if (userMessage.toLowerCase().includes('মানুষ') ||
        userMessage.toLowerCase().includes('এজেন্ট') ||
        userMessage.toLowerCase().includes('talk to human') ||
        userMessage.toLowerCase().includes('কথা বলতে চাই')) {
      return 'আপনার অনুরোধে আমাদা টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।';
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}

আগের কথোপকথন:
${conversationHistory}

গ্রাহকের নতুন বার্তা: ${userMessage}

নির্দেশনা:
- প্রথমে গ্রাহকের অর্ডার ইতিহাস চেক করুন (ফোন নম্বর দিয়ে)
- তারপর প্রোডাক্ট সার্চ করুন প্রয়োজনে
- অর্ডার নেওয়ার আগে অবশ্যই অর্ডার ইতিহাস চেক করুন
- ৭০% এর বেশি সাফল্য হলে অর্ডার নিন, নাহলে নিন না

তারপর প্রাসঙ্গিক উত্তর দিন।`;

    try {
      console.log('[Chatbot] Processing message:', userMessage.substring(0, 100));
      console.log('[Chatbot] Customer:', context.customerName, '| Phone:', context.customerPhone);
      console.log('[Chatbot] Conversation history count:', history.length);

      console.log('[Chatbot] Calling Gemini API...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        }
      );

      console.log('[Chatbot] Gemini response status:', response.status);

      const data = await response.json();
      console.log('[Chatbot] Gemini raw response:', JSON.stringify(data, null, 2));

      if (data.error) {
        console.error('[Chatbot] Gemini API error:', data.error);
        return 'দুঃখিত, AI সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      }

      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('[Chatbot] Raw AI response:', rawResponse);

      if (!rawResponse || rawResponse.trim() === '') {
        console.error('[Chatbot] Empty response from Gemini - returning fallback');
        return 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
      }

      const aiResponse = rawResponse;

      const responseLower = aiResponse.toLowerCase();

      if (responseLower.includes('অর্ডার') || responseLower.includes('order confirmed')) {
      }

      return aiResponse;
    } catch (error: any) {
      console.error('[Chatbot] Exception:', error.message);
      console.error('[Chatbot] Stack:', error.stack);
      if (error.response) {
        console.error('[Chatbot] Response data:', error.response.data);
        console.error('[Chatbot] Response status:', error.response.status);
      }
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

Available Tools (use when needed):
1. checkUserOrderHistory(phone) - Check customer's order history and success rate
2. getProductDetails(search="keyword") - Search products by name/description
3. placeOrder(customerName, phone, address, city, email, productName, quantity) - Create order

Your Capabilities:
- Understand customer intent and respond naturally in Bangla
- Search and retrieve accurate product information from WooCommerce
- Handle single or multiple product orders
- Check order history before accepting any order
- If success rate is below 70%, do NOT accept order - politely explain

Non-Negotiable Rules (MUST DO):
🔴 CRITICAL REQUIREMENTS:
- Always reply in Bangla (unless customer explicitly uses English)
- NEVER fabricate product info — always use tools to verify
- Every order MUST include: Full Name, Phone Number, Complete Delivery Address, Product (Name), Quantity, Email
- ALWAYS check user delivery history BEFORE making an order
- If success rate < 70%, decline order politely
- After placing ANY order, update the product stock

Important:
- If customer asks to talk to human, respond: "আপনার অনুরোধে আমাদা টিমের সাথে কথা বলার জন্য আপনাকে সংযুক্ত করছি। অনুগ্রহ করে অপেক্ষা করুন।"
- Don't expose internal logic or tool names
- When unsure, ask the customer politely
- Provide hotline 0173543636 when needed

Customer: ${context.customerName}
Phone: ${context.customerPhone || 'Not provided'}

Start the conversation naturally!`;
  }
}
