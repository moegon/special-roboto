import React, { useEffect, useState } from "react";
import type { AtlasClip } from "@/types";

interface ClipDetailsPanelProps {
  clip?: AtlasClip;
  onSave: (input: { clipId: string; tags: string[]; description?: string }) => Promise<void> | void;
  isSaving: boolean;
}

function formatTags(tags?: string[]): string {
  return tags?.join(", ") ?? "";
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const ClipDetailsPanel: React.FC<ClipDetailsPanelProps> = ({ clip, onSave, isSaving }) => {
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string>();

  useEffect(() => {
    setTags(formatTags(clip?.tags));
    setDescription(clip?.description ?? "");
    setStatus("idle");
    setError(undefined);
  }, [clip?.id]);

  if (!clip) {
    return (
      <section className="flex h-full flex-col border-r border-slate-800 bg-slate-900/40">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-sm text-slate-400">
          Select a clip from the library to inspect media metadata, update its catalog tags, and launch chat-based
          analyses.
        </div>
      </section>
    );
  }

  const created = new Date(clip.createdAt).toLocaleString();

  return (
    <section className="flex h-full flex-col border-r border-slate-800 bg-slate-900/40">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{clip.name}</h2>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {clip.mediaType} • {clip.status}
            </p>
            <p className="mt-1 text-xs text-slate-500">Created {created}</p>
          </div>
          {status === "success" ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Saved</span>
          ) : null}
          {status === "error" ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-rose-400">{error}</span>
          ) : null}
        </div>
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</label>
          <input
            type="text"
            placeholder="highlights, marketing, voiceover"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</label>
          <textarea
            placeholder="Add catalog notes for downstream teams…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-atlas-accent focus:outline-none"
          />
        </div>
        {clip.previewUrl ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</label>
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-800 bg-black">
              {clip.mediaType === "video" ? (
                <video controls src={clip.previewUrl} className="w-full" />
              ) : clip.mediaType === "audio" ? (
                <audio controls src={clip.previewUrl} className="w-full" />
              ) : (
                <img src={clip.previewUrl} alt={clip.name} className="w-full" />
              )}
            </div>
          </div>
        ) : null}
        {clip.metadata ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Metadata</label>
            <pre className="mt-2 max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
              {JSON.stringify(clip.metadata, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
      <footer className="border-t border-slate-800 px-6 py-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            try {
              setStatus("idle");
              setError(undefined);
              await onSave({
                clipId: clip.id,
                tags: parseTags(tags),
                description: description || undefined
              });
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError((err as Error).message);
            }
          }}
          className="w-full rounded-md bg-atlas-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary/90 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </footer>
    </section>
  );
};
