# Atlas Pipeline Toolkit VS Code Extension

Interact with OpenAI Atlas pipelines without leaving VS Code. Ingest multimedia assets, organise and tag them for later review, and send clips to your own hosted open-source models for downstream analysis.

## Highlights

- **🤖 AI Chat Assistant** – Interactive chat panel with support for LM Studio (local), OpenRouter (cloud), and custom APIs. Code assistance, debugging, and real-time streaming responses.
- **One-click ingest** – add local audio, video, and image files to your Atlas pipeline directly from VS Code.
- **Media library explorer** – browse, search, and preview ingested clips from a dedicated Activity Bar view.
- **Offline-friendly caching** – when Atlas is unreachable, clips are persisted locally so your catalog stays available.
- **Custom model analysis** – connect any HTTP-compatible OSS model endpoint to score, classify, or summarise clips.
- **Extensible foundation** – TypeScript architecture with clear separation between client API calls, tree data, and webview rendering.

> ℹ️ This extension ships with minimal Atlas integration stubs. Replace the placeholder REST endpoints with your Atlas deployment details (or adapt the `AtlasClient` to call custom tooling APIs) to activate end-to-end workflows.

## ✨ New in v0.1.0: AI Chat Integration

Launch an interactive AI chat right in VS Code! Press `Ctrl+Shift+P` → `Atlas: Open AI Chat`

**Supported Providers:**
- **LM Studio** - Run Llama, Mistral, and other models locally (100% private)
- **OpenRouter** - Access GPT-4, Claude 3.5, and 100+ cloud models
- **Custom API** - Connect to any OpenAI-compatible endpoint

**Features:**
- Real-time streaming responses
- Export conversations to Markdown
- Adjustable temperature and token limits
- Full conversation history

See [`AI_CHAT_GUIDE.md`](./AI_CHAT_GUIDE.md) for detailed setup instructions.

---

## Quick Start

```bash
git clone https://github.com/moegon/special-roboto.git
cd special-roboto
npm install
code .
```

> **Requirements:** Node.js ≥ 20.19, VS Code ≥ 1.90, and Git. Enable GitHub Copilot or your preferred LLM assistant once the workspace opens for inline help.

### Run the VS Code extension

```bash
# inside the repo root
npm install
npm run compile
```

- Press `F5` in VS Code to launch the Extension Development Host.
- Configure `atlas.apiBaseUrl`, `atlas.modelEndpoint`, etc. via `File → Preferences → Settings → Extensions → Atlas Pipeline Toolkit`.

### Run the React admin console

```bash
cd admin-console
npm install
npm run dev
```

Visit `http://localhost:5173` and open the **Settings** drawer to point the UI at either the mock server or your Atlas deployment.

## Project Structure

```
.
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript build config
├── src/
│   ├── extension.ts         # Entry point & command wiring
│   ├── atlasClient.ts       # Atlas REST client + model analysis bridge
│   ├── mediaLibraryProvider.ts # TreeDataProvider for the media view
│   └── panels/
│       └── clipPreviewPanel.ts # Webview for clip previews
├── media/                  # VS Code activity bar assets
└── mock-server/            # Express mock API with /clips, /ingest, /models
```

## Atlas Admin Console (React)

A companion React dashboard lives in `admin-console/`. It pairs with the VS Code extension to offer a browser-first workstation for media governance, multi-model chat coordination, and operational analytics.

### Features

- **Library administration** – filter, tag, and annotate Atlas clips with real-time syncing against the pipeline API.
- **Insight workspace** – launch multiple chat tracks in parallel, each pointed at a different hosted OSS model.
- **Model registry** – configure inference gateways (vLLM, TGI, Modal, llamafile, etc.) and toggle defaults for new sessions.
- **Local discovery** – auto-detect locally hosted models exposed at `{modelDiscoveryBaseUrl}/v1/models` and import them in a single click.
- **Contract builder** – capture HTTP method, relative path, headers, and payload templates so Atlas can call each model correctly.
- **Persistent settings** – API base URL and model definitions persist locally for quick rehydration.

> 🛈 Running chat-only? Leave **Atlas Pipeline API** blank in the console settings to disable clip syncing while keeping model chat features active.

> ⚠️ When targeting LM Studio, enable **CORS** in the LM Studio server settings (Settings → Server → Enable CORS). Without it, the admin console’s browser requests fail with `TypeError: Failed to fetch`, the model discovery dropdown stays empty, and chat requests never reach the backend.

### Model discovery & contracts

Open the **Settings** drawer inside the console to:

- Scan `GET {modelDiscoveryBaseUrl}/v1/models` for nearby inference gateways (LM Studio, vLLM, TGI, llamafile, etc.) and import them into the registry.
- Describe each hosted model’s contract by specifying the HTTP method, relative path, headers, and sample request template.
- Persist multiple deployments and mark one as the default target for new chat sessions.

The chat workspace now resolves the configured contract when issuing requests, ensuring payloads land on the right endpoint (e.g., `POST https://inference.local/v1/chat` with custom headers).

### Mock Atlas API (optional)

A lightweight Express server in `mock-server/` emulates the Atlas pipeline API, including clip catalog, ingest, and model discovery routes. Use it for end-to-end local development:

```bash
cd mock-server
npm install
npm start
```

The server exposes:

- `GET /clips` – returns seeded sample clips.
- `POST /ingest` – accepts `multipart/form-data` uploads with `file`, `tags`, and `description`.
- `PATCH /clips/:id` – updates clip tags/description.
- `GET /models` – surfaces locally hosted OSS model endpoints for the admin console discovery dropdown.
- `GET /v1/models` – OpenAI-compatible discovery response that mirrors LM Studio for the admin console.

Point the VS Code extension (`atlas.apiBaseUrl`) and the React console’s **Atlas Pipeline API** field to `http://localhost:8080`. Set the **Model Discovery Base URL** to the same address if you want the mock server to provide discovery responses.

## Configuration

All settings live under the `atlas` namespace (`File → Preferences → Settings → Extensions → Atlas Pipeline Toolkit`):

| Setting | Description |
| --- | --- |
| `atlas.apiBaseUrl` | Base URL to your Atlas pipeline API. Expected to expose `/ingest` and `/clips` routes (see below). |
| `atlas.apiKey` | Optional bearer token shared by the Atlas API and the hosted model endpoint. |
| `atlas.modelEndpoint` | HTTP endpoint that accepts a JSON payload describing the clip and returns analysis metadata (summary, labels, scores, etc.). |

## Atlas API Expectations

The default `AtlasClient` assumes:

- `POST {apiBaseUrl}/ingest` accepts `multipart/form-data` with a `file` field (plus optional `tags` and `description` fields) and returns a JSON description of the ingested clip.
- `GET {apiBaseUrl}/clips` returns an array of clip objects with the fields defined in `AtlasClip` (see `src/atlasClient.ts`).

Adapt `src/atlasClient.ts` to meet your real Atlas deployment if the endpoints differ (e.g., streaming ingest, GraphQL queries, or RAG triggers).

## Hosted Model Contract

`atlas.analyseClip` posts a JSON payload to `atlas.modelEndpoint`:

```jsonc
{
  "clipId": "uuid",
  "clipName": "Weekly Standup.mp4",
  "previewUrl": "https://atlas.example/clips/uuid/preview",
  "transcriptUrl": "https://atlas.example/clips/uuid/transcript",
  "metadata": { /* provider-specific */ }
}
```

The extension expects a JSON response that may include:

- `summary` – short natural-language synopsis.
- `labels` – array of string tags or predictions.
- `scores` – object mapping label → numeric score.
- Any extra fields are logged under `rawResponse`.

Modify `AtlasClient.analyseClip` if your model needs a different payload or authentication scheme.

## Core Workflows

- **Ingest media** – Run `Atlas: Ingest Media` from the Command Palette or click the toolbar button in the Media Library. Pick one or more files, add optional tags/description, and the extension uploads them to Atlas (falling back to local cache on failure).
- **Browse & preview** – The *Media Library* tree view displays each clip with status badges. Selecting an item opens a preview webview with metadata and embedded video/audio/image players (when a `previewUrl` is supplied).
- **Analyse clips** – Right-click a clip (or run `Atlas: Analyse Clip`) to send it to your configured model endpoint. Results stream into the **Atlas Pipeline** output channel for quick review.

## Extending the Toolkit

- **Atlas Browser sessions** – Integrate automation flows by augmenting `AtlasClient` with endpoints that spin up Atlas Browser sessions, harvest browsing output, and attach artefacts to clips.
- **Metadata enrichment** – Add more fields to the `AtlasClip` interface, then extend the preview webview to visualise transcripts, thumbnails, or semantic hashes.
- **Workspace commands** – Register additional commands (e.g., `atlas.runRagSearch`) and expose them via the Activity Bar container contributed in `package.json`.
- **Testing** – Hook into VS Code's `vscode-test` runner and craft integration tests that mock Atlas API responses for deterministic validation.
- **Full-stack workflows** – Embed the React admin console into your Atlas deployment to give non-developers a streamlined view of clips, chats, and analytics while engineers live inside VS Code.

## Roadmap Ideas

1. Surface ingest progress per file with richer status indicators.
2. Support bulk tagging and catalog export (CSV/JSON).
3. Embed Atlas Browser automation logs alongside clip previews.
4. Add notebook-style diff views comparing analysis outputs across models.

## License

Set your project licence (MIT, Apache-2.0, etc.) before distribution.
