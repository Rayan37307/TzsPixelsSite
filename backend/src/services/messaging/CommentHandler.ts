import { FacebookAdapter } from './FacebookAdapter.js';
import { ChatbotService } from '../chatbot/ChatbotService.js';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export class CommentHandler {
  static async handleComment(
    commentId: string,
    commenterName: string,
    commentText: string
  ): Promise<void> {
    console.log(`[CommentHandler] Replying to comment ${commentId} from ${commenterName}: ${commentText.substring(0, 80)}`);

    try {
      const aiReply = await ChatbotService.processMessage(
        {
          conversationId: ZERO_UUID,
          platformUserId: commentId,
          customerName: commenterName,
        },
        commentText
      );

      await FacebookAdapter.replyToComment(commentId, aiReply);
      console.log(`[CommentHandler] Replied to ${commentId}`);
    } catch (error: any) {
      console.error(`[CommentHandler] Failed to reply to comment ${commentId}:`, error.message);
    }
  }
}
