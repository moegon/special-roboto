import * as vscode from "vscode";
import { AtlasClip, AtlasClient } from "./atlasClient";

export class MediaLibraryProvider implements vscode.TreeDataProvider<MediaItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<MediaItem | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private clips: AtlasClip[] = [];

  constructor(private readonly client: AtlasClient) {}

  async refresh(): Promise<void> {
    this.clips = await this.client.listMedia();
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: MediaItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<MediaItem[]> {
    return Promise.resolve(this.clips.map((clip) => new MediaItem(clip)));
  }

  getClipById(id: string): AtlasClip | undefined {
    return this.clips.find((clip) => clip.id === id);
  }

  async ensureLoaded(): Promise<void> {
    if (!this.clips.length) {
      await this.refresh();
    }
  }

  async pickClip(placeHolder = "Select an Atlas clip"): Promise<AtlasClip | undefined> {
    await this.ensureLoaded();
    if (!this.clips.length) {
      void vscode.window.showInformationMessage("No clips available. Ingest media to get started.");
      return undefined;
    }

    const selection = await vscode.window.showQuickPick(
      this.clips.map((clip) => ({
        label: clip.name,
        description: `${clip.mediaType} • ${clip.status}`,
        detail: clip.tags?.length ? `Tags: ${clip.tags.join(", ")}` : undefined,
        clip
      })),
      { placeHolder, matchOnDetail: true, matchOnDescription: true }
    );

    return selection?.clip;
  }
}

export class MediaItem extends vscode.TreeItem {
  constructor(readonly clip: AtlasClip) {
    super(clip.name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = [
      `Type: ${clip.mediaType}`,
      `Status: ${clip.status}`,
      `Created: ${new Date(clip.createdAt).toLocaleString()}`
    ].join("\n");

    this.description = [clip.mediaType, clip.status].join(" • ");
    this.contextValue = "atlasClip";
    this.iconPath = MediaItem.iconForClip(clip);
    this.command = {
      command: "atlas.openClip",
      title: "Open Clip",
      arguments: [this]
    };
  }

  private static iconForClip(clip: AtlasClip): vscode.ThemeIcon {
    switch (clip.mediaType) {
      case "video":
        return new vscode.ThemeIcon("play");
      case "audio":
        return new vscode.ThemeIcon("megaphone");
      case "image":
        return new vscode.ThemeIcon("file-media");
      default:
        return new vscode.ThemeIcon("file");
    }
  }
}
