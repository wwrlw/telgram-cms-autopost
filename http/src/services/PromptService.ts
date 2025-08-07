//  private buildSystemPrompt(instructions: RewriteInstruction): string {
//     let prompt = `"instructions": [
//       {
//         "id": "${instructions.id}",
//         "channel": "${instructions.channel}",
//         "task": "${instructions.task}",
//         "style": "${instructions.style}",
//         "structure": "${instructions.structure}",
//         "instructions": {`;

//     Object.entries(instructions.instructions).forEach(([key, value], index, array) => {
//       prompt += `\n          "${key}": "${value}"`;
//       if (index < array.length - 1) {
//         prompt += ',';
//       }
//     });

//     prompt += '\n        },\n        "constraints": {';

//     const constraintEntries = Object.entries(instructions.constraints);
//     constraintEntries.forEach(([key, value], index) => {
//       prompt += `\n          "${key}": ${value}`;
//       if (index < constraintEntries.length - 1) {
//         prompt += ',';
//       }
//     });

//     prompt += '\n        }';

//     if (instructions.notes) {
//       prompt += `,\n        "notes": "${instructions.notes}"`;
//     }

//     prompt += '\n      }\n]';

//     return prompt;
//   }

//   async rewriteWithInstructions(
//     text: string, 
//     instructions: RewriteInstruction,
//     modelType: 'yandexgpt' | 'llama-lite' = 'yandexgpt'
//   ): Promise<string> {
//     try {
//       const systemPrompt = this.buildSystemPrompt(instructions);
//       const modelUri = modelType === 'llama-lite' 
//         ? `gpt://${this.folderId}/llama-lite/latest`
//         : `gpt://${this.folderId}/yandexgpt`;

//       const request: YandexGPTRequest = {
//         modelUri,
//         completionOptions: {
//           maxTokens: 500,
//           temperature: 0.2
//         },
//         messages: [
//           {
//             role: "system",
//             text: systemPrompt
//           },
//           {
//             role: "user",
//             text: `Ты профессиональный рерайтер контента для канала ${instructions.channel.toLowerCase()} перепиши данный текст избегай ответа "В интернете есть много сайтов с информацией на эту тему. Посмотрите, что нашлось в поиске" вот текст для обработки "${text}"`
//           }
//         ]
//       };

//       const response = await axios.post<YandexGPTResponse>(
//         this.apiUrl,
//         request,
//         {
//           headers: {
//             'Authorization': `Api-Key ${this.apiKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.data.result.alternatives.length === 0) {
//         throw new Error('No alternatives returned from Yandex GPT API');
//       }

//       const rewrittenText = response.data.result.alternatives[0].message.text;
//       return rewrittenText;

//     } catch (error: any) {
//       console.error('Error rewriting text with instructions:');
      
//       if (error.response) {
//         console.error('Response status:', error.response.status);
//         console.error('Response data:', error.response.data);
//       }
      
//       throw new Error('Failed to rewrite text with instructions');
//     }
//   }

//   async sendCustomRequest(
//     systemMessage: string,
//     userMessage: string,
//     modelType: 'yandexgpt' | 'llama-lite' = 'yandexgpt',
//     temperature: number = 0.2,
//     maxTokens: number = 500
//   ): Promise<string> {
//     try {
//       const modelUri = modelType === 'llama-lite' 
//         ? `gpt://${this.folderId}/llama-lite/latest`
//         : `gpt://${this.folderId}/yandexgpt`;

//       const request: YandexGPTRequest = {
//         modelUri,
//         completionOptions: {
//           maxTokens,
//           temperature
//         },
//         messages: [
//           {
//             role: "system",
//             text: systemMessage
//           },
//           {
//             role: "user",
//             text: userMessage
//           }
//         ]
//       };

//       const response = await axios.post<YandexGPTResponse>(
//         this.apiUrl,
//         request,
//         {
//           headers: {
//             'Authorization': `Api-Key ${this.apiKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.data.result.alternatives.length === 0) {
//         throw new Error('No alternatives returned from API');
//       }

//       return response.data.result.alternatives[0].message.text;

//     } catch (error: any) {
//       console.error('Error sending custom request:');
      
//       if (error.response) {
//         console.error('Response status:', error.response.status);
//         console.error('Response data:', error.response.data);
//       }
      
//       throw new Error('Failed to send custom request');
//     }
//   }