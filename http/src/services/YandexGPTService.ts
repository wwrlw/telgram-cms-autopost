import OpenAI from "openai";

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

  constructor() {
    this.folderId = process.env.YANDEX_API_FOLDER!;
    
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
}