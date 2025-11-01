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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchClips(apiBaseUrl: string): Promise<AtlasClip[]> {
  const response = await fetch(`${apiBaseUrl}/clips`);
  return handleResponse<AtlasClip[]>(response);
}

export async function updateClip(
  apiBaseUrl: string,
  clipId: string,
  payload: UpdateClipPayload
): Promise<AtlasClip> {
  const response = await fetch(`${apiBaseUrl}/clips/${clipId}`, {
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
    urlObj.searchParams.set("payload", JSON.stringify(payload));
    url = urlObj.toString();
  } else {
    init.body = JSON.stringify(payload);
  }

  const response = await fetch(url, init);
  return handleResponse<ChatResponsePayload>(response);
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
