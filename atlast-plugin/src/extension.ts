import * as vscode from "vscode";
import { AtlasClient, AtlasClip } from "./atlasClient";
import { MediaItem, MediaLibraryProvider } from "./mediaLibraryProvider";
import { ClipPreviewPanel } from "./panels/clipPreviewPanel";

let client: AtlasClient | undefined;
let libraryProvider: MediaLibraryProvider | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let extensionUri: vscode.Uri | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionUri = context.extensionUri;
  outputChannel = vscode.window.createOutputChannel("Atlas Pipeline");
  client = new AtlasClient(
    () => vscode.workspace.getConfiguration("atlas"),
    context.workspaceState,
    outputChannel
  );
  libraryProvider = new MediaLibraryProvider(client);

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("atlasMediaLibrary", libraryProvider),
    vscode.commands.registerCommand("atlas.ingestMedia", () => ingestMedia()),
    vscode.commands.registerCommand("atlas.refreshLibrary", () => libraryProvider?.refresh()),
    vscode.commands.registerCommand("atlas.openClip", (item?: MediaItem | AtlasClip) => openClip(item)),
    vscode.commands.registerCommand("atlas.analyseClip", (item?: MediaItem | AtlasClip) => analyseClip(item)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("atlas")) {
        void libraryProvider?.refresh();
      }
    })
  );

  void libraryProvider?.refresh();
}

export function deactivate(): void {
  client = undefined;
  outputChannel?.dispose();
}

async function ingestMedia(): Promise<void> {
  const atlasClient = client;
  const provider = libraryProvider;
  if (!atlasClient || !provider) {
    return;
  }

  const files = await vscode.window.showOpenDialog({
    canSelectMany: true,
    openLabel: "Ingest with Atlas Pipeline",
    filters: {
      "Media Files": [
        "mp4",
        "mov",
        "mkv",
        "webm",
        "mp3",
        "wav",
        "flac",
        "m4a",
        "png",
        "jpg",
        "jpeg",
        "gif"
      ],
      "All Files": ["*"]
    }
  });

  if (!files || !files.length) {
    return;
  }

  const tagsInput = await vscode.window.showInputBox({
    prompt: "Add comma separated tags (optional)",
    placeHolder: "meeting, research, highlights"
  });

  const description = await vscode.window.showInputBox({
    prompt: "Describe this batch (optional)"
  });

  const tags = tagsInput
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Ingesting media with Atlas",
      cancellable: false
    },
    async (progress) => {
      let completed = 0;
      for (const uri of files) {
        progress.report({ message: uri.fsPath });
        try {
          const clip = await atlasClient.ingestMedia(uri, { tags, description });
          outputChannel?.appendLine(`Ingested ${clip.name} (${clip.id})`);
        } catch (error) {
          void vscode.window.showErrorMessage(`Failed to ingest ${uri.fsPath}: ${(error as Error).message}`);
        }
        completed += 1;
        progress.report({ increment: 100 / files.length, message: `${completed}/${files.length} complete` });
      }
    }
  );

  await provider.refresh();
  await vscode.window.showInformationMessage(`Ingested ${files.length} file(s) with Atlas.`);
}

async function openClip(item?: MediaItem | AtlasClip): Promise<void> {
  if (!libraryProvider) {
    return;
  }

  const clip = await resolveClip(item);
  if (!clip) {
    return;
  }

  if (!extensionUri) {
    return;
  }

  ClipPreviewPanel.show(extensionUri, clip);
}

async function analyseClip(item?: MediaItem | AtlasClip): Promise<void> {
  const atlasClient = client;
  const provider = libraryProvider;
  if (!atlasClient || !provider) {
    return;
  }

  const clip = await resolveClip(item);
  if (!clip) {
    return;
  }

  try {
    const analysis = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Analysing ${clip.name} with hosted model`,
        cancellable: false
      },
      async () => atlasClient.analyseClip(clip)
    );

    outputChannel?.show(true);
    outputChannel?.appendLine(`\nAnalysis for ${clip.name} (${analysis.model})`);
    if (analysis.summary) {
      outputChannel?.appendLine(`Summary: ${analysis.summary}`);
    }
    if (analysis.labels?.length) {
      outputChannel?.appendLine(`Labels: ${analysis.labels.join(", ")}`);
    }
    if (analysis.scores) {
      for (const [label, score] of Object.entries(analysis.scores)) {
        outputChannel?.appendLine(`Score[${label}]: ${score}`);
      }
    }
    outputChannel?.appendLine(`Raw response: ${JSON.stringify(analysis.rawResponse, null, 2)}`);
  } catch (error) {
    void vscode.window.showErrorMessage(`Model analysis failed: ${(error as Error).message}`);
  }
}

async function resolveClip(item?: MediaItem | AtlasClip): Promise<AtlasClip | undefined> {
  if (!libraryProvider) {
    return undefined;
  }

  if (item) {
    return item instanceof MediaItem ? item.clip : item;
  }

  return await libraryProvider.pickClip();
}
