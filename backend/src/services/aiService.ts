import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AIService {
  static async chat(message: string, history: { role: string, parts: { text: string }[] }[] = [], systemInstruction?: string) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
      });
      
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini AI Error:", error.message);
      throw new Error("AI Assistant is currently unavailable.");
    }
  }
}
