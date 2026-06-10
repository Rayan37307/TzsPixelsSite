import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import axios from 'axios';
import type { CommerceProvider } from '../commerce/index.js';
import { isConfigured as bdCourierConfigured, checkCourier, normalizeBdPhone } from '../bdCourierService.js';
import { deriveCourierRedFlags, riskLevelFromScore } from '../courierScoring.js';
import { NotificationService } from '../notificationService.js';

export interface ToolSet {
  declarations: FunctionDeclaration[];
  handlers: Record<string, (args: any) => Promise<any>>;
}

function isMetaCdnUrl(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    return url.hostname.toLowerCase().includes('fbcdn.net');
  } catch {
    return false;
  }
}

function normalizeImageSource(imageUrl: string): string {
  return imageUrl.trim().replace(/&amp;/g, '&');
}

function parseImageDataUri(imageSource: string): { base64: string; mimeType: string } | null {
  const match = imageSource.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2].replace(/\s/g, '') };
}

function describeImageFetchError(error: any, imageUrl: string): string {
  const status = error.response?.status;
  const contentType = error.response?.headers?.['content-type'];
  const body = Buffer.isBuffer(error.response?.data)
    ? error.response.data.toString('utf8', 0, Math.min(error.response.data.length, 300))
    : typeof error.response?.data === 'string'
      ? error.response.data.slice(0, 300)
      : '';
  const isMetaCdn = (() => {
    try {
      return new URL(imageUrl).hostname.toLowerCase().includes('fbcdn.net');
    } catch {
      return false;
    }
  })();

  if (isMetaCdn && /bad (url )?hash|url signature expired|signature/i.test(body)) {
    return 'Facebook CDN rejected the image URL (bad hash/signature expired). The image link is expired, truncated, or not the original webhook attachment URL.';
  }

  if (status) {
    return `Image fetch failed with HTTP ${status}${contentType ? ` (${contentType})` : ''}`;
  }

  return error.message || 'Image fetch failed';
}

async function downloadImage(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const requestConfig = {
    responseType: 'arraybuffer' as const,
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
    },
  };

  try {
    const response = await axios.get(imageUrl, requestConfig);
    return imageResponseToBase64(response);
  } catch (error: any) {
    const accessToken = process.env.FB_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN || '';
    const shouldRetryWithToken = isMetaCdnUrl(imageUrl) && accessToken && [401, 403].includes(error.response?.status);
    if (!shouldRetryWithToken) throw error;

    console.warn('[Chatbot] Retrying Facebook image download with page access token');
    const response = await axios.get(imageUrl, {
      ...requestConfig,
      params: { access_token: accessToken },
    });
    return imageResponseToBase64(response);
  }
}

function imageResponseToBase64(response: { data: any; headers: Record<string, any> }): { base64: string; mimeType: string } {
  const rawType = (response.headers['content-type'] as string) || '';
  const mimeType = rawType.split(';')[0].trim() || 'image/jpeg';
  if (!mimeType.startsWith('image/')) {
    throw new Error(`Image URL did not return an image (${mimeType || 'unknown content type'})`);
  }

  return {
    base64: Buffer.from(response.data as ArrayBuffer).toString('base64'),
    mimeType,
  };
}

// Runs the BDCourier phone check for an order about to be placed. High risk
// notifies the admin but NEVER blocks — the agent still places the order.
async function bdCourierNotifyOnly(input: { customerName: string; phone: string }): Promise<void> {
  if (!bdCourierConfigured()) return;
  const phone = normalizeBdPhone(input.phone);
  if (!phone) return;

  try {
    const data = await checkCourier(phone);
    const flags = deriveCourierRedFlags(data);
    const score = flags.reduce((sum, f) => sum + f.points, 0);
    if (riskLevelFromScore(score) === 'high') {
      console.log(`[Chatbot] High courier risk (${score}) for AI order — notifying admin`);
      await NotificationService.addNotification({
        type: 'fraud',
        title: 'High Risk Order Placed by AI',
        message: `AI placed an order for ${input.customerName} (${input.phone}); courier fraud score ${score}. Review.`,
        time: 'Just now',
      });
    }
  } catch (error: any) {
    console.error('[Chatbot] BDCourier check failed (continuing):', error.message);
  }
}

// Always runs on Gemini vision — independent of the active LLM_PROVIDER driving
// the conversation. Default to Pro because product labels/screenshots need OCR
// and fine visual detail more than raw speed.
async function recognizeProductFromImage(imageUrl: string): Promise<
  { success: true; description: string; confidence: 'high' | 'low' } | { success: false; error: string }
> {
  imageUrl = normalizeImageSource(imageUrl);
  const apiKey = process.env.GEMINI_API_KEY || '';
  const visionModel = process.env.VISION_MODEL || 'gemini-2.5-pro';
  if (!apiKey) return { success: false, error: 'Image recognition not configured' };
  const dataUri = parseImageDataUri(imageUrl);

  try {
    let base64: string;
    let mimeType: string;

    if (dataUri) {
      base64 = dataUri.base64;
      mimeType = dataUri.mimeType;
    } else {
      ({ base64, mimeType } = await downloadImage(imageUrl));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: visionModel });
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      'This is a photo a customer sent to a skincare/haircare brand called WishCare BD. ' +
        'Identify the most likely product. Read visible label text, brand text, product type ' +
        '(serum, shampoo, cream, lotion, sunscreen, etc.), variant, and size if visible. ' +
        'A screenshot or product-page image is acceptable; do not mark it unclear just because it is a screenshot. ' +
        'If the exact product is uncertain but packaging/text gives clues, give the best likely product name and ' +
        'a short search query that could match the catalog. Only say unclear when no product/label/packaging can be identified. ' +
        'Be concise and include useful catalog search keywords.',
    ]);

    const description = result.response.text().trim();
    const confidence: 'high' | 'low' = /blurry|unclear|hard to (read|tell)|cannot identify|no product|not (sure|certain)/i.test(
      description
    )
      ? 'low'
      : 'high';

    return { success: true, description, confidence };
  } catch (error: any) {
    return { success: false, error: describeImageFetchError(error, imageUrl) };
  }
}

const visionDeclaration: FunctionDeclaration = {
  name: 'recognize_product_from_image',
  description:
    'Analyze a product image URL and identify what product it shows (name, brand, type, visible text). Use this whenever the customer sends an image.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      imageUrl: { type: SchemaType.STRING, description: 'URL of the customer-sent image.' },
    },
    required: ['imageUrl'],
  },
};

const visionHandlers: Record<string, (args: any) => Promise<any>> = {
  recognize_product_from_image: async (args) => {
    const imageUrl = String(args?.imageUrl ?? '');
    if (!imageUrl) return { success: false, error: 'No image URL provided' };
    return recognizeProductFromImage(imageUrl);
  },
};

// Builds the agent's toolset. The vision tool is always present — recognition
// needs no catalog access. Commerce tools are added only when a provider is
// configured; with no provider, the bot can still identify images but can't
// look products up or place orders.
export function buildTools(provider: CommerceProvider | null): ToolSet {
  if (!provider) {
    return { declarations: [visionDeclaration], handlers: { ...visionHandlers } };
  }

  const declarations: FunctionDeclaration[] = [
    visionDeclaration,
    {
      name: 'get_available_products',
      description: 'List the available products in the store with name, price, stock status, and product URL.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          limit: {
            type: SchemaType.NUMBER,
            description: 'Maximum number of products to return (default 20).',
          },
        },
      },
    },
    {
      name: 'get_product_details',
      description: 'Search products by name or keyword and return matching product details (price, stock, description, and exact product URL).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'Product name or keyword to search for.' },
        },
        required: ['query'],
      },
    },
    {
      name: 'check_order_history',
      description: "Check a customer's past order history and delivery success rate by phone number.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          phone: { type: SchemaType.STRING, description: 'Customer phone number.' },
        },
        required: ['phone'],
      },
    },
    {
      name: 'place_order',
      description: 'Place an order for a product. Requires full name, phone, complete delivery address, product name, and quantity. City and email are optional — the full address already includes the city, and email is not needed; never ask the customer for either.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          customerName: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          city: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          productName: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
        },
        required: ['customerName', 'phone', 'address', 'productName', 'quantity'],
      },
    },
    {
      name: 'cancel_order',
      description: 'Cancel an existing order by order ID.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          orderId: { type: SchemaType.STRING, description: 'The order ID to cancel.' },
        },
        required: ['orderId'],
      },
    },
  ];

  const handlers: Record<string, (args: any) => Promise<any>> = {
    ...visionHandlers,

    get_available_products: async (args) => {
      try {
        const products = await provider.listProducts(args?.limit ?? 20);
        return { success: true, products };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    get_product_details: async (args) => {
      try {
        const products = await provider.searchProducts(String(args?.query ?? ''));
        if (products.length === 0) {
          return { success: true, products: [], message: 'No matching products found.' };
        }
        return { success: true, products };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    check_order_history: async (args) => {
      try {
        const history = await provider.getCustomerOrderHistory(String(args?.phone ?? ''));
        return { success: true, ...history };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    place_order: async (args) => {
      try {
        const input = {
          customerName: String(args.customerName),
          phone: String(args.phone),
          address: String(args.address),
          city: args.city ? String(args.city) : undefined,
          email: args.email ? String(args.email) : undefined,
          productName: String(args.productName),
          quantity: Number(args.quantity) || 1,
        };

        // Notify-only fraud gate — does not block order placement.
        await bdCourierNotifyOnly(input);

        const result = await provider.createOrder(input);
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    cancel_order: async (args) => {
      try {
        return await provider.cancelOrder(String(args?.orderId ?? ''));
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  };

  return { declarations, handlers };
}
