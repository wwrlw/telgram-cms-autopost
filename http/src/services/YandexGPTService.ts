import axios from 'axios';
export interface YandexGPTResponse {
  result: {
    alternatives: Array<{
      message: {
        role: string;
        text: string;
      };
      status: string;
    }>;
    usage: {
      inputTextTokens: string;
      completionTokens: string;
      totalTokens: string;
    };
    modelVersion: string;
  };
}

export interface YandexGPTRequest {
  modelUri: string;
  completionOptions: {
    stream: boolean;
    temperature: number;
    maxTokens: string;
    reasoningOptions: {
      mode: string;
    };
  };
  messages: Array<{
    role: string;
    text: string;
  }>;
}

export class YandexGPTService {
  private readonly apiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
  private readonly folderId: string;
  private readonly apiKey: string;

  constructor() {
    this.folderId = process.env.YANDEX_API_FOLDER!;
    this.apiKey = process.env.YANDEX_API_KEY!;
    
    if (!this.folderId || !this.apiKey) {
      throw new Error('YANDEX_API_FOLDER and YANDEX_API_KEY environment variables are required');
    }
  }

  async uniquizeText(text: string): Promise<string> {
    try {
      const request: YandexGPTRequest = {
        modelUri: `gpt://${this.folderId}/yandexgpt`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: "2000",
          reasoningOptions: {
            mode: "DISABLED"
          }
        },
        messages: [
          {
            role: "system",
            text: "Ты профессиональный рерайтер контента. Твоя задача - переписать предоставленный текст, полностью сохранив его смысл и информацию, но изменив формулировки, структуру предложений и словесные обороты. Не добавляй никаких комментариев, ссылок, пояснений или предложений найти информацию в интернете. Просто верни переписанный текст."
          },
          {
            role: "user",
            text: `Перепиши этот текст, сохранив всю информацию, но изменив формулировки:\n\n${text}`
          }
        ]
      };

      const response = await axios.post<YandexGPTResponse>(
        this.apiUrl,
        request,
        {
          headers: {
            'Authorization': `Api-Key ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.result.alternatives.length === 0) {
        throw new Error('No alternatives returned from Yandex GPT API');
      }

      const uniquizedText = response.data.result.alternatives[0].message.text;
      
      // Проверяем, что ответ не является шаблонным
      if (uniquizedText.includes('интернете есть много сайтов') || 
          uniquizedText.includes('Посмотрите, что нашлось в поиске') ||
          uniquizedText.includes('ya.ru')) {
        
        const retryRequest: YandexGPTRequest = {
          modelUri: `gpt://${this.folderId}/yandexgpt`,
          completionOptions: {
            stream: false,
            temperature: 0.7,
            maxTokens: "2000",
            reasoningOptions: {
              mode: "DISABLED"
            }
          },
          messages: [
            {
              role: "system",
              text: "Ты помощник-редактор. Перепиши текст, используя синонимы и изменяя структуру предложений, но сохраняя всю информацию. Отвечай только переписанным текстом."
            },
            {
              role: "user",
              text: `Текст для переписывания: ${text}`
            }
          ]
        };
        
        const retryResponse = await axios.post<YandexGPTResponse>(
          this.apiUrl,
          retryRequest,
          {
            headers: {
              'Authorization': `Api-Key ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (retryResponse.data.result.alternatives.length > 0) {
          const retryText = retryResponse.data.result.alternatives[0].message.text;
          
          // Если и второй запрос дает шаблонный ответ, возвращаем оригинальный текст
          if (retryText.includes('интернете есть много сайтов') || 
              retryText.includes('Посмотрите, что нашлось в поиске')) {
            return text;
          }
          
          return retryText;
        }
      }
      
      return uniquizedText;

    } catch (error: any) {
      console.error('Error uniquizing text with Yandex GPT:');
      
      if (error.response) {
        console.error('Response status:', error.response.status);
      }
      
      throw new Error('Failed to uniquize text');
    }
  }
} 