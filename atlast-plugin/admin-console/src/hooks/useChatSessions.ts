import { useCallback, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useAtlasConfig } from "@/context/AtlasContext";
import { sendChatRequest } from "@/services/atlasApi";
import type { ChatMessage, ChatSession, ModelDeployment } from "@/types";

interface StartSessionOptions {
  modelId?: string;
  clipId?: string;
  title?: string;
  systemPrompt?: string;
}

interface SendMessageOptions {
  clipContext?: Record<string, unknown>;
}

const DEFAULT_TITLE = "Untitled Chat";

export function useChatSessions() {
  const { models } = useAtlasConfig();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  const modelMap = useMemo(() => new Map(models.map((model) => [model.id, model])), [models]);

  const ensureModel = useCallback(
    (modelId?: string): ModelDeployment => {
      if (modelId) {
        const match = modelMap.get(modelId);
        if (match) {
          return match;
        }
      }
      const fallback = models.find((model) => model.default) ?? models[0];
      if (!fallback) {
        throw new Error("No model endpoints configured. Add one in the settings panel first.");
      }
      return fallback;
    },
    [modelMap, models]
  );

  const startSession = useCallback(
    (options: StartSessionOptions = {}): ChatSession => {
      const model = ensureModel(options.modelId);
      const now = new Date().toISOString();
      const baseMessages: ChatMessage[] = options.systemPrompt
        ? [
            {
              id: nanoid(),
              role: "system",
              content: options.systemPrompt,
              createdAt: now
            }
          ]
        : [];

      const session: ChatSession = {
        id: nanoid(),
        clipId: options.clipId,
        modelId: model.id,
        title: options.title ?? DEFAULT_TITLE,
        messages: baseMessages,
        createdAt: now,
        updatedAt: now,
        status: "idle"
      };

      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [ensureModel]
  );

  const closeSession = useCallback((sessionId: string) => {
    controllers.current.get(sessionId)?.abort();
    controllers.current.delete(sessionId);
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  }, []);

  const renameSession = useCallback((sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title
            }
          : session
      )
    );
  }, []);

  const switchModel = useCallback(
    (sessionId: string, modelId: string) => {
      const model = ensureModel(modelId);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                modelId: model.id,
                updatedAt: new Date().toISOString(),
                status: "idle",
                error: undefined
              }
            : session
        )
      );
    },
    [ensureModel]
  );

  const appendMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: message.createdAt
            }
          : session
      )
    );
  }, []);

  const setSessionStatus = useCallback((sessionId: string, status: ChatSession["status"], error?: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status,
              error,
              updatedAt: new Date().toISOString()
            }
          : session
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (sessionId: string, content: string, options: SendMessageOptions = {}) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const model = ensureModel(session.modelId);
      const timestamp = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content,
        createdAt: timestamp
      };

      appendMessage(sessionId, userMessage);
      setSessionStatus(sessionId, "running");

      controllers.current.get(sessionId)?.abort();
      const controller = new AbortController();
      controllers.current.set(sessionId, controller);

      try {
        const response = await sendChatRequest(
          model,
          {
            sessionId,
            messages: [...session.messages, userMessage].map(({ role, content: messageContent }) => ({
              role,
              content: messageContent
            })),
            metadata: {
              clipId: session.clipId,
              ...options.clipContext
            }
          },
          controller.signal
        );

        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: response.message.content,
          createdAt: new Date().toISOString()
        };
        appendMessage(sessionId, assistantMessage);
        setSessionStatus(sessionId, "idle");
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setSessionStatus(sessionId, "error", (error as Error).message);
      }
    },
    [appendMessage, ensureModel, sessions, setSessionStatus]
  );

  return {
    sessions,
    startSession,
    closeSession,
    renameSession,
    switchModel,
    sendMessage
  };
}
