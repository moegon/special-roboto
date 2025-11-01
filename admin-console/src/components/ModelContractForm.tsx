import React, { useEffect, useMemo, useState } from "react";
import type { ModelContract } from "@/types";

interface ModelContractFormProps {
  value: ModelContract;
  onChange: (contract: ModelContract) => void;
}

export const ModelContractForm: React.FC<ModelContractFormProps> = ({ value, onChange }) => {
  const [headersDraft, setHeadersDraft] = useState("");
  const [headersError, setHeadersError] = useState<string>();

  useEffect(() => {
    setHeadersDraft(JSON.stringify(value.headers ?? {}, null, 2));
  }, [value.headers]);

  const requestTemplateDraft = useMemo(() => value.requestTemplate ?? "", [value.requestTemplate]);
  const responseMappingDraft = useMemo(() => value.responseMapping ?? "", [value.responseMapping]);

  const applyHeaders = (draft: string) => {
    setHeadersDraft(draft);
    try {
      const parsed = draft.trim() ? (JSON.parse(draft) as Record<string, string>) : undefined;
      setHeadersError(undefined);
      onChange({
        ...value,
        headers: parsed
      });
    } catch (error) {
      setHeadersError((error as Error).message);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex gap-3">
        <div className="w-32">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">HTTP Method</label>
          <select
            value={value.httpMethod}
            onChange={(event) =>
              onChange({
                ...value,
                httpMethod: event.target.value as ModelContract["httpMethod"]
              })
            }
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Path</label>
          <input
            value={value.path}
            onChange={(event) =>
              onChange({
                ...value,
                path: event.target.value
              })
            }
            placeholder="/"
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Headers (JSON object)
        </label>
        <textarea
          value={headersDraft}
          onChange={(event) => applyHeaders(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 focus:border-atlas-accent focus:outline-none"
        />
        {headersError ? <p className="mt-1 text-xs text-rose-400">Invalid JSON: {headersError}</p> : null}
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Request Template (JSON or string)
        </label>
        <textarea
          value={requestTemplateDraft}
          onChange={(event) =>
            onChange({
              ...value,
              requestTemplate: event.target.value || undefined
            })
          }
          rows={8}
          className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 focus:border-atlas-accent focus:outline-none"
          placeholder='{"messages":[{"role":"user","content":"Summarise the clip"}]}'
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Response Mapping Notes (optional)
        </label>
        <textarea
          value={responseMappingDraft}
          onChange={(event) =>
            onChange({
              ...value,
              responseMapping: event.target.value || undefined
            })
          }
          rows={4}
          className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 focus:border-atlas-accent focus:outline-none"
          placeholder="Describe how to map model responses into the chat UI."
        />
      </div>
    </div>
  );
};
