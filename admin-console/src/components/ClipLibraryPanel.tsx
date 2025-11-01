import React, { useMemo, useState } from "react";
import clsx from "clsx";
import type { AtlasClip } from "@/types";

interface ClipLibraryPanelProps {
  clips?: AtlasClip[];
  isLoading: boolean;
  selectedClipId?: string;
  onSelectClip: (clipId: string) => void;
  onStartChat: (clip: AtlasClip) => void;
  onRefresh: () => void;
}

const statusColors: Record<AtlasClip["status"], string> = {
  ready: "bg-emerald-500",
  processing: "bg-amber-500",
  pending: "bg-sky-500",
  failed: "bg-rose-500",
  "local-only": "bg-slate-500"
};

export const ClipLibraryPanel: React.FC<ClipLibraryPanelProps> = ({
  clips = [],
  isLoading,
  selectedClipId,
  onSelectClip,
  onStartChat,
  onRefresh
}) => {
  const [query, setQuery] = useState("");

  const filteredClips = useMemo(() => {
    if (!query.trim()) {
      return clips;
    }
    const lower = query.toLowerCase();
    return clips.filter((clip) => {
      return (
        clip.name.toLowerCase().includes(lower) ||
        clip.tags?.some((tag) => tag.toLowerCase().includes(lower)) ||
        clip.description?.toLowerCase().includes(lower)
      );
    });
  }, [clips, query]);

  return (
    <aside className="flex h-full flex-col border-r border-slate-800 bg-slate-950/60">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Media Library</h2>
          <p className="text-xs text-slate-500">
            {isLoading ? "Syncing with Atlas…" : `${clips.length} clip${clips.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
        >
          Refresh
        </button>
      </header>
      <div className="border-b border-slate-800 px-4 py-3">
        <input
          type="search"
          placeholder="Search clips…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-atlas-accent focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-8">
        {filteredClips.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            {isLoading ? "Loading clips…" : "No clips match your filters yet."}
          </div>
        )}
        <ul className="space-y-2">
          {filteredClips.map((clip) => (
            <li key={clip.id}>
              <button
                type="button"
                onClick={() => onSelectClip(clip.id)}
                className={clsx(
                  "block w-full rounded-lg border px-4 py-3 text-left transition",
                  selectedClipId === clip.id
                    ? "border-atlas-accent bg-slate-900/90 ring-2 ring-atlas-accent/50"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-100">{clip.name}</span>
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                      statusColors[clip.status]
                    )}
                  >
                    {clip.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-800/80 px-2 py-0.5 uppercase tracking-wide text-slate-300">
                    {clip.mediaType}
                  </span>
                  <span>{new Date(clip.createdAt).toLocaleString()}</span>
                </div>
                {clip.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {clip.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartChat(clip);
                    }}
                    className="rounded-md bg-atlas-primary/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary"
                  >
                    New Chat
                  </button>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
