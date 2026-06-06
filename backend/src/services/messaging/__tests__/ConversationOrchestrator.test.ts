import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../adapterRegistry.js', () => ({
  getAdapter: vi.fn(),
}));

vi.mock('../conversationDb.js', () => ({
  getConversationByPlatformUserId: vi.fn(),
  createConversation: vi.fn(),
  addMessage: vi.fn(),
  updateConversation: vi.fn(),
  getConversationById: vi.fn(),
}));

vi.mock('../../chatbot/ChatbotService.js', () => ({
  ChatbotService: {
    processMessage: vi.fn(),
  },
}));

import { getAdapter } from '../adapterRegistry.js';
import * as db from '../conversationDb.js';
import { ChatbotService } from '../../chatbot/ChatbotService.js';
import { ConversationOrchestrator } from '../ConversationOrchestrator.js';

function makeAdapter() {
  return {
    isConfigured: vi.fn(() => true),
    sendTextMessage: vi.fn(async () => 'sent-mid'),
    getUserProfile: vi.fn(async () => ({ first_name: 'Jane', last_name: 'Doe' })),
    setTypingIndicator: vi.fn(async () => {}),
  };
}

const conversation = {
  id: 'conv-1',
  platformUserId: 'PSID1',
  platform: 'facebook',
  customerName: 'Jane Doe',
  customerPhone: null,
  aiMode: true,
};

let adapter: ReturnType<typeof makeAdapter>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  adapter = makeAdapter();
  (getAdapter as any).mockReturnValue(adapter);
  (db.getConversationByPlatformUserId as any).mockResolvedValue(conversation);
  (db.addMessage as any).mockResolvedValue({});
  (ChatbotService.processMessage as any).mockResolvedValue('AI reply');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ConversationOrchestrator.handleIncomingMessage — burst buffering', () => {
  it('merges a text message and a follow-up image into a single combined AI reply', async () => {
    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'is this in stock?', 'mid-text', 'facebook', undefined);
    await ConversationOrchestrator.handleIncomingMessage('PSID1', '', 'mid-img', 'facebook', 'https://img/p.jpg');

    await vi.advanceTimersByTimeAsync(2500);

    expect(ChatbotService.processMessage).toHaveBeenCalledTimes(1);
    expect((ChatbotService.processMessage as any).mock.calls[0][1]).toBe(
      'is this in stock?\n[Customer sent an image: https://img/p.jpg]'
    );
    expect(adapter.sendTextMessage).toHaveBeenCalledTimes(1);
    expect(adapter.sendTextMessage).toHaveBeenCalledWith('PSID1', 'AI reply');
  });

  it('answers a single message once the burst window passes with no follow-up', async () => {
    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'hi', 'mid-1', 'facebook', undefined);

    await vi.advanceTimersByTimeAsync(2500);

    expect(ChatbotService.processMessage).toHaveBeenCalledTimes(1);
    expect((ChatbotService.processMessage as any).mock.calls[0][1]).toBe('hi');
  });

  it('resets the debounce window on each new message in a burst', async () => {
    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'hello', 'mid-1', 'facebook', undefined);
    await vi.advanceTimersByTimeAsync(2000);
    expect(ChatbotService.processMessage).not.toHaveBeenCalled();

    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'are you there?', 'mid-2', 'facebook', undefined);
    await vi.advanceTimersByTimeAsync(2000);
    expect(ChatbotService.processMessage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2500);
    expect(ChatbotService.processMessage).toHaveBeenCalledTimes(1);
    expect((ChatbotService.processMessage as any).mock.calls[0][1]).toBe('hello\nare you there?');
  });

  it('cancels a pending burst and skips the AI reply when the customer asks for a human', async () => {
    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'hi', 'mid-1', 'facebook', undefined);
    await ConversationOrchestrator.handleIncomingMessage('PSID1', 'I want to talk to human', 'mid-2', 'facebook', undefined);

    await vi.advanceTimersByTimeAsync(5000);

    expect(ChatbotService.processMessage).not.toHaveBeenCalled();
    expect(db.updateConversation).toHaveBeenCalledWith('conv-1', { ai_mode: false, status: 'pending_human' });
  });
});
