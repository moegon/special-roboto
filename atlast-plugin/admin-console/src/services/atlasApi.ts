import type { AtlasClip, ChatMessage, DiscoveredModel, ModelDeployment } from "@/types";

interface UpdateClipPayload {
  tags?: string[];
  description?: string;
}

interface ChatRequestPayload {
  sessionId: string;
  messages: Array<Pick<ChatMessage, "role" | "content">>;
  metadata?: Record<string, unknown>;
}

interface ChatResponsePayload {
  message: {
    role: "assistant";
    content: string;
  };
  usage?: Record<string, unknown>;
  latencyMs?: number;
}

function normaliseChatResponsePayload(raw: unknown): ChatResponsePayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Unexpected chat response: empty body");
  }

  const obj = raw as Record<string, unknown>;

  // Case 1: Already in expected shape
  const directMessage = obj.message as
    | {
        role?: string;
        content?: unknown;
      }
    | undefined;
  if (directMessage?.content && typeof directMessage.content === "string") {
    return {
      message: {
        role: "assistant",
        content: directMessage.content
      },
      usage: (obj.usage as Record<string, unknown>) ?? undefined,
      latencyMs: (obj.latencyMs as number | undefined) ?? undefined
    };
  }

  // Case 2: OpenAI-compatible response { choices: [...] }
  const choices = Array.isArray(obj.choices) ? (obj.choices as Array<Record<string, unknown>>) : undefined;
  if (choices?.length) {
    let content = "";

    for (const choice of choices) {
      const message = choice.message as { role?: string; content?: unknown } | undefined;
      if (typeof message?.content === "string") {
        content += message.content;
        continue;
      }

      const delta = choice.delta as { role?: string; content?: unknown } | undefined;
      if (typeof delta?.content === "string") {
        content += delta.content;
        continue;
      }

      if (typeof choice.text === "string") {
        content += choice.text;
      }
    }

    if (!content) {
      throw new Error("Chat response contained choices but no text content");
    }

    return {
      message: {
        role: "assistant",
        content
      },
      usage: (obj.usage as Record<string, unknown>) ?? undefined,
      latencyMs: (obj.latency_ms as number | undefined) ?? undefined
    };
  }

  // Case 3: LM Studio Responses API sometimes returns { output: { content: [...] } }
  const output = obj.output as { content?: Array<{ text?: string }> } | undefined;
  if (output?.content?.length) {
    const text = output.content.map((item) => item.text ?? "").join("");
    if (text.trim()) {
      return {
        message: {
          role: "assistant",
          content: text
        },
        usage: (obj.usage as Record<string, unknown>) ?? undefined
      };
    }
  }

  throw new Error("Unrecognised chat response format");
}

function buildChatPayload(model: ModelDeployment, payload: ChatRequestPayload): unknown {
  const template = model.contract?.requestTemplate;
  if (!template) {
    return {
      ...payload,
      metadata: payload.metadata && Object.keys(payload.metadata).length
        ? { sessionId: payload.sessionId, ...payload.metadata }
        : { sessionId: payload.sessionId }
    };
  }

  try {
    const parsed = typeof template === "string" ? JSON.parse(template) : template;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Template must be an object");
    }

    const body = { ...parsed } as Record<string, unknown>;
    body.messages = payload.messages;

    const mergedMetadata = {
      ...(body.metadata as Record<string, unknown> | undefined),
      ...(payload.metadata ?? {})
    };
    if (Object.keys(mergedMetadata).length > 0 || payload.sessionId) {
      body.metadata = {
        sessionId: payload.sessionId,
        ...mergedMetadata
      };
    }

    if (!("session_id" in body)) {
      body.session_id = payload.sessionId;
    }

    if (!body.model) {
      body.model = model.name || model.id;
    }

    if (body.stream === undefined) {
      body.stream = false;
    }

    return body;
  } catch (error) {
    console.warn("Failed to parse request template, falling back to default payload", error);
    return {
      ...payload,
      metadata: payload.metadata && Object.keys(payload.metadata).length
        ? { sessionId: payload.sessionId, ...payload.metadata }
        : { sessionId: payload.sessionId }
    };
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchClips(apiBaseUrl: string): Promise<AtlasClip[]> {
  const base = apiBaseUrl?.trim();
  if (!base) {
    return [];
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/clips`);
  return handleResponse<AtlasClip[]>(response);
}

export async function updateClip(
  apiBaseUrl: string,
  clipId: string,
  payload: UpdateClipPayload
): Promise<AtlasClip> {
  const base = apiBaseUrl?.trim();
  if (!base) {
    throw new Error("Atlas Pipeline API is not configured.");
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/clips/${clipId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleResponse<AtlasClip>(response);
}

function resolveInferenceUrl(model: ModelDeployment): string {
  if (!model.contract) {
    return model.endpoint;
  }
  try {
    const base = model.endpoint.endsWith("/") ? model.endpoint : `${model.endpoint}/`;
    const path = model.contract.path.startsWith("/") ? model.contract.path.slice(1) : model.contract.path;
    return new URL(path, base).toString();
  } catch {
    return `${model.endpoint}${model.contract.path}`;
  }
}

export async function sendChatRequest(
  model: ModelDeployment,
  payload: ChatRequestPayload,
  signal?: AbortSignal
): Promise<ChatResponsePayload> {
  const { contract } = model;
  const method = contract?.httpMethod ?? "POST";
  const headers = {
    "Content-Type": "application/json",
    ...(contract?.headers ?? {})
  };

  let url = resolveInferenceUrl(model);
  const init: RequestInit = {
    method,
    headers,
    signal
  };

  if (method === "GET") {
    const urlObj = new URL(url);
    const body = buildChatPayload(model, payload);
    urlObj.searchParams.set("payload", JSON.stringify(body));
    url = urlObj.toString();
  } else {
    init.body = JSON.stringify(buildChatPayload(model, payload));
  }

  const response = await fetch(url, init);
  const raw = await handleResponse<unknown>(response);
  return normaliseChatResponsePayload(raw);
}

export async function discoverLocalModels(modelDiscoveryBaseUrl: string): Promise<DiscoveredModel[]> {
  if (!modelDiscoveryBaseUrl) {
    return [];
  }
  try {
    // For LM Studio and OpenAI-compatible endpoints, query /v1/models
    const trimmed = modelDiscoveryBaseUrl.replace(/\/$/, "");
    const modelsUrl = trimmed.endsWith("/v1") ? `${trimmed}/models` : `${trimmed}/v1/models`;
    const response = await fetch(modelsUrl);
    if (response.status === 404) {
      return [];
    }
    const data = await handleResponse<{
      object: string;
      data: Array<{
        id: string;
        owned_by?: string;
        metadata?: {
          endpoint?: string;
          description?: string;
        };
      }>;
    }>(response);
    
    // Convert OpenAI-format model list to DiscoveredModel format
    return (data.data || []).map((model) => ({
      id: model.id,
      name: model.id,
      description:
        model.metadata?.description ?? `Model: ${model.id}${model.owned_by ? ` (${model.owned_by})` : ""}`,
      endpoint:
        model.metadata?.endpoint ??
        (trimmed.endsWith("/v1") ? `${trimmed}/chat/completions` : `${trimmed}/v1/chat/completions`)
    }));
  } catch (error) {
    console.warn("Failed to discover local models", error);
    return [];
  }
}
