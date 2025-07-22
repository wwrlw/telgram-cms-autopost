"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YandexGPTService = void 0;
const axios_1 = __importDefault(require("axios"));
class YandexGPTService {
    constructor() {
        this.apiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
        this.folderId = process.env.YANDEX_API_FOLDER;
        this.apiKey = process.env.YANDEX_API_KEY;
        if (!this.folderId || !this.apiKey) {
            throw new Error('YANDEX_API_FOLDER and YANDEX_API_KEY environment variables are required');
        }
    }
    buildSystemPrompt(instructions) {
        let prompt = `"instructions": [
      {
        "id": "${instructions.id}",
        "channel": "${instructions.channel}",
        "task": "${instructions.task}",
        "style": "${instructions.style}",
        "structure": "${instructions.structure}",
        "instructions": {`;
        Object.entries(instructions.instructions).forEach(([key, value], index, array) => {
            prompt += `\n          "${key}": "${value}"`;
            if (index < array.length - 1) {
                prompt += ',';
            }
        });
        prompt += '\n        },\n        "constraints": {';
        const constraintEntries = Object.entries(instructions.constraints);
        constraintEntries.forEach(([key, value], index) => {
            prompt += `\n          "${key}": ${value}`;
            if (index < constraintEntries.length - 1) {
                prompt += ',';
            }
        });
        prompt += '\n        }';
        if (instructions.notes) {
            prompt += `,\n        "notes": "${instructions.notes}"`;
        }
        prompt += '\n      }\n]';
        return prompt;
    }
    async rewriteWithInstructions(text, instructions, modelType = 'yandexgpt') {
        try {
            const systemPrompt = this.buildSystemPrompt(instructions);
            const modelUri = modelType === 'llama-lite'
                ? `gpt://${this.folderId}/llama-lite/latest`
                : `gpt://${this.folderId}/yandexgpt`;
            const request = {
                modelUri,
                completionOptions: {
                    maxTokens: 500,
                    temperature: 0.2
                },
                messages: [
                    {
                        role: "system",
                        text: systemPrompt
                    },
                    {
                        role: "user",
                        text: `Ты профессиональный рерайтер контента для канала ${instructions.channel.toLowerCase()} перепиши данный текст избегай ответа "В интернете есть много сайтов с информацией на эту тему. Посмотрите, что нашлось в поиске" вот текст для обработки "${text}"`
                    }
                ]
            };
            const response = await axios_1.default.post(this.apiUrl, request, {
                headers: {
                    'Authorization': `Api-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.result.alternatives.length === 0) {
                throw new Error('No alternatives returned from Yandex GPT API');
            }
            const rewrittenText = response.data.result.alternatives[0].message.text;
            return rewrittenText;
        }
        catch (error) {
            console.error('Error rewriting text with instructions:');
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw new Error('Failed to rewrite text with instructions');
        }
    }
    async sendCustomRequest(systemMessage, userMessage, modelType = 'yandexgpt', temperature = 0.2, maxTokens = 500) {
        try {
            const modelUri = modelType === 'llama-lite'
                ? `gpt://${this.folderId}/llama-lite/latest`
                : `gpt://${this.folderId}/yandexgpt`;
            const request = {
                modelUri,
                completionOptions: {
                    maxTokens,
                    temperature
                },
                messages: [
                    {
                        role: "system",
                        text: systemMessage
                    },
                    {
                        role: "user",
                        text: userMessage
                    }
                ]
            };
            const response = await axios_1.default.post(this.apiUrl, request, {
                headers: {
                    'Authorization': `Api-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.result.alternatives.length === 0) {
                throw new Error('No alternatives returned from API');
            }
            return response.data.result.alternatives[0].message.text;
        }
        catch (error) {
            console.error('Error sending custom request:');
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw new Error('Failed to send custom request');
        }
    }
    async uniquizeText(text) {
        try {
            const request = {
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
            const response = await axios_1.default.post(this.apiUrl, request, {
                headers: {
                    'Authorization': `Api-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.result.alternatives.length === 0) {
                throw new Error('No alternatives returned from Yandex GPT API');
            }
            const uniquizedText = response.data.result.alternatives[0].message.text;
            if (uniquizedText.includes('интернете есть много сайтов') ||
                uniquizedText.includes('Посмотрите, что нашлось в поиске') ||
                uniquizedText.includes('ya.ru')) {
                const retryRequest = {
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
                const retryResponse = await axios_1.default.post(this.apiUrl, retryRequest, {
                    headers: {
                        'Authorization': `Api-Key ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
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
        }
        catch (error) {
            console.error('Error uniquizing text with Yandex GPT:');
            if (error.response) {
                console.error('Response status:', error.response.status);
            }
            throw new Error('Failed to uniquize text');
        }
    }
}
exports.YandexGPTService = YandexGPTService;
