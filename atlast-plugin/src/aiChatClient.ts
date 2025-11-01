import * as vscode from "vscode";

export type ChatProvider = "lmstudio" | "openrouter" | "custom";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
}

export class AIChatClient {
  constructor(
    private readonly configProvider: () => vscode.WorkspaceConfiguration,
    private readonly logger: vscode.OutputChannel
  ) {}

  async sendMessage(
    messages: ChatMessage[],
    onChunk?: (chunk: ChatStreamChunk) => void
  ): Promise<ChatCompletionResponse> {
    const config = this.configProvider();
    const provider = config.get<ChatProvider>("chatProvider", "lmstudio");
    const streaming = config.get<boolean>("chatStreaming", true);

    this.logger.appendLine(`[Chat] Sending to ${provider}, streaming: ${streaming}`);

    switch (provider) {
      case "lmstudio":
        return this.sendToLMStudio(messages, streaming, onChunk);
      case "openrouter":
        return this.sendToOpenRouter(messages, streaming, onChunk);
      case "custom":
        return this.sendToCustomAPI(messages, streaming, onChunk);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async sendToLMStudio(
    messages: ChatMessage[],
    streaming: boolean,
    onChunk?: (chunk: ChatStreamChunk) => void
  ): Promise<ChatCompletionResponse> {
    const config = this.configProvider();
    const endpoint = config.get<string>("lmStudioEndpoint", "http://localhost:1234/v1/chat/completions");
    const model = config.get<string>("lmStudioModel", "local-model");

    const requestBody = {
      model,
      messages,
      temperature: config.get<number>("chatTemperature", 0.7),
      max_tokens: config.get<number>("chatMaxTokens", 2000),
      stream: streaming
    };

    this.logger.appendLine(`[LM Studio] ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`LM Studio error (${response.status}): ${await response.text()}`);
      }

      if (streaming && onChunk) {
        return await this.handleStreamingResponse(response, onChunk);
      } else {
        const data = await response.json();
        return {
          content: data.choices[0].message.content,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        };
      }
    } catch (error) {
      this.logger.appendLine(`[LM Studio] Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async sendToOpenRouter(
    messages: ChatMessage[],
    streaming: boolean,
    onChunk?: (chunk: ChatStreamChunk) => void
  ): Promise<ChatCompletionResponse> {
    const config = this.configProvider();
    const apiKey = config.get<string>("openRouterApiKey", "");
    const model = config.get<string>("openRouterModel", "anthropic/claude-3.5-sonnet");
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    if (!apiKey) {
      throw new Error("OpenRouter API key not configured. Set atlas.openRouterApiKey in settings.");
    }

    const requestBody = {
      model,
      messages,
      temperature: config.get<number>("chatTemperature", 0.7),
      max_tokens: config.get<number>("chatMaxTokens", 2000),
      stream: streaming
    };

    this.logger.appendLine(`[OpenRouter] Model: ${model}`);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/atlas-pipeline-vscode",
          "X-Title": "Atlas Pipeline Toolkit"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter error (${response.status}): ${await response.text()}`);
      }

      if (streaming && onChunk) {
        return await this.handleStreamingResponse(response, onChunk);
      } else {
        const data = await response.json();
        return {
          content: data.choices[0].message.content,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        };
      }
    } catch (error) {
      this.logger.appendLine(`[OpenRouter] Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async sendToCustomAPI(
    messages: ChatMessage[],
    streaming: boolean,
    onChunk?: (chunk: ChatStreamChunk) => void
  ): Promise<ChatCompletionResponse> {
    const config = this.configProvider();
    const endpoint = config.get<string>("customApiEndpoint", "");
    const apiKey = config.get<string>("customApiKey", "");
    const model = config.get<string>("customApiModel", "");

    if (!endpoint) {
      throw new Error("Custom API endpoint not configured. Set atlas.customApiEndpoint in settings.");
    }

    const requestBody = {
      model,
      messages,
      temperature: config.get<number>("chatTemperature", 0.7),
      max_tokens: config.get<number>("chatMaxTokens", 2000),
      stream: streaming
    };

    this.logger.appendLine(`[Custom API] ${endpoint}`);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Custom API error (${response.status}): ${await response.text()}`);
      }

      if (streaming && onChunk) {
        return await this.handleStreamingResponse(response, onChunk);
      } else {
        const data = await response.json();
        return {
          content: data.choices[0].message.content,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        };
      }
    } catch (error) {
      this.logger.appendLine(`[Custom API] Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handleStreamingResponse(
    response: Response,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<ChatCompletionResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "" || line.trim() === "data: [DONE]") {
            continue;
          }

          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              const content = data.choices[0]?.delta?.content || "";

              if (content) {
                fullContent += content;
                onChunk({ content, done: false });
              }
            } catch (e) {
              this.logger.appendLine(`[Stream] Parse error: ${e}`);
            }
          }
        }
      }

      onChunk({ content: "", done: true });

      return {
        content: fullContent,
        model: "streamed-response"
      };
    } finally {
      reader.releaseLock();
    }
  }

  async listAvailableModels(): Promise<string[]> {
    const config = this.configProvider();
    const provider = config.get<ChatProvider>("chatProvider", "lmstudio");

    switch (provider) {
      case "lmstudio":
        return this.listLMStudioModels();
      case "openrouter":
        return ["anthropic/claude-3.5-sonnet", "openai/gpt-4", "meta-llama/llama-3-70b"];
      case "custom":
        return [config.get<string>("customApiModel", "custom-model")];
      default:
        return [];
    }
  }

  private async listLMStudioModels(): Promise<string[]> {
    const config = this.configProvider();
    const baseUrl = config.get<string>("lmStudioEndpoint", "http://localhost:1234/v1/chat/completions")
      .replace("/v1/chat/completions", "/v1/models");

    try {
      const response = await fetch(baseUrl);
      if (!response.ok) {
        return ["local-model"];
      }

      const data = await response.json();
      return data.data?.map((m: { id: string }) => m.id) || ["local-model"];
    } catch (error) {
      this.logger.appendLine(`[LM Studio] Failed to list models: ${(error as Error).message}`);
      return ["local-model"];
    }
  }
}
