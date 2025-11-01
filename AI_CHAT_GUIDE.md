# AI Chat Feature - User Guide

## 🤖 Interactive AI Chat in VS Code

The Atlas Pipeline Toolkit now includes a built-in AI chat panel that connects to:
- **LM Studio** (local models)
- **OpenRouter** (cloud models)
- **Custom APIs** (any OpenAI-compatible endpoint)

---

## 🚀 Quick Start

### 1. Open AI Chat

Press `Ctrl+Shift+P` and run:
```
Atlas: Open AI Chat
```

Or use the command palette shortcut.

### 2. Configure Provider

Choose your AI provider:
```
Atlas: Select AI Chat Provider
```

**Options:**
- **LM Studio** - Run models locally (Llama, Mistral, etc.)
- **OpenRouter** - Access GPT-4, Claude, and other cloud models
- **Custom API** - Connect to your own endpoint

---

## ⚙️ Configuration

### LM Studio Setup (Local Models)

1. **Install LM Studio:** Download from [lmstudio.ai](https://lmstudio.ai)
2. **Load a model:** Download any model (e.g., Llama 3, Mistral 7B)
3. **Start server:** In LM Studio, click "Start Server" (default: port 1234)

4. **Configure extension:**
   - `atlas.chatProvider` → `lmstudio`
   - `atlas.lmStudioEndpoint` → `http://localhost:1234/v1/chat/completions`
   - `atlas.lmStudioModel` → `local-model` (or your model name)

**Settings (JSON):**
```json
{
  "atlas.chatProvider": "lmstudio",
  "atlas.lmStudioEndpoint": "http://localhost:1234/v1/chat/completions",
  "atlas.lmStudioModel": "llama-3-8b",
  "atlas.chatStreaming": true,
  "atlas.chatTemperature": 0.7,
  "atlas.chatMaxTokens": 2000
}
```

### OpenRouter Setup (Cloud Models)

1. **Get API key:** Sign up at [openrouter.ai](https://openrouter.ai)
2. **Configure extension:**
   - `atlas.chatProvider` → `openrouter`
   - `atlas.openRouterApiKey` → Your API key
   - `atlas.openRouterModel` → `anthropic/claude-3.5-sonnet`

**Settings (JSON):**
```json
{
  "atlas.chatProvider": "openrouter",
  "atlas.openRouterApiKey": "sk-or-...",
  "atlas.openRouterModel": "anthropic/claude-3.5-sonnet",
  "atlas.chatStreaming": true
}
```

**Available Models:**
- `anthropic/claude-3.5-sonnet` - Best for coding
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `openai/gpt-4` - GPT-4
- `meta-llama/llama-3-70b` - Llama 3 70B
- See [openrouter.ai/models](https://openrouter.ai/models) for full list

### Custom API Setup

For any OpenAI-compatible API:

```json
{
  "atlas.chatProvider": "custom",
  "atlas.customApiEndpoint": "https://your-api.com/v1/chat/completions",
  "atlas.customApiKey": "your-api-key",
  "atlas.customApiModel": "your-model-name"
}
```

---

## 💬 Using the Chat

### Send Messages

1. Type your question in the input field
2. Press `Enter` to send (or click "Send")
3. Use `Shift+Enter` for new lines
4. Responses stream in real-time

### Features

**Clear Chat:**
- Click "Clear" button to start fresh conversation
- Clears message history

**Export Chat:**
- Click "Export" button
- Opens chat log in new Markdown document
- Includes full conversation history

**Streaming Responses:**
- Words appear as they're generated (like ChatGPT)
- Provides immediate feedback
- Can be disabled: `"atlas.chatStreaming": false`

---

## 🎛️ Advanced Settings

### Temperature
Controls randomness (0 = deterministic, 2 = very creative):
```json
{
  "atlas.chatTemperature": 0.7
}
```

**Use cases:**
- `0.2` - Code generation, factual answers
- `0.7` - Balanced (default)
- `1.2` - Creative writing

### Max Tokens
Maximum length of responses:
```json
{
  "atlas.chatMaxTokens": 2000
}
```

- Lower values = shorter, faster responses
- Higher values = longer, more detailed responses
- Costs more with cloud providers

---

## 🔧 Troubleshooting

### LM Studio Issues

**Problem:** "Failed to connect to LM Studio"
- ✅ Check LM Studio server is running (green indicator)
- ✅ Verify port is 1234 (or update endpoint)
- ✅ Try: `http://127.0.0.1:1234/v1/chat/completions`

**Problem:** "Model not found"
- ✅ Load a model in LM Studio first
- ✅ Check model name matches setting

### OpenRouter Issues

**Problem:** "API key not configured"
- ✅ Set `atlas.openRouterApiKey` in settings
- ✅ Get key from [openrouter.ai](https://openrouter.ai)

**Problem:** "Insufficient credits"
- ✅ Add credits to your OpenRouter account
- ✅ Check balance at dashboard

### Custom API Issues

**Problem:** "Custom API endpoint not configured"
- ✅ Set `atlas.customApiEndpoint` in settings
- ✅ Ensure endpoint follows OpenAI format

**Problem:** "Authentication failed"
- ✅ Check `atlas.customApiKey` is correct
- ✅ Some APIs don't require keys (leave empty)

### General Issues

**Problem:** Slow responses
- ✅ Check internet connection (OpenRouter)
- ✅ Check LM Studio CPU/GPU usage
- ✅ Try smaller model or reduce max tokens

**Problem:** Responses cut off
- ✅ Increase `atlas.chatMaxTokens`
- ✅ LM Studio: check context length in server settings

---

## 🎯 Example Use Cases

### Code Assistance
```
User: How do I create a VS Code webview panel in TypeScript?
AI: [Provides detailed TypeScript example with vscode API]
```

### Debugging
```
User: Why is my fetch request returning CORS errors?
AI: [Explains CORS, provides solutions]
```

### Documentation
```
User: Explain this code: [paste code]
AI: [Provides line-by-line explanation]
```

### Refactoring
```
User: Refactor this function to use async/await
AI: [Provides refactored version]
```

---

## 📊 Provider Comparison

| Feature | LM Studio | OpenRouter | Custom API |
|---------|-----------|------------|------------|
| **Cost** | Free (local) | Pay per token | Varies |
| **Privacy** | 100% local | Cloud | Depends |
| **Speed** | Fast (local) | Variable | Depends |
| **Models** | Any local | 100+ cloud | Yours |
| **Setup** | Medium | Easy | Varies |
| **Internet** | Not required | Required | Depends |

---

## 🔐 Privacy & Security

### LM Studio (Local)
- ✅ All data stays on your machine
- ✅ No internet required
- ✅ Full privacy

### OpenRouter / Cloud
- ⚠️ Data sent to third-party servers
- ⚠️ Review provider privacy policies
- ⚠️ Don't share sensitive code/data

### Custom API
- Depends on your deployment
- Control your own data

---

## 🆘 Commands Reference

| Command | Description |
|---------|-------------|
| `Atlas: Open AI Chat` | Open the chat panel |
| `Atlas: Select AI Chat Provider` | Change provider (LM Studio/OpenRouter/Custom) |

---

## 💡 Tips

1. **Use streaming** for better UX (`atlas.chatStreaming: true`)
2. **Lower temperature** for code generation (0.2-0.3)
3. **Higher temperature** for creative tasks (1.0-1.5)
4. **LM Studio for privacy** - no data leaves your machine
5. **OpenRouter for variety** - access to latest models
6. **Export important chats** - save useful conversations

---

## 🚀 Next Steps

- Try different models to find what works best
- Experiment with temperature settings
- Export useful conversations for reference
- Use chat for code reviews, debugging, learning

---

**Need Help?** Check the Output panel (View → Output → Atlas Pipeline) for detailed logs.

**Feature Requests?** See our GitHub repository for contributing guidelines.
