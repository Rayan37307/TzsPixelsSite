import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import type { CommerceProvider } from '../commerce/index.js';
import { isConfigured as bdCourierConfigured, checkCourier, normalizeBdPhone } from '../bdCourierService.js';
import { deriveCourierRedFlags, riskLevelFromScore } from '../courierScoring.js';
import { NotificationService } from '../notificationService.js';

export interface ToolSet {
  declarations: FunctionDeclaration[];
  handlers: Record<string, (args: any) => Promise<any>>;
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

// Builds the agent's toolset from the active commerce provider. With no
// provider configured, the commerce tools are absent and the bot is chat-only.
export function buildTools(provider: CommerceProvider | null): ToolSet {
  if (!provider) {
    return { declarations: [], handlers: {} };
  }

  const declarations: FunctionDeclaration[] = [
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
      description: 'Place an order for a product. Requires full name, phone, complete delivery address, city, email, product name, and quantity.',
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
        required: ['customerName', 'phone', 'address', 'city', 'email', 'productName', 'quantity'],
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
          city: String(args.city),
          email: String(args.email),
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
