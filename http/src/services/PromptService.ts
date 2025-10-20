// import { ChannelRewriteProfile } from './ChannelProfileService';

// export class PromptService {
//   // Вспомогательно: список вариантов сигнатуры для указанного профиля (повтор util из ChannelProfileService без зависимости)
//   private getSignatureVariantsForProfile(profile: ChannelRewriteProfile): string[] {
//     const set = new Set<string>();
//     const handle = profile.channelHandle || '';
//     const norm = handle.startsWith('@') ? handle.slice(1) : handle;
//     if (norm) set.add(norm);
//     const pipeIdx = norm.indexOf(' | ');
//     if (pipeIdx > 0) set.add(norm.slice(0, pipeIdx));
//     return Array.from(set);
//   }
//   buildSystemPrompt(profile: ChannelRewriteProfile): string {
//     const s = profile.styleGuidelines;
//     const constraints = profile.constraints;

//     const blocks: string[] = [];
//     blocks.push('Ты опытный редактор и рерайтер. Твоя задача — глубоко переработать текст под стиль целевого канала без потери фактов.');

//     blocks.push(
//       `Стиль: тон — ${s.tone}; объём — ${s.lengthPreference}; эмодзи — ${s.emojiUsage}; форматирование — ${s.formatting.join(', ')}.`
//     );

//     if (profile.transformationDepth === 'глубоко') {
//       blocks.push('Применяй глубокую трансформацию: меняй порядок подачи, структуру абзацев, синтаксис, вводи естественные связки, варьируй ритм.');
//     } else {
//       blocks.push('Переписывай содержательно, но без чрезмерной стилистической вольности.');
//     }

//     // Краткость и отсутствие воды
//     blocks.push('Пиши кратко и по делу: убирай воду, штампы и вводные конструкции. Сократи объём исходника примерно на 20–30%, сохранив ключевые факты. Не повторяй одну мысль разными словами.');

//     const rules: string[] = [];
//     if (constraints.keepFacts) rules.push('Сохраняй все факты и цифры.');
//     if (constraints.avoidLinks) rules.push('Не добавляй ссылки.');
//     if (constraints.avoidDisclaimers) rules.push('Не добавляй дисклеймеры и метакомментарии.');
//     if (constraints.avoidGenericAdvice) rules.push('Избегай общих советов и шаблонных фраз.');
//     if (constraints.noHallucinations) rules.push('Не выдумывай новые факты.');
//     if (rules.length) {
//       blocks.push(`Ограничения: ${rules.join(' ')}`);
//     }

//     // Всегда удаляем сигнатуры/подписи каналов в конце текста
//     const aliases = this.getSignatureVariantsForProfile(profile);
//     if (aliases.length > 0) {
//       blocks.push(`Удаляй подписи/наименования канала в конце текста (включая варианты: ${aliases.join(', ')}), а также хвосты вида «— Подписаться» и упоминания с @.`);
//     } else {
//       blocks.push('Удаляй подписи и наименования каналов в конце текста (например, «Рифмы и Панчи», «Топор»), если они присутствуют.');
//     }

//     if (profile.extraNotes) {
//       blocks.push(`Дополнительно: ${profile.extraNotes}`);
//     }

//     blocks.push('Ответь только переписанным текстом без пояснений.');

//     return blocks.join('\n');
//   }

//   buildUserPrompt(originalText: string, targetHandle: string): string {
//     return `Канал: ${targetHandle}. Перепиши текст под этот канал, сохраняя факты, делая изложение более оригинальным и связным:\n\n${originalText}`;
//   }
// }
// //  private buildSystemPrompt(instructions: RewriteInstruction): string {
// //     let prompt = `"instructions": [
// //       {
// //         "id": "${instructions.id}",
// //         "channel": "${instructions.channel}",
// //         "task": "${instructions.task}",
// //         "style": "${instructions.style}",
// //         "structure": "${instructions.structure}",
// //         "instructions": {`;

// //     Object.entries(instructions.instructions).forEach(([key, value], index, array) => {
// //       prompt += `\n          "${key}": "${value}"`;
// //       if (index < array.length - 1) {
// //         prompt += ',';
// //       }
// //     });

// //     prompt += '\n        },\n        "constraints": {';

// //     const constraintEntries = Object.entries(instructions.constraints);
// //     constraintEntries.forEach(([key, value], index) => {
// //       prompt += `\n          "${key}": ${value}`;
// //       if (index < constraintEntries.length - 1) {
// //         prompt += ',';
// //       }
// //     });

// //     prompt += '\n        }';

// //     if (instructions.notes) {
// //       prompt += `,\n        "notes": "${instructions.notes}"`;
// //     }

// //     prompt += '\n      }\n]';

// //     return prompt;
// //   }

// //   async rewriteWithInstructions(
// //     text: string, 
// //     instructions: RewriteInstruction,
// //     modelType: 'yandexgpt' | 'llama-lite' = 'yandexgpt'
// //   ): Promise<string> {
// //     try {
// //       const systemPrompt = this.buildSystemPrompt(instructions);
// //       const modelUri = modelType === 'llama-lite' 
// //         ? `gpt://${this.folderId}/llama-lite/latest`
// //         : `gpt://${this.folderId}/yandexgpt`;

// //       const request: YandexGPTRequest = {
// //         modelUri,
// //         completionOptions: {
// //           maxTokens: 500,
// //           temperature: 0.2
// //         },
// //         messages: [
// //           {
// //             role: "system",
// //             text: systemPrompt
// //           },
// //           {
// //             role: "user",
// //             text: `Ты профессиональный рерайтер контента для канала ${instructions.channel.toLowerCase()} перепиши данный текст избегай ответа "В интернете есть много сайтов с информацией на эту тему. Посмотрите, что нашлось в поиске" вот текст для обработки "${text}"`
// //           }
// //         ]
// //       };

// //       const response = await axios.post<YandexGPTResponse>(
// //         this.apiUrl,
// //         request,
// //         {
// //           headers: {
// //             'Authorization': `Api-Key ${this.apiKey}`,
// //             'Content-Type': 'application/json'
// //           }
// //         }
// //       );

// //       if (response.data.result.alternatives.length === 0) {
// //         throw new Error('No alternatives returned from Yandex GPT API');
// //       }

// //       const rewrittenText = response.data.result.alternatives[0].message.text;
// //       return rewrittenText;

// //     } catch (error: any) {
// //       console.error('Error rewriting text with instructions:');
      
// //       if (error.response) {
// //         console.error('Response status:', error.response.status);
// //         console.error('Response data:', error.response.data);
// //       }
      
// //       throw new Error('Failed to rewrite text with instructions');
// //     }
// //   }

// //   async sendCustomRequest(
// //     systemMessage: string,
// //     userMessage: string,
// //     modelType: 'yandexgpt' | 'llama-lite' = 'yandexgpt',
// //     temperature: number = 0.2,
// //     maxTokens: number = 500
// //   ): Promise<string> {
// //     try {
// //       const modelUri = modelType === 'llama-lite' 
// //         ? `gpt://${this.folderId}/llama-lite/latest`
// //         : `gpt://${this.folderId}/yandexgpt`;

// //       const request: YandexGPTRequest = {
// //         modelUri,
// //         completionOptions: {
// //           maxTokens,
// //           temperature
// //         },
// //         messages: [
// //           {
// //             role: "system",
// //             text: systemMessage
// //           },
// //           {
// //             role: "user",
// //             text: userMessage
// //           }
// //         ]
// //       };

// //       const response = await axios.post<YandexGPTResponse>(
// //         this.apiUrl,
// //         request,
// //         {
// //           headers: {
// //             'Authorization': `Api-Key ${this.apiKey}`,
// //             'Content-Type': 'application/json'
// //           }
// //         }
// //       );

// //       if (response.data.result.alternatives.length === 0) {
// //         throw new Error('No alternatives returned from API');
// //       }

// //       return response.data.result.alternatives[0].message.text;

// //     } catch (error: any) {
// //       console.error('Error sending custom request:');
      
// //       if (error.response) {
// //         console.error('Response status:', error.response.status);
// //         console.error('Response data:', error.response.data);
// //       }
      
// //       throw new Error('Failed to send custom request');
// //     }
// //   }