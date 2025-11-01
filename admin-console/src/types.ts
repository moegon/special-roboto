export interface AtlasClip {
  id: string;
  name: string;
  status: "pending" | "processing" | "failed" | "ready" | "local-only";
  mediaType: string;
  createdAt: string;
  tags?: string[];
  description?: string;
  previewUrl?: string;
  transcriptUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ModelContract {
  httpMethod: "POST" | "GET";
  path: string;
  headers?: Record<string, string>;
  requestTemplate?: string;
  responseMapping?: string;
}

export interface ModelDeployment {
  id: string;
  name: string;
  description?: string;
  endpoint: string;
  concurrencyLimit?: number;
  default: boolean;
  contract?: ModelContract;
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  clipId?: string;
  modelId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  status: "idle" | "running" | "error";
  error?: string;
}

export interface DiscoveredModel {
  id: string;
  name: string;
  endpoint: string;
  description?: string;
  metadata?: Record<string, unknown>;
}
