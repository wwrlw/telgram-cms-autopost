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
  private readonly iamToken: string;

  constructor() {
    this.folderId = process.env.YANDEX_API_FOLDER!;
    this.iamToken = process.env.IAM_TOKEN?.trim().replace(/\s+/g, '') || '';
    
    if (!this.folderId || !this.iamToken) {
      throw new Error('YANDEX_API_FOLDER and IAM_TOKEN environment variables are required');
    }
    
    console.log('YandexGPTService initialized:');
    console.log('Folder ID:', this.folderId);
    console.log('IAM Token length:', this.iamToken.length);
    console.log('IAM Token preview:', this.iamToken.substring(0, 20) + '...');
    console.log('IAM Token ends with:', '...' + this.iamToken.substring(this.iamToken.length - 10));
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

      const cleanToken = this.iamToken.trim();

      const response = await axios.post<YandexGPTResponse>(
        this.apiUrl,
        request,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        }
      );


      const uniquizedText = response.data.result.alternatives[0].message.text;
      
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
              'Authorization': `Bearer ${cleanToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (retryResponse.data.result.alternatives.length > 0) {
          const retryText = retryResponse.data.result.alternatives[0].message.text;
          
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