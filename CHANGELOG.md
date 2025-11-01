# Changelog

## 0.1.0 (November 1, 2025)

### 🎉 New Features

**AI Chat Integration**
- Interactive AI chat panel with real-time streaming responses
- Support for multiple providers:
  - **LM Studio** - Run local models (Llama, Mistral, etc.)
  - **OpenRouter** - Access GPT-4, Claude, and 100+ cloud models
  - **Custom APIs** - Connect to any OpenAI-compatible endpoint
- Beautiful chat UI with typing indicators and animations
- Export conversations to Markdown
- Provider selection via quick pick menu

### ⚙️ Configuration

Added 11 new settings for AI chat:
- `atlas.chatProvider` - Select provider (lmstudio/openrouter/custom)
- `atlas.chatStreaming` - Enable/disable streaming responses
- `atlas.chatTemperature` - Control response creativity (0-2)
- `atlas.chatMaxTokens` - Set maximum response length
- `atlas.lmStudioEndpoint` - LM Studio API endpoint
- `atlas.lmStudioModel` - Local model name
- `atlas.openRouterApiKey` - OpenRouter API key
- `atlas.openRouterModel` - Cloud model selection
- `atlas.customApiEndpoint` - Custom API URL
- `atlas.customApiKey` - Custom API authentication
- `atlas.customApiModel` - Custom model name

### 📝 Commands

- `Atlas: Open AI Chat` - Launch interactive chat panel
- `Atlas: Select AI Chat Provider` - Switch between providers

### 📚 Documentation

- Added `AI_CHAT_GUIDE.md` - Comprehensive setup and usage guide
- Provider comparison and configuration examples
- Troubleshooting tips and best practices

### 🐛 Bug Fixes

- Fixed all floating promise errors in extension.ts
- Resolved ESLint warnings for unused parameters
- Improved error handling in chat client

### 📦 Package

- Bundle size: 42KB (was 29KB)
- Added 5 new files: aiChatClient.ts, chatPanel.ts

---

## 0.0.1 (Initial Release)

- Initial scaffolding of the Atlas Pipeline Toolkit VS Code extension.
- Media ingest command with offline caching fallback.
- Activity Bar media library tree view with clip preview webview.
- Command palette entries for refreshing, opening, and analysing clips.
- Hosted model integration stub that streams results to an output channel.
