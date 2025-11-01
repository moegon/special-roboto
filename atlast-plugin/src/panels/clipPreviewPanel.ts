import * as vscode from "vscode";
import { AtlasClip } from "../atlasClient";

export class ClipPreviewPanel {
  private static readonly panels = new Map<string, ClipPreviewPanel>();

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly clip: AtlasClip
  ) {
    this.panel.onDidDispose(() => ClipPreviewPanel.panels.delete(this.clip.id));
    this.panel.title = `Atlas Clip • ${clip.name}`;
    this.panel.webview.html = this.composeHtml(clip);
  }

  static show(_extensionUri: vscode.Uri, clip: AtlasClip): void {
    const existing = this.panels.get(clip.id);
    if (existing) {
      existing.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "atlasClipPreview",
      `Atlas Clip • ${clip.name}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    const instance = new ClipPreviewPanel(panel, clip);
    ClipPreviewPanel.panels.set(clip.id, instance);
  }

  private reveal(): void {
    this.panel.reveal(vscode.ViewColumn.One);
  }

  private composeHtml(clip: AtlasClip): string {
    const metadata = [
      `<strong>Status:</strong> ${clip.status}`,
      `<strong>Type:</strong> ${clip.mediaType}`,
      `<strong>Created:</strong> ${new Date(clip.createdAt).toLocaleString()}`
    ];

    if (clip.tags?.length) {
      metadata.push(`<strong>Tags:</strong> ${clip.tags.join(", ")}`);
    }

    if (clip.description) {
      metadata.push(`<strong>Description:</strong> ${clip.description}`);
    }

    const mediaSection = this.composeMediaSection(clip);

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https: data:; style-src 'unsafe-inline'; font-src https: data:;" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: var(--vscode-font-family);
              padding: 1.5rem;
              background: var(--vscode-editor-background);
              color: var(--vscode-editor-foreground);
            }
            h1 {
              font-size: 1.4rem;
              margin-bottom: 1rem;
            }
            .metadata {
              margin-bottom: 1.25rem;
              line-height: 1.5;
            }
            .metadata p {
              margin: 0.35rem 0;
            }
            .media {
              border: 1px solid var(--vscode-panel-border);
              border-radius: 6px;
              padding: 1rem;
              background: rgba(255, 255, 255, 0.02);
            }
            video, audio, img {
              width: 100%;
              border-radius: 6px;
            }
            pre {
              background: rgba(255, 255, 255, 0.04);
              padding: 0.75rem;
              overflow: auto;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <h1>${clip.name}</h1>
          <section class="metadata">
            ${metadata.map((line) => `<p>${line}</p>`).join("")}
          </section>
          <section class="media">
            ${mediaSection}
          </section>
          ${
            clip.metadata
              ? `<h2 style="margin-top:1.5rem;">Metadata</h2><pre>${escapeHtml(JSON.stringify(clip.metadata, null, 2))}</pre>`
              : ""
          }
        </body>
      </html>
    `;
  }

  private composeMediaSection(clip: AtlasClip): string {
    if (clip.previewUrl) {
      if (clip.mediaType === "video") {
        return `<video controls src="${clip.previewUrl}"></video>`;
      }
      if (clip.mediaType === "audio") {
        return `<audio controls src="${clip.previewUrl}"></audio>`;
      }
      if (clip.mediaType === "image") {
        return `<img src="${clip.previewUrl}" alt="${clip.name}" />`;
      }
    }

    return `<p>No preview available. ${
      clip.metadata?.sourceUri ? `Original source: ${clip.metadata.sourceUri}` : ""
    }</p>`;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
