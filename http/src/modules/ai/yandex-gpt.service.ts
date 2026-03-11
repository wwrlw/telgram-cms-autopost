import OpenAI from "openai";
import { ChannelRewriteProfile, ChannelProfileService } from "./ChannelProfileService";

const openai = new OpenAI({
  apiKey: process.env.YANDEX_API_KEY!,
  baseURL: "https://llm.api.cloud.yandex.net/v1",
});

export interface RewriteInstruction {
  id: string;
  channel: string;
  task: string;
  style: string;
  structure: string;
  instructions: Record<string, string>;
  constraints: Record<string, boolean>;
  notes?: string;
}

export class YandexGPTService {
  private readonly folderId: string;
  private readonly profileService: ChannelProfileService;

  constructor() {
    this.folderId = process.env.YANDEX_API_FOLDER!;
    this.profileService = new ChannelProfileService();
    
    if (!this.folderId || !process.env.YANDEX_API_KEY) {
      throw new Error('YANDEX_API_FOLDER and YANDEX_API_KEY environment variables are required');
    }
  }

  async uniquizeText(text: string): Promise<string> {
    try {
      const modelName = `gpt://${this.folderId}/gpt-oss-120b/latest`; 

      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "Ты профессиональный рерайтер контента. Твоя задача - переписать предоставленный текст, полностью сохранив его смысл и информацию, но изменив формулировки, структуру предложений и словесные обороты. Не добавляй никаких комментариев, ссылок, пояснений или предложений найти информацию в интернете. Просто верни переписанный текст."
          },
          {
            role: "user",
            content: `Перепиши этот текст, сохранив всю информацию, но изменив формулировки:\n\n${text}`
          }
        ],
        temperature: 0.6,
        max_tokens: 2000,
      });

      console.log(response);

      const uniquizedText = response.choices[0]?.message?.content;
      
      if (!uniquizedText) {
        throw new Error('No content returned from Yandex GPT API');
      }
      console.log(uniquizedText);
      return uniquizedText;

    } catch (error: any) {
      console.error('Error uniquizing text with Yandex GPT:');
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw new Error('Failed to uniquize text');
    }
  }

  async rewriteWithProfile(text: string, profile: ChannelRewriteProfile): Promise<string> {
    try {
      const modelName = `gpt://${this.folderId}/gpt-oss-120b/latest`;

      const systemPrompt = `Ты профессиональный рерайтер контента. Твоя задача - переписать предоставленный текст в стиле канала "${profile.channelHandle}", сохранив всю информацию, но адаптировав под стиль и тон этого канала.`;
      
      const userPrompt = `Перепиши этот текст в стиле канала "${profile.channelHandle}":
      
Текст:
${text}`;

      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1200,
      });

      let rewritten = response.choices[0]?.message?.content;
      if (!rewritten) {
        throw new Error('No content returned from Yandex GPT API');
      }
      return rewritten;
    } catch (error: any) {
      console.error('Error rewriting text with profile:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to rewrite text with profile');
    }
  }

  async rewriteWithCustomPrompt(text: string, customPrompt: string): Promise<string> {
    try {
      const modelName = `gpt://${this.folderId}/gpt-oss-120b/latest`;
      const systemPrompt = customPrompt?.trim() || "Ты профессиональный рерайтер. Перепиши текст аккуратно без потери фактов.";
      const userPrompt = `Перепиши под следующие инструкции:
      ${customPrompt}

      Текст:
      ${text}`;

      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1200,
      });

      const rewritten = response.choices[0]?.message?.content;
      if (!rewritten) {
        throw new Error('No content returned from Yandex GPT API');
      }
      return rewritten;
    } catch (error: any) {
      console.error('Error rewriting text with custom prompt:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to rewrite text with custom prompt');
    }
  }
}