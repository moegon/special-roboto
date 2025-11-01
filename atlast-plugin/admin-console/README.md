## Atlas Admin Console

Browser-based control surface for the Atlas media pipeline. Review and tag clips, orchestrate multi-model chat analyses, and configure inference gateways backed by open-source models.

### Highlights

- **Clip governance** – search, tag, and describe Atlas clips with live syncing to the pipeline API.
- **Multi-tenant chat** – orchestrate concurrent conversations against multiple OSS deployments.
- **Model discovery** – auto-import locally hosted inference servers returned by `GET {apiBaseUrl}/models`.
- **Contract builder** – capture HTTP method, path, headers, and payload templates for each deployment.

### Prerequisites

- Node.js ≥ 20.19 (Vite 7 requires Node 20 or 22)
- npm ≥ 10
- Optional: GitHub Copilot / LLM tooling in VS Code for pair-programming

### Quick start

```bash
cd admin-console
npm install
npm run dev
```

This launches a Vite dev server on `http://localhost:5173`. API calls to `/api/*` are proxied to `http://localhost:8080` (configure via `vite.config.ts` or the in-app settings drawer).

> Tip: Run `cd ../mock-server && npm install && npm start` to spin up the companion Atlas mock API with `/clips`, `/ingest`, and `/models` while you develop the UI.

### Project layout

```
admin-console/
├── public/              # Static assets (favicons, etc.)
├── src/
│   ├── components/      # Clip library, settings drawer, chat workspace
│   ├── context/         # Atlas configuration provider
│   ├── hooks/           # React Query clip sync + chat session orchestration
│   ├── services/        # REST helpers for Atlas + model endpoints
│   ├── types.ts         # Shared data contracts
│   └── App.tsx          # Dashboard composition
├── vite.config.ts       # Dev/prod bundler config with proxy rules
└── tailwind.config.ts   # Design tokens & class scanning
```

### API contracts

- `GET /clips` – returns `AtlasClip[]` for the library panel.
- `PATCH /clips/:id` – updates tags/description (extend as needed).
- `GET /models` – optional discovery endpoint returning `DiscoveredModel[]` objects (`id`, `name`, `endpoint`, `description`).
- Model inference endpoints accept a chat payload:
  ```jsonc
  {
    "sessionId": "uuid",
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "Summarise the clip" }
    ],
    "metadata": {
      "clipId": "clip-uuid"
    }
  }
  ```
  and respond with:
  ```jsonc
  {
    "message": {
      "role": "assistant",
      "content": "Here is the synthesis..."
    },
    "usage": {
      "promptTokens": 1024,
      "completionTokens": 256
    },
    "latencyMs": 1234
  }
  ```

Adjust `src/services/atlasApi.ts` if your Atlas gateway or inference runners use different routes/auth.

When you add a hosted model via the settings drawer, fill out the contract form to specify:

- `httpMethod` and relative `path` (combined with the deployment’s `endpoint`).
- Custom `headers` (JSON object) that should accompany every inference call.
- A sample `requestTemplate` to document the expected payload shape.
- Optional response-mapping notes for downstream operators.

### Production build

```bash
npm run build
```

Outputs live in `dist/`. Serve them via a CDN, fold into an Atlas admin container, or host alongside your inference gateways.
