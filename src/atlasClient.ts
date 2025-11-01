import * as vscode from "vscode";
import * as path from "path";
import { randomUUID } from "crypto";

export type AtlasClipStatus = "pending" | "processing" | "failed" | "ready" | "local-only";

export interface AtlasClip {
  id: string;
  name: string;
  status: AtlasClipStatus;
  mediaType: string;
  createdAt: string;
  tags?: string[];
  description?: string;
  previewUrl?: string;
  transcriptUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestOptions {
  tags?: string[];
  description?: string;
}

export interface ClipAnalysis {
  clipId: string;
  model: string;
  summary?: string;
  scores?: Record<string, number>;
  labels?: string[];
  rawResponse: unknown;
}

const CLIP_CACHE_KEY = "atlas.cachedClips";

export class AtlasClient {
  constructor(
    private readonly configProvider: () => vscode.WorkspaceConfiguration,
    private readonly store: vscode.Memento,
    private readonly logger: vscode.OutputChannel
  ) {}

  async ingestMedia(fileUri: vscode.Uri, options: IngestOptions = {}): Promise<AtlasClip> {
    try {
      const config = this.configProvider();
      const baseUrl = config.get<string>("apiBaseUrl");
      if (!baseUrl) {
        throw new Error("Atlas base URL (atlas.apiBaseUrl) is not configured.");
      }
      const apiKey = config.get<string>("apiKey");

      const fileBuffer = await vscode.workspace.fs.readFile(fileUri);
      const form = new FormData();
      const fileName = path.basename(fileUri.fsPath);
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      ) as ArrayBuffer;
      form.append("file", new Blob([arrayBuffer]), fileName);

      if (options.tags && options.tags.length) {
        form.append("tags", JSON.stringify(options.tags));
      }
      if (options.description) {
        form.append("description", options.description);
      }

      const response = await fetch(`${baseUrl}/ingest`, {
        method: "POST",
        headers: {
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Atlas ingest failed (${response.status}): ${await response.text()}`);
      }

      const payload = (await response.json()) as AtlasClip;
      const clip = this.normaliseClip(payload);
      await this.addClipToCache(clip);
      return clip;
    } catch (error) {
      const offlineClip = await this.persistOfflineClip(fileUri, options);
      this.logger.appendLine(`Atlas ingest failed, cached locally instead: ${(error as Error).message}`);
      return offlineClip;
    }
  }

  async listMedia(): Promise<AtlasClip[]> {
    try {
      const config = this.configProvider();
      const baseUrl = config.get<string>("apiBaseUrl");
      if (!baseUrl) {
        throw new Error("Atlas base URL (atlas.apiBaseUrl) is not configured.");
      }
      const apiKey = config.get<string>("apiKey");

      const response = await fetch(`${baseUrl}/clips`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Atlas list failed (${response.status}): ${await response.text()}`);
      }

      const payload = (await response.json()) as AtlasClip[];
      const clips = payload.map((clip) => this.normaliseClip(clip));
      await this.setCache(clips);
      return clips;
    } catch (error) {
      this.logger.appendLine(`Atlas list failed, falling back to cached clips: ${(error as Error).message}`);
      return this.getCachedClips();
    }
  }

  async analyseClip(clip: AtlasClip): Promise<ClipAnalysis> {
    const config = this.configProvider();
    const endpoint = config.get<string>("modelEndpoint");
    if (!endpoint) {
      throw new Error("Model endpoint (atlas.modelEndpoint) is not configured.");
    }
    const apiKey = config.get<string>("apiKey");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        clipId: clip.id,
        clipName: clip.name,
        previewUrl: clip.previewUrl,
        transcriptUrl: clip.transcriptUrl,
        metadata: clip.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Model endpoint failed (${response.status}): ${await response.text()}`);
    }

    const payload = await response.json();
    const model = response.headers.get("x-model-name") ?? "custom-model";

    return {
      clipId: clip.id,
      model,
      summary: payload.summary,
      scores: payload.scores,
      labels: payload.labels,
      rawResponse: payload
    };
  }

  private normaliseClip(clip: AtlasClip): AtlasClip {
    return {
      ...clip,
      status: clip.status ?? "ready",
      mediaType: clip.mediaType ?? "unknown",
      tags: clip.tags ?? [],
      createdAt: clip.createdAt ?? new Date().toISOString()
    };
  }

  private async persistOfflineClip(fileUri: vscode.Uri, options: IngestOptions): Promise<AtlasClip> {
    const clip: AtlasClip = {
      id: randomUUID(),
      name: path.basename(fileUri.fsPath),
      status: "local-only",
      mediaType: this.resolveMediaType(fileUri.fsPath),
      createdAt: new Date().toISOString(),
      tags: options.tags,
      description: options.description,
      metadata: {
        sourceUri: fileUri.toString(true)
      }
    };

    await this.addClipToCache(clip);
    return clip;
  }

  private resolveMediaType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if ([".mp4", ".mov", ".mkv", ".webm"].includes(ext)) {
      return "video";
    }
    if ([".mp3", ".wav", ".flac", ".m4a"].includes(ext)) {
      return "audio";
    }
    if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) {
      return "image";
    }
    return "binary";
  }

  private async addClipToCache(clip: AtlasClip): Promise<void> {
    const clips = this.getCachedClips();
    const updated = [clip, ...clips.filter((item) => item.id !== clip.id)];
    await this.store.update(CLIP_CACHE_KEY, updated);
  }

  private async setCache(clips: AtlasClip[]): Promise<void> {
    await this.store.update(CLIP_CACHE_KEY, clips);
  }

  private getCachedClips(): AtlasClip[] {
    return this.store.get<AtlasClip[]>(CLIP_CACHE_KEY) ?? [];
  }
}
