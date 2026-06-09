import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../messaging/FacebookAdapter.js', () => ({
  facebookAdapter: { isConfigured: vi.fn(() => true) },
}));

vi.mock('../../commerce/index.js', () => ({
  getActiveProvider: vi.fn(() => null),
}));

const recognizeProduct = vi.fn();

vi.mock('../tools.js', () => ({
  buildTools: vi.fn(() => ({
    declarations: [{ name: 'recognize_product_from_image' }],
    handlers: { recognize_product_from_image: recognizeProduct },
  })),
}));

vi.mock('../../../config/db.js', () => ({
  default: {
    message: {
      findMany: vi.fn(() => []),
    },
  },
}));

import { ChatbotService } from '../ChatbotService.js';

describe('ChatbotService image recognition pre-pass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.LLM_PROVIDER = 'gemini';
    recognizeProduct.mockResolvedValue({
      success: true,
      description: 'WishCare AHA BHA Body Lotion, 200ml',
      confidence: 'high',
    });
  });

  it('recognizes customer images before sending the message to the chat model', async () => {
    const processWithGemini = vi
      .spyOn(ChatbotService as any, 'processWithGemini')
      .mockResolvedValue('reply');

    await ChatbotService.processMessage(
      { conversationId: 'conv-1', platformUserId: 'user-1', customerName: 'Customer' },
      '[Customer sent an image: https://img/p.jpg]\nis this available?'
    );

    expect(recognizeProduct).toHaveBeenCalledWith({ imageUrl: 'https://img/p.jpg' });
    expect(processWithGemini.mock.calls[0][1]).toContain(
      '[Image analysis result for https://img/p.jpg: {"success":true,"description":"WishCare AHA BHA Body Lotion, 200ml","confidence":"high"}]'
    );
  });
});
