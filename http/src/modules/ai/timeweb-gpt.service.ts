import axios, { AxiosError } from "axios";

export class TimeWebGptService {
  private readonly baseUrl = "https://agent.timeweb.cloud/api/v1/cloud-ai";
  private readonly agentAccessId: string;
  private readonly apiToken: string;

  constructor() {
    this.agentAccessId =
      process.env.TIMEWEB_ACCESS_ID ?? "ce5d443a-9c8e-4a75-8830-d300650528d9";
    this.apiToken = process.env.TIMEWEB_API_TOKEN ?? "";

    if (!this.agentAccessId || !this.apiToken) {
      throw new Error(
        "Переменные окружения TIMEWEB_ACCESS_ID и TIMEWEB_API_TOKEN обязательны"
      );
    }
  }

  /**
   * @param text
   * @param parentMessageId Идентификатор предыдущего сообщения в цепочке диалога (опционально).
   */
  async uniquizeText(
    text: string,
    options?: { parentMessageId?: string }
  ): Promise<string> {
    const url = `${this.baseUrl}/agents/${this.agentAccessId}/call`;
    const payload: Record<string, unknown> = {
      message: this.buildPrompt(text),
    };

    if (options?.parentMessageId) {
      payload.parent_message_id = options.parentMessageId;
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          // Токен доступа к Timeweb Cloud AI
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      });

      const rewritten = this.extractMessageContent(response.data);

      if (!rewritten) {
        throw new Error("Timeweb Cloud AI не вернул уникализированный текст");
      }

      return rewritten;
    } catch (error) {
      throw this.normalizeAxiosError(error);
    }
  }

  /**
   * @param text Исходный текст.
   */
  private buildPrompt(text: string): string {
    return text;
  }

  /**
   * Извлекает текст ответа из возможных вариантов структуры ответа.
   * @param responseJson Ответ Timeweb Cloud AI.
   */
  private extractMessageContent(responseJson: any): string | null {
    if (!responseJson || typeof responseJson !== "object") {
      return null;
    }

    if (typeof responseJson.message === "string") {
      return responseJson.message;
    }

    const nestedMessage =
      responseJson?.data?.message ??
      responseJson?.data?.content ??
      responseJson?.result ??
      responseJson?.content;

    if (typeof nestedMessage === "string") {
      return nestedMessage;
    }

    if (Array.isArray(nestedMessage)) {
      const joined = nestedMessage
        .map((chunk) => (typeof chunk === "string" ? chunk : chunk?.content))
        .filter((part): part is string => Boolean(part))
        .join("\n")
        .trim();

      return joined.length > 0 ? joined : null;
    }

    if (typeof nestedMessage?.content === "string") {
      return nestedMessage.content;
    }

    return null;
  }

  /**
   * Преобразует ошибку Axios в читаемое исключение.
   * @param error Ошибка, выброшенная Axios.
   */
  private normalizeAxiosError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const serverMessage = axiosError.response?.data?.message;
      const detail = serverMessage ?? statusText ?? axiosError.message;
      return new Error(`Timeweb Cloud AI вернул ошибку ${status ?? "unknown"}: ${detail}`);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error("Произошла неизвестная ошибка при обращении к Timeweb Cloud AI");
  }
}

