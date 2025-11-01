import React, { useEffect, useMemo, useState } from "react";
import type { AtlasClip, ChatSession, ModelDeployment } from "@/types";

interface ChatWindowProps {
  session: ChatSession;
  models: ModelDeployment[];
  clip?: AtlasClip;
  onRename: (sessionId: string, title: string) => void;
  onSwitchModel: (sessionId: string, modelId: string) => void;
  onSendMessage: (message: string) => Promise<void>;
}

const roleStyles: Record<ChatSession["messages"][number]["role"], string> = {
  system: "bg-slate-800/60 border-slate-700 text-slate-300 self-center",
  user: "bg-atlas-primary/20 border-atlas-primary/40 text-atlas-accent self-end",
  assistant: "bg-slate-900/80 border-slate-800 text-slate-200 self-start"
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  models,
  clip,
  onRename,
  onSwitchModel,
  onSendMessage
}) => {
  const [title, setTitle] = useState(session.title);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setTitle(session.title);
  }, [session.title]);

  useEffect(() => {
    if (session.status !== "error") {
      setError(undefined);
    } else {
      setError(session.error ?? "Request failed");
    }
  }, [session.status, session.error]);

  const modelOptions = useMemo(
    () =>
      models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      )),
    [models]
  );

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    try {
      setSubmitting(true);
      await onSendMessage(trimmed);
      setDraft("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title.trim() && title.trim() !== session.title) {
              onRename(session.id, title.trim());
            } else {
              setTitle(session.title);
            }
          }}
          placeholder="Session title"
          className="flex-1 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-slate-500">Model</label>
          <select
            value={session.modelId}
            onChange={(event) => onSwitchModel(session.id, event.target.value)}
            className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          >
            {modelOptions}
          </select>
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${
              session.status === "running"
                ? "text-amber-400"
                : session.status === "error"
                  ? "text-rose-400"
                  : "text-emerald-400"
            }`}
          >
            {session.status}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-4">
          {clip ? (
            <div className="self-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
              <strong className="text-slate-200">Clip context:</strong> {clip.name} • {clip.mediaType} •{" "}
              {clip.tags?.join(", ") ?? "no tags"}
            </div>
          ) : null}
          {session.messages.length === 0 ? (
            <div className="self-center rounded-lg border border-dashed border-slate-700 px-4 py-3 text-xs text-slate-500">
              Send a prompt to kick off the model run.
            </div>
          ) : null}
          {session.messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg border px-4 py-3 text-sm leading-relaxed shadow ${roleStyles[message.role]}`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">
                {message.role} • {new Date(message.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4">
        {error ? <p className="mb-3 text-xs text-rose-400">Error: {error}</p> : null}
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask the model to summarise, classify, or cross-reference this clip…"
          rows={3}
          className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          disabled={session.status === "running"}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={session.status === "running" || submitting}
            className="rounded-md bg-atlas-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary/90 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {session.status === "running" || submitting ? "Streaming…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};
