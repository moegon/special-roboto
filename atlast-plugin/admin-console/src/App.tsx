import React, { useEffect, useMemo, useState } from "react";
import { ClipLibraryPanel } from "@/components/ClipLibraryPanel";
import { ClipDetailsPanel } from "@/components/ClipDetailsPanel";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useClips } from "@/hooks/useClips";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useAtlasConfig } from "@/context/AtlasContext";
import type { AtlasClip } from "@/types";

const App: React.FC = () => {
  const { clipsQuery, updateMutation } = useClips();
  const { sessions, startSession, closeSession, renameSession, switchModel, sendMessage } = useChatSessions();
  const { apiBaseUrl } = useAtlasConfig();
  const [selectedClipId, setSelectedClipId] = useState<string>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>();

  const clips = clipsQuery.data ?? [];
  const selectedClip = useMemo(
    () => clips.find((clip) => clip.id === selectedClipId),
    [clips, selectedClipId]
  );

  useEffect(() => {
    if (!selectedClipId && clips.length) {
      setSelectedClipId(clips[0].id);
    } else if (selectedClipId && !clips.some((clip) => clip.id === selectedClipId)) {
      setSelectedClipId(clips[0]?.id);
    }
  }, [clips, selectedClipId]);

  useEffect(() => {
    if (!sessions.length) {
      setActiveSessionId(undefined);
      return;
    }
    if (activeSessionId && !sessions.some((session) => session.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const handleStartChatForClip = (clip: AtlasClip) => {
    const existing = sessions.find((session) => session.clipId === clip.id);
    const session = existing ?? startSession({ clipId: clip.id, title: `Clip • ${clip.name}` });
    setActiveSessionId(session.id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-900/80 bg-slate-950/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/atlas.svg" alt="Atlas" className="h-8 w-8" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Atlas Admin Console</h1>
            <p className="text-xs text-slate-500">
              Govern media ingestion, orchestrate model chats, and drive insights across OSS deployments.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {clipsQuery.isFetching ? (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
              Syncing…
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
          >
            Settings
          </button>
        </div>
      </header>
      <main className="grid h-[calc(100vh-64px)] grid-cols-[320px_minmax(320px,1.2fr)_minmax(480px,2fr)]">
        <ClipLibraryPanel
          clips={clips}
          isLoading={clipsQuery.isLoading || clipsQuery.isFetching}
          canRefresh={Boolean(apiBaseUrl?.trim())}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onStartChat={handleStartChatForClip}
          onRefresh={() => {
            if (!apiBaseUrl?.trim()) {
              return;
            }
            void clipsQuery.refetch();
          }}
        />
        <ClipDetailsPanel
          clip={selectedClip}
          onSave={async (input) => {
            await updateMutation.mutateAsync(input);
          }}
          isSaving={updateMutation.isPending}
          pipelineConfigured={Boolean(apiBaseUrl?.trim())}
        />
        <ChatWorkspace
          sessions={sessions}
          selectedClip={selectedClip}
          onStartSession={startSession}
          onCloseSession={closeSession}
          onRenameSession={renameSession}
          onSwitchModel={switchModel}
          onSendMessage={async (sessionId, content) => {
            await sendMessage(sessionId, content, { clipContext: selectedClip?.metadata });
          }}
          activeSessionId={activeSessionId}
          onActiveSessionChange={setActiveSessionId}
        />
      </main>
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default App;
