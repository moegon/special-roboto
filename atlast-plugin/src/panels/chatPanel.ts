import * as vscode from "vscode";
import { AIChatClient, ChatMessage } from "../aiChatClient";

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private messages: ChatMessage[] = [];
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    _extensionUri: vscode.Uri,
    private readonly chatClient: AIChatClient,
    private readonly logger: vscode.OutputChannel
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtmlContent(_extensionUri);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "sendMessage":
            await this.handleSendMessage(message.content);
            break;
          case "clearChat":
            this.handleClearChat();
            break;
          case "exportChat":
            await this.handleExportChat();
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public static show(
    extensionUri: vscode.Uri,
    chatClient: AIChatClient,
    logger: vscode.OutputChannel
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "atlasChat",
      "Atlas AI Chat",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, chatClient, logger);
  }

  private async handleSendMessage(content: string): Promise<void> {
    if (!content.trim()) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = { role: "user", content };
    this.messages.push(userMessage);
    void this.panel.webview.postMessage({
      type: "addMessage",
      message: { role: "user", content }
    });

    // Show typing indicator
    void this.panel.webview.postMessage({ type: "showTyping" });

    try {
      // Send to AI
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      this.messages.push(assistantMessage);

      await this.chatClient.sendMessage(this.messages, (chunk) => {
        if (!chunk.done) {
          assistantMessage.content += chunk.content;
          void this.panel.webview.postMessage({
            type: "updateAssistantMessage",
            content: chunk.content
          });
        } else {
          void this.panel.webview.postMessage({ type: "hideTyping" });
          this.logger.appendLine(`[Chat] Response completed: ${assistantMessage.content.length} chars`);
        }
      });
    } catch (error) {
      void this.panel.webview.postMessage({ type: "hideTyping" });
      void this.panel.webview.postMessage({
        type: "showError",
        error: (error as Error).message
      });
      this.logger.appendLine(`[Chat] Error: ${(error as Error).message}`);
      // Remove failed assistant message
      this.messages.pop();
    }
  }

  private handleClearChat(): void {
    this.messages = [];
    void this.panel.webview.postMessage({ type: "clearMessages" });
    this.logger.appendLine("[Chat] Conversation cleared");
  }

  private async handleExportChat(): Promise<void> {
    const chatLog = this.messages
      .map((msg) => `**${msg.role.toUpperCase()}**: ${msg.content}`)
      .join("\n\n---\n\n");

    const doc = await vscode.workspace.openTextDocument({
      content: chatLog,
      language: "markdown"
    });

    await vscode.window.showTextDocument(doc);
  }

  public dispose(): void {
    ChatPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private getHtmlContent(extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atlas AI Chat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 12px 16px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h2 {
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 4px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 600;
      font-size: 12px;
    }

    .message.user .message-avatar {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .message.assistant .message-avatar {
      background-color: var(--vscode-editorInfo-foreground);
      color: var(--vscode-editor-background);
    }

    .message-content {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      line-height: 1.5;
    }

    .message.user .message-content {
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
    }

    .message.assistant .message-content {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
    }

    .message-content pre {
      margin: 8px 0;
      padding: 12px;
      background-color: var(--vscode-textCodeBlock-background);
      border-radius: 4px;
      overflow-x: auto;
    }

    .message-content code {
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
    }

    .typing-indicator {
      display: none;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .typing-indicator.show {
      display: flex;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--vscode-editorInfo-foreground);
      animation: bounce 1.4s infinite ease-in-out;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    .input-container {
      padding: 16px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 8px;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    #messageInput {
      width: 100%;
      padding: 10px 12px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      resize: none;
      min-height: 44px;
      max-height: 120px;
    }

    #messageInput:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    #sendButton {
      padding: 10px 20px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.2s;
    }

    #sendButton:hover:not(:disabled) {
      background-color: var(--vscode-button-hoverBackground);
    }

    #sendButton:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      padding: 12px;
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      color: var(--vscode-errorForeground);
      display: none;
    }

    .error-message.show {
      display: block;
      animation: fadeIn 0.3s ease-in;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 18px;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .empty-state p {
      font-size: 13px;
      max-width: 400px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🤖 AI Chat Assistant</h2>
    <div class="header-actions">
      <button class="btn btn-secondary" id="exportButton">Export</button>
      <button class="btn btn-secondary" id="clearButton">Clear</button>
    </div>
  </div>

  <div class="messages-container" id="messagesContainer">
    <div class="empty-state" id="emptyState">
      <div class="empty-state-icon">💬</div>
      <h3>Start a conversation</h3>
      <p>Ask anything! Connected to your configured AI model.</p>
    </div>
  </div>

  <div class="typing-indicator" id="typingIndicator">
    <div class="message-avatar" style="background-color: var(--vscode-editorInfo-foreground); color: var(--vscode-editor-background);">AI</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  </div>

  <div class="error-message" id="errorMessage"></div>

  <div class="input-container">
    <div class="input-wrapper">
      <textarea 
        id="messageInput" 
        placeholder="Type your message... (Shift+Enter for new line)"
        rows="1"
      ></textarea>
    </div>
    <button id="sendButton">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const clearButton = document.getElementById('clearButton');
    const exportButton = document.getElementById('exportButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const emptyState = document.getElementById('emptyState');

    let currentAssistantMessage = null;

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Send message on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendButton.addEventListener('click', sendMessage);
    clearButton.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearChat' });
    });
    exportButton.addEventListener('click', () => {
      vscode.postMessage({ type: 'exportChat' });
    });

    function sendMessage() {
      const content = messageInput.value.trim();
      if (!content) return;

      vscode.postMessage({
        type: 'sendMessage',
        content: content
      });

      messageInput.value = '';
      messageInput.style.height = 'auto';
      errorMessage.classList.remove('show');
    }

    function addMessage(role, content) {
      emptyState.style.display = 'none';
      
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${role}\`;
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = role === 'user' ? 'U' : 'AI';
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = content;
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(contentDiv);
      messagesContainer.appendChild(messageDiv);
      
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return contentDiv;
    }

    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'addMessage':
          addMessage(message.message.role, message.message.content);
          break;
          
        case 'showTyping':
          typingIndicator.classList.add('show');
          currentAssistantMessage = addMessage('assistant', '');
          break;
          
        case 'updateAssistantMessage':
          if (currentAssistantMessage) {
            currentAssistantMessage.textContent += message.content;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
          break;
          
        case 'hideTyping':
          typingIndicator.classList.remove('show');
          currentAssistantMessage = null;
          break;
          
        case 'clearMessages':
          messagesContainer.innerHTML = '';
          messagesContainer.appendChild(emptyState);
          emptyState.style.display = 'flex';
          currentAssistantMessage = null;
          break;
          
        case 'showError':
          errorMessage.textContent = '⚠️ ' + message.error;
          errorMessage.classList.add('show');
          setTimeout(() => errorMessage.classList.remove('show'), 5000);
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}
