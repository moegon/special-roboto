# Atlas Pipeline Toolkit

Interact with OpenAI Atlas pipelines from both VS Code and the web. Ingest multimedia assets, organise and tag them for review, and send clips to your own hosted open-source models for downstream analysis.

## Quick Start

```
git clone https://github.com/moegon/special-roboto.git
cd special-roboto
npm install
code .
```

> Requirements: Node.js ≥ 20.19, VS Code ≥ 1.90, and Git. Once the workspace opens, feel free to enable GitHub Copilot or your preferred LLM assistant for inline help.

### VS Code extension

```
# inside the repo root
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host, then configure `atlas.*` settings under `File → Preferences → Settings → Extensions → Atlas Pipeline Toolkit`.

### React admin console

```
cd admin-console
npm install
npm run dev
```

Visit `http://localhost:5173`, open the **Settings** drawer, and point the UI at your Atlas deployment or the mock server.

### Optional mock Atlas API

```
cd mock-server
npm install
npm start
```

The mock service exposes `/clips`, `/ingest`, and `/models` so both the extension and admin console can run end to end without an Atlas backend.

## Highlights

- **One-click ingest** – add local audio, video, and image files to Atlas directly from VS Code.
- **Media library explorer** – browse, search, and preview ingested clips from a dedicated Activity Bar view.
- **Offline-friendly caching** – when Atlas is unreachable, clips persist locally so your catalog stays available.
- **Custom model analysis** – connect any HTTP-compatible OSS model endpoint to score, classify, or summarise clips.
- **Browser admin console** – manage catalog metadata and orchestrate chats with multiple hosted models.

## Project Structure

```
.
├── package.json             # VS Code extension manifest
├── tsconfig.json            # Extension TypeScript config
├── src/                     # Extension source (commands, Atlas client, preview webview)
├── media/                   # Activity Bar icon assets
├── admin-console/           # React/Vite admin dashboard
└── mock-server/             # Express mock API (clips/ingest/models)
```

## VS Code Extension

```
.
├── src/extension.ts         # Entry point & command wiring
├── src/atlasClient.ts       # Atlas REST client + model analysis bridge
├── src/mediaLibraryProvider.ts # TreeDataProvider for the media view
└── src/panels/clipPreviewPanel.ts # Webview for clip previews
```

### Core workflows

- **Ingest media** – Run `Atlas: Ingest Media` or use the Media Library toolbar. Pick files, add optional tags/description, and the extension uploads them to Atlas (falling back to local cache on failure).
- **Browse & preview** – The *Media Library* tree view displays each clip with status badges. Selecting an item opens a preview webview with metadata and embedded video/audio/image players (when a `previewUrl` is supplied).
- **Analyse clips** – Right-click a clip (or run `Atlas: Analyse Clip`) to send it to your configured model endpoint. Results stream into the **Atlas Pipeline** output channel for quick review.

### Configuration

All settings live under the `atlas` namespace (`File → Preferences → Settings → Extensions → Atlas Pipeline Toolkit`):

| Setting | Description |
| --- | --- |
| `atlas.apiBaseUrl` | Base URL to your Atlas pipeline API. Expected to expose `/ingest` and `/clips` routes. |
| `atlas.apiKey` | Optional bearer token shared by the Atlas API and the hosted model endpoint. |
| `atlas.modelEndpoint` | HTTP endpoint that accepts a JSON payload describing the clip and returns analysis metadata. |

The default `AtlasClient` expects:

- `POST {apiBaseUrl}/ingest` accepts `multipart/form-data` with a `file` field (plus optional `tags` and `description`).
- `GET {apiBaseUrl}/clips` returns an array of clip objects (`AtlasClip`).

Adapt `src/atlasClient.ts` if your deployment differs (streaming ingest, GraphQL, RAG triggers, etc.).

## Admin Console (React)

The `admin-console/` folder contains a Vite + Tailwind dashboard for operations teams.

### Highlights

- **Library administration** – filter, tag, and annotate clips with live syncing against the pipeline API.
- **Insight workspace** – launch multiple chat tracks in parallel, each talking to a different hosted OSS model.
- **Model registry** – configure inference gateways (vLLM, TGI, llamafile, Modal, etc.) and toggle defaults.
- **Local discovery** – auto-detect models exposed at `{apiBaseUrl}/models` and import them in a click.
- **Contract builder** – capture HTTP method, path, headers, and payload templates so Atlas can call each model correctly.

### Contracts & discovery

Open the **Settings** drawer to scan `GET {apiBaseUrl}/models`, import discovered deployments, and describe their contracts. The chat workspace uses this metadata to craft requests (e.g., `POST https://inference.local/v1/chat` with custom headers).

### Production build

```
cd admin-console
npm run build
```

Outputs live in `admin-console/dist/` and can be served via any static host.

## Extending the Toolkit

- **Atlas Browser sessions** – Extend `AtlasClient` with endpoints that spin up Atlas Browser automations and attach artefacts to clips.
- **Metadata enrichment** – Add more fields to `AtlasClip` and visualise transcripts, thumbnails, or semantic hashes in the preview.
- **Workspace commands** – Register additional VS Code commands (e.g., `atlas.runRagSearch`) and surface them via the Activity Bar.
- **Testing** – Wire up `vscode-test` for extension automation and add integration tests for the admin console using mocked APIs.

## Roadmap Ideas

1. Surface ingest progress per file with richer status indicators.
2. Support bulk tagging and catalog export (CSV/JSON).
3. Embed Atlas Browser automation logs alongside clip previews.
4. Add notebook-style diff views comparing analysis outputs across models.

## License

Choose a license (MIT, Apache-2.0, etc.) before distributing the toolkit.

---

Need an extra hand? Open an issue or ping @moegon—happy to pair on extending the toolkit or wiring it into your Atlas deployment.
