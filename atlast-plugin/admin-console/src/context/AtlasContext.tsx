import React, { createContext, useContext, useMemo, useState } from "react";
import type { ModelDeployment, ModelContract } from "@/types";

interface AtlasContextValue {
  apiBaseUrl: string;
  models: ModelDeployment[];
  setApiBaseUrl: (value: string) => void;
  upsertModel: (model: ModelDeployment) => void;
  removeModel: (modelId: string) => void;
}

const AtlasContext = createContext<AtlasContextValue | undefined>(undefined);

const STORAGE_KEY = "atlas.admin.config";

interface PersistedConfig {
  apiBaseUrl: string;
  models: ModelDeployment[];
}

const defaultConfig: PersistedConfig = {
  apiBaseUrl: "http://localhost:8080",
  models: [
    {
      id: "llama-3-70b",
      name: "Llama 3 70B (Inference Gateway)",
      endpoint: "http://localhost:8000/inference",
      description: "High-capacity OSS model served via vLLM or TGI.",
      default: true,
      concurrencyLimit: 4,
      contract: {
        httpMethod: "POST",
        path: "/",
        headers: {
          "Content-Type": "application/json"
        },
        requestTemplate: JSON.stringify(
          {
            sessionId: "<uuid>",
            messages: [
              { role: "system", content: "You are an assistant." },
              { role: "user", content: "Summarise the clip." }
            ]
          },
          null,
          2
        )
      }
    },
    {
      id: "whisper-large",
      name: "Whisper Large-v3 (Audio Intelligence)",
      endpoint: "http://localhost:8001/inference",
      description: "Audio transcription and understanding model.",
      default: false,
      concurrencyLimit: 2,
      contract: {
        httpMethod: "POST",
        path: "/",
        headers: {
          "Content-Type": "application/json"
        },
        requestTemplate: JSON.stringify(
          {
            sessionId: "<uuid>",
            task: "transcribe",
            audioUrl: "<clipPreviewUrl>"
          },
          null,
          2
        )
      }
    }
  ]
};

function loadConfig(): PersistedConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultConfig;
    }
    const parsed = JSON.parse(raw) as PersistedConfig;
    return {
      apiBaseUrl: parsed.apiBaseUrl ?? defaultConfig.apiBaseUrl,
      models: parsed.models?.length ? parsed.models : defaultConfig.models
    };
  } catch (error) {
    console.warn("Failed to load Atlas admin config from storage", error);
    return defaultConfig;
  }
}

function persistConfig(config: PersistedConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to persist Atlas admin config", error);
  }
}

export const AtlasProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<PersistedConfig>(() => loadConfig());

  const value = useMemo<AtlasContextValue>(
    () => ({
      apiBaseUrl: config.apiBaseUrl,
      models: config.models,
      setApiBaseUrl: (value: string) => {
        setConfig((prev) => {
          const next = { ...prev, apiBaseUrl: value };
          persistConfig(next);
          return next;
        });
      },
      upsertModel: (model: ModelDeployment) => {
        setConfig((prev) => {
          const existingIndex = prev.models.findIndex((item) => item.id === model.id);
          let models = [...prev.models];
          if (existingIndex >= 0) {
            models[existingIndex] = { ...models[existingIndex], ...model };
          } else {
            models.push(model);
          }
          if (model.default) {
            models = models.map((entry) =>
              entry.id === model.id
                ? { ...entry, default: true }
                : {
                    ...entry,
                    default: false
                  }
            );
          }
          const next = { ...prev, models };
          persistConfig(next);
          return next;
        });
      },
      removeModel: (modelId: string) => {
        setConfig((prev) => {
          const filtered = prev.models.filter((model) => model.id !== modelId);
          const next = { ...prev, models: filtered };
          persistConfig(next);
          return next;
        });
      }
    }),
    [config]
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
};

export function useAtlasConfig(): AtlasContextValue {
  const context = useContext(AtlasContext);
  if (!context) {
    throw new Error("useAtlasConfig must be used within an AtlasProvider");
  }
  return context;
}
