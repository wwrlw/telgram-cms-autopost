import OpenAI from "openai";
import { ChannelRewriteProfile, ChannelProfileService } from "./ChannelProfileService";
import { PromptService } from "./PromptService";

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
  private readonly promptService: PromptService;
  private readonly profileService: ChannelProfileService;

  constructor() {
    this.folderId = process.env.YANDEX_API_FOLDER!;
    this.promptService = new PromptService();
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
      const systemPrompt = this.promptService.buildSystemPrompt(profile);
      const userPrompt = this.promptService.buildUserPrompt(text, profile.channelHandle);

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
      rewritten = this.removeTrailingChannelSignature(rewritten);
      rewritten = this.normalizeFormatting(rewritten);
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

  private removeTrailingChannelSignature(text: string): string {
    const candidates = this.profileService.getSignatureCandidates();
    const lines = text.split(/\r?\n/);
    let idx = lines.length - 1;
    while (idx >= 0 && lines[idx].trim() === '') idx--;
    if (idx < 0) return text;

    const last = lines[idx].trim();

    const normalized = (s: string) =>
      s
        .toLowerCase()
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF\u1F300-\u1FAFF]/gu, '') // убрать эмодзи
        .replace(/[\u2014\u2013\-_|:]+/g, ' ') 
        .replace(/[^a-zа-яё0-9@#\s]/giu, '') 
        .replace(/\b(подписаться|подписывайся|подпишись|подпишитесь|subscribe|follow|подписка)\b/giu, '')
        .replace(/\s+/g, ' ') 
        .trim();

    const normLast = normalized(last).replace(/^[#]/, '').replace(/^@/, '').trim();

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const raw of candidates) {
      const cand = raw.toLowerCase();
      const candNoAt = cand.startsWith('@') ? cand.slice(1) : cand;

      // 1) Полное совпадение после нормализации
      if (normLast === candNoAt) {
        lines.splice(idx, 1);
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
      }

      // 2) Вхождение канала в конце/в начале строки (как подпись)
      const pattern = new RegExp(`(^|\\n|\\s|[@#])${escapeRegex(candNoAt)}(\\s|$)`, 'i');
      if (pattern.test(normLast)) {
        lines.splice(idx, 1);
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
      }
    }
    // 3) Подпись как хвост после точки/знака: "... текст. @channel" или "... — Подписаться @channel"
    const tailPattern = /([.!?])\s+[@#]?[a-zA-Zа-яА-ЯёЁ0-9_\-\s|]+$/u;
    if (tailPattern.test(lines[idx])) {
      // Нормализуем хвост и сверим с кандидатами
      const match = lines[idx].match(tailPattern);
      const tail = match ? match[0] : '';
      const normTail = normalized(tail).replace(/^[@#]/, '').trim();
      for (const raw of candidates) {
        const cand = raw.toLowerCase();
        const candNoAt = cand.startsWith('@') ? cand.slice(1) : cand;
        if (normTail.endsWith(candNoAt)) {
          lines[idx] = lines[idx].replace(tailPattern, '$1');
          return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
        }
      }
    }
    return text;
  }

  private normalizeFormatting(text: string): string {
    const lines = text.split(/\r?\n/);
    // Убираем обрамление **...** у первой непустой строки, если это весь заголовок
    let idx = 0;
    while (idx < lines.length && lines[idx].trim() === '') idx++;
    if (idx < lines.length) {
      const line = lines[idx].trim();
      const m = line.match(/^\*\*(.+)\*\*$/);
      if (m && m[1]) {
        lines[idx] = line.replace(/^\*\*(.+)\*\*$/, '$1');
      }
    }
    // Глобально убираем Markdown-жирное **...** внутри строк (модель иногда подчёркивает отдельные слова)
    for (let i = 0; i < lines.length; i++) {
      lines[i] = lines[i].replace(/\*\*(.+?)\*\*/g, '$1');
    }
    return lines.join('\n');
  }
}