import React, { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useAtlasConfig } from "@/context/AtlasContext";
import type { DiscoveredModel, ModelContract, ModelDeployment } from "@/types";
import { ModelContractForm } from "./ModelContractForm";
import { useDiscoveredModels } from "@/hooks/useDiscoveredModels";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyContract = (): ModelContract => ({
  httpMethod: "POST",
  path: "/",
  headers: {
    "Content-Type": "application/json"
  },
  requestTemplate: JSON.stringify(
    {
      sessionId: "<uuid>",
      messages: [
        { role: "system", content: "You are an analyst specialised in multimedia intelligence." },
        { role: "user", content: "Please summarise the attached clip." }
      ]
    },
    null,
    2
  )
});

const emptyModel = (): ModelDeployment => ({
  id: nanoid(8),
  name: "",
  description: "",
  endpoint: "",
  default: false,
  concurrencyLimit: undefined,
  contract: emptyContract()
});

const fromDiscovered = (input: DiscoveredModel): ModelDeployment => ({
  id: input.id || nanoid(8),
  name: input.name,
  description: input.description,
  endpoint: input.endpoint,
  default: false,
  concurrencyLimit: undefined,
  contract: emptyContract()
});

const cloneModel = (model: ModelDeployment): ModelDeployment => ({
  ...model,
  contract: model.contract
    ? {
        ...model.contract,
        headers: model.contract.headers ? { ...model.contract.headers } : undefined
      }
    : emptyContract()
});

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    apiBaseUrl,
    modelDiscoveryBaseUrl,
    setApiBaseUrl,
    setModelDiscoveryBaseUrl,
    models,
    upsertModel,
    removeModel
  } = useAtlasConfig();
  const discovery = useDiscoveredModels(isOpen);
  const discoveredModels = discovery.data ?? [];
  const [selectedDiscoveredId, setSelectedDiscoveredId] = useState<string>("");
  const [draftModel, setDraftModel] = useState<ModelDeployment | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraftModel(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (draftModel?.contract) {
      return;
    }
    if (draftModel) {
      setDraftModel({ ...draftModel, contract: emptyContract() });
    }
  }, [draftModel]);

  const selectedDiscoveredModel = useMemo(
    () => discoveredModels.find((model) => model.id === selectedDiscoveredId),
    [discoveredModels, selectedDiscoveredId]
  );

  const discoveryModelsUrl = useMemo(() => {
    if (!modelDiscoveryBaseUrl) {
      return "";
    }
    const trimmed = modelDiscoveryBaseUrl.replace(/\/$/, "");
    return trimmed.endsWith("/v1") ? `${trimmed}/models` : `${trimmed}/v1/models`;
  }, [modelDiscoveryBaseUrl]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[520px] overflow-y-auto border-l border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Atlas Admin Settings</h2>
          <p className="text-xs text-slate-500">Configure API endpoints, discover local models, and define contracts.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
        >
          Close
        </button>
      </header>
      <div className="space-y-8 px-6 py-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Atlas Pipeline API</h3>
          <p className="mt-2 text-sm text-slate-400">
            All media operations, catalog updates, and clip discovery calls use this base URL. Point it at your Atlas
            pipeline (or the bundled mock server) so the console can manage clips and metadata.
          </p>
          <input
            type="url"
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            className="mt-3 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
            placeholder="http://localhost:8080"
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Model Discovery Base URL</h3>
          <p className="mt-2 text-sm text-slate-400">
            Provide the base URL for LM Studio or any OpenAI-compatible gateway that exposes <code className="rounded bg-slate-900 px-1 py-0.5 text-xs">/v1/models</code>.
            Atlas will use this address when scanning for available deployments.
          </p>
          <input
            type="url"
            value={modelDiscoveryBaseUrl}
            onChange={(event) => setModelDiscoveryBaseUrl(event.target.value)}
            className="mt-3 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
            placeholder="http://172.16.1.81:1234"
          />
          <p className="mt-2 text-xs text-slate-500">
            Examples: <code className="rounded bg-slate-900 px-1 py-0.5">http://172.16.1.81:1234</code> (LM Studio) or <code className="rounded bg-slate-900 px-1 py-0.5">https://api.openai.com</code> (OpenAI).
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Discovered Local Models</h3>
            <button
              type="button"
              onClick={() => {
                if (!modelDiscoveryBaseUrl) {
                  return;
                }
                discovery.refetch();
              }}
              disabled={!modelDiscoveryBaseUrl}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Refresh
            </button>
          </div>
          {discoveryModelsUrl ? (
            <p className="mt-2 text-sm text-slate-400">
              Atlas will query <code className="rounded bg-slate-900 px-1 py-0.5 text-xs">{discoveryModelsUrl}</code> for available models from
              LM Studio or other OpenAI-compatible endpoints. Import a model to use it with the configured contract.
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-400">
              Set the model discovery base URL above to enable automatic model scanning.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <select
              value={selectedDiscoveredId}
              onChange={(event) => setSelectedDiscoveredId(event.target.value)}
              className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
            >
              <option value="">Select a discovered deployment…</option>
              {discoveredModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.endpoint})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedDiscoveredModel}
              onClick={() => {
                if (!selectedDiscoveredModel) {
                  return;
                }
                setDraftModel(cloneModel(fromDiscovered(selectedDiscoveredModel)));
              }}
              className="rounded-md bg-atlas-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary/90 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Import
            </button>
          </div>
          {discovery.isLoading ? (
            <p className="mt-2 text-xs text-slate-500">Scanning for local deployments…</p>
          ) : null}
          {discovery.error ? (
            <p className="mt-2 text-xs text-rose-400">
              {(discovery.error as Error).message || "Failed to reach discovery endpoint."}
            </p>
          ) : null}
          {selectedDiscoveredModel?.description ? (
            <p className="mt-2 text-xs text-slate-400">{selectedDiscoveredModel.description}</p>
          ) : null}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Configured Model Endpoints</h3>
            <button
              type="button"
              onClick={() => setDraftModel(emptyModel())}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Each deployment encapsulates a hosted OSS model contract. Default deployments bootstrap new chat sessions.
          </p>
          <div className="mt-4 space-y-4">
            {models.map((model) => (
              <article key={model.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{model.name}</h4>
                    <p className="text-xs text-slate-500">{model.endpoint}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftModel(cloneModel(model))}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModel(model.id)}
                      className="rounded-md border border-rose-600 px-2 py-1 text-xs uppercase tracking-wide text-rose-300 hover:border-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {model.description ? <p className="mt-2 text-xs text-slate-400">{model.description}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>
                    Default: <span className="font-semibold text-slate-200">{model.default ? "Yes" : "No"}</span>
                  </span>
                  {model.concurrencyLimit ? (
                    <span>
                      Concurrency <span className="font-semibold text-slate-200">{model.concurrencyLimit}</span>
                    </span>
                  ) : null}
                  {model.contract ? (
                    <span>
                      Contract:{" "}
                      <span className="font-semibold text-slate-200">
                        {model.contract.httpMethod} {model.contract.path}
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-400">No contract defined</span>
                  )}
                </div>
              </article>
            ))}
            {models.length === 0 ? (
              <p className="text-sm text-slate-500">No deployments configured yet. Add one to power the chat workspace.</p>
            ) : null}
          </div>
        </section>

        {draftModel ? (
          <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <header className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {models.some((model) => model.id === draftModel.id) ? "Edit Deployment" : "New Deployment"}
                </h3>
                <p className="text-xs text-slate-500">
                  Define the metadata and contract Atlas will use to communicate with this model.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftModel(null)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
            </header>
            <div className="space-y-3">
              <input
                type="text"
                value={draftModel.name}
                onChange={(event) => setDraftModel({ ...draftModel, name: event.target.value })}
                placeholder="Deployment name"
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
              />
              <textarea
                value={draftModel.description ?? ""}
                onChange={(event) => setDraftModel({ ...draftModel, description: event.target.value })}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
              />
              <input
                type="url"
                value={draftModel.endpoint}
                onChange={(event) => setDraftModel({ ...draftModel, endpoint: event.target.value })}
                placeholder="http://localhost:8000/inference"
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={draftModel.default}
                  onChange={(event) => setDraftModel({ ...draftModel, default: event.target.checked })}
                  className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-atlas-primary focus:ring-atlas-accent"
                />
                Use as default deployment for new sessions
              </label>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Concurrency limit (optional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={draftModel.concurrencyLimit ?? ""}
                  onChange={(event) =>
                    setDraftModel({
                      ...draftModel,
                      concurrencyLimit: event.target.value ? Number(event.target.value) : undefined
                    })
                  }
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
                />
              </div>
              <ModelContractForm
                value={draftModel.contract ?? emptyContract()}
                onChange={(contract) => setDraftModel({ ...draftModel, contract })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraftModel(null)}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftModel.name || !draftModel.endpoint) {
                    return;
                  }
                  upsertModel({
                    ...draftModel,
                    contract: draftModel.contract ?? emptyContract()
                  });
                  setDraftModel(null);
                }}
                className="rounded-md bg-atlas-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary/90"
              >
                Save Deployment
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};
