import React, { useMemo } from "react";
import { useAtlasConfig } from "@/context/AtlasContext";
import type { AtlasClip, ChatSession } from "@/types";
import { ChatWindow } from "./ChatWindow";

interface ChatWorkspaceProps {
  sessions: ChatSession[];
  onStartSession: (options?: { clipId?: string; title?: string; modelId?: string }) => ChatSession;
  onCloseSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onSwitchModel: (sessionId: string, modelId: string) => void;
  onSendMessage: (sessionId: string, content: string) => Promise<void>;
  selectedClip?: AtlasClip;
  activeSessionId?: string;
  onActiveSessionChange: (sessionId?: string) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  sessions,
  onStartSession,
  onCloseSession,
  onRenameSession,
  onSwitchModel,
  onSendMessage,
  selectedClip,
  activeSessionId,
  onActiveSessionChange
}) => {
  const { models } = useAtlasConfig();

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId]
  );

  const handleStartGeneralSession = () => {
    const session = onStartSession({
      title: "General Analysis"
    });
    onActiveSessionChange(session.id);
  };

  const handleStartClipSession = () => {
    if (!selectedClip) {
      return handleStartGeneralSession();
    }
    const session = onStartSession({
      clipId: selectedClip.id,
      title: `Clip • ${selectedClip.name}`
    });
    onActiveSessionChange(session.id);
  };

  return (
    <section className="flex h-full flex-col bg-slate-900/20">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Model Chat Orchestrator</h2>
          <p className="text-xs text-slate-500">
            Connect to hosted OSS models to run analyses in parallel. {models.length} deployment
            {models.length === 1 ? "" : "s"} configured.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleStartGeneralSession}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
          >
            New Session
          </button>
          <button
            type="button"
            onClick={handleStartClipSession}
            className="rounded-md bg-atlas-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-atlas-primary/90"
          >
            Analyse Clip
          </button>
        </div>
      </header>
      <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 px-4 py-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onActiveSessionChange(session.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
              (activeSession?.id ?? activeSessionId) === session.id
                ? "bg-atlas-primary/20 text-atlas-accent"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="truncate max-w-[160px]">{session.title}</span>
            <span
              className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400"
              title={session.modelId}
            >
              {models.find((model) => model.id === session.modelId)?.name ?? session.modelId}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onCloseSession(session.id);
                if ((activeSession?.id ?? activeSessionId) === session.id) {
                  const remaining = sessions.filter((item) => item.id !== session.id);
                  onActiveSessionChange(remaining[0]?.id);
                }
              }}
              className="ml-2 text-slate-500 hover:text-rose-400"
            >
              ×
            </span>
          </button>
        ))}
        {sessions.length === 0 ? (
          <span className="text-xs text-slate-500">No active chats. Launch a new session to begin.</span>
        ) : null}
      </nav>
      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <ChatWindow
            session={activeSession}
            models={models}
            clip={selectedClip}
            onRename={onRenameSession}
            onSwitchModel={onSwitchModel}
            onSendMessage={async (message) => {
              await onSendMessage(activeSession.id, message);
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-12 text-center text-sm text-slate-500">
            Start a new chat session to orchestrate model calls across your Atlas catalog.
          </div>
        )}
      </div>
    </section>
  );
};
