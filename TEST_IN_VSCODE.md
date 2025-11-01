# 🧪 AI Chat Testing Guide - THIS VSCODE WINDOW

**Extension Status:** ✅ INSTALLED  
**Package:** atlas-pipeline-vscode-0.0.1.vsix  
**Ready to test:** NOW!

---

## 🚀 Step-by-Step Testing

### Step 1: Open Command Palette
```
Press: Ctrl+Shift+P (or Cmd+Shift+P on Mac)
Type: "Atlas"
```

You should see these commands:
- ✅ Atlas: Open AI Chat
- ✅ Atlas: Select AI Chat Provider
- ✅ Atlas: Ingest Media
- ✅ Atlas: Refresh Media Library
- ✅ Atlas: Open Clip
- ✅ Atlas: Analyse Clip

### Step 2: Test WITHOUT Configuration (LM Studio Default)

1. Run: `Atlas: Open AI Chat`
2. You should see: A chat panel on the right side with:
   - 💬 Header: "🤖 AI Chat Assistant"
   - Buttons: "Export" and "Clear"
   - Empty message area with instructions
   - Input field at bottom

3. Type a test message:
   ```
   Hello! Can you explain what VS Code extensions are?
   ```

4. **Expected Result:**
   - Message appears as "U" avatar (user)
   - Typing indicator shows (animated dots)
   - **ERROR EXPECTED:** "Failed to connect to LM Studio"
   - Error dismisses after 5 seconds

This is OK! We need to configure a provider.

---

## ⚙️ Step 3: Configure a Provider

### Option A: Test with OpenRouter (Recommended - No Local Setup)

1. **Get API Key:**
   - Go to [openrouter.ai](https://openrouter.ai)
   - Sign up (free account, add credits)
   - Get API key from Settings

2. **Configure in VS Code:**
   - Press `Ctrl+,` (Settings)
   - Search: `atlas.openRouterApiKey`
   - Paste your key
   - Search: `atlas.chatProvider`
   - Change to: `openrouter`

3. **Or use JSON settings:**
   - Press `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
   - Add:
   ```json
   {
     "atlas.chatProvider": "openrouter",
     "atlas.openRouterApiKey": "sk-or-your-key-here",
     "atlas.openRouterModel": "anthropic/claude-3.5-sonnet",
     "atlas.chatStreaming": true
   }
   ```

4. **Verify in Command Palette:**
   - Run: `Atlas: Select AI Chat Provider`
   - Choose: OpenRouter
   - You should see: "Chat provider set to: OpenRouter"

---

### Option B: Test with LM Studio (Local - More Setup)

1. **Install LM Studio:**
   - Download: [lmstudio.ai](https://lmstudio.ai)
   - Install and run

2. **Load a Model:**
   - Click "Search" in LM Studio
   - Download a model (e.g., "llama-3-8b")
   - Takes 5-10 minutes

3. **Start Server:**
   - In LM Studio: Click "Start Server"
   - Look for: "Server listening on http://localhost:1234"
   - Status should be green

4. **Configure in VS Code:**
   - Press `Ctrl+,` (Settings)
   - Search: `atlas.lmStudioEndpoint`
   - Verify: `http://localhost:1234/v1/chat/completions`
   - Search: `atlas.lmStudioModel`
   - Set to your model name (e.g., `llama-3-8b`)
   - Search: `atlas.chatProvider`
   - Verify: `lmstudio`

---

## 💬 Step 4: Test Chat

### With OpenRouter (Quick):

1. Open AI Chat again: `Ctrl+Shift+P` → `Atlas: Open AI Chat`
2. Type a message:
   ```
   Write a JavaScript function that reverses a string
   ```
3. **Expected:**
   - "Typing indicator" shows
   - Response streams in real-time, word by word
   - Code appears with proper formatting
   - Response completes and typing indicator disappears

### With LM Studio (After model loads):

Same process, but response will be slower (depends on your GPU/CPU)

---

## 🎮 Interactive Tests

### Test 1: Multi-line Messages
```
Message: Type your text
Then press: Shift+Enter for new line
Then more text
Then press: Enter to send
```
✅ Should send entire multi-line message

### Test 2: Export Chat
```
1. Have a conversation (multiple messages)
2. Click "Export" button
3. A Markdown file opens with chat history
4. Format should be: **USER**: message   **ASSISTANT**: response
```
✅ Should export properly formatted Markdown

### Test 3: Clear Chat
```
1. Have messages in chat
2. Click "Clear" button
3. Empty state should reappear
4. Chat history cleared
```
✅ Should reset to empty

### Test 4: Provider Switching
```
1. Atlas: Select AI Chat Provider
2. Choose different provider
3. In Output panel (View → Output → Atlas Pipeline)
4. Should log: "[Chat] Provider changed to: ..."
```
✅ Should switch providers

### Test 5: Error Handling
```
1. Configure wrong endpoint: "http://localhost:9999"
2. Try to send message
3. Should show error: "Failed to connect"
4. Error auto-dismisses after 5 seconds
```
✅ Should handle errors gracefully

---

## 📊 Testing Checklist

- [ ] Chat panel opens with `Atlas: Open AI Chat`
- [ ] UI looks good (blue for user, dark for AI)
- [ ] Typing indicator animates
- [ ] Messages stream in real-time
- [ ] Shift+Enter creates new line
- [ ] Enter sends message
- [ ] Export button creates Markdown file
- [ ] Clear button resets conversation
- [ ] Provider switching works
- [ ] Error messages display
- [ ] Output logs appear in Atlas Pipeline channel

---

## 🔍 Debugging

If something doesn't work:

1. **Check Output Log:**
   ```
   View → Output → Select "Atlas Pipeline"
   ```
   You'll see:
   - `[Chat] Sending to openrouter...`
   - `[Chat] Response completed: XXX chars`
   - Any errors

2. **Check Settings:**
   ```
   Ctrl+, → Search "atlas."
   ```
   Verify:
   - `chatProvider` is correct
   - API keys are set (for cloud providers)
   - Endpoints are correct

3. **Try Simple Message:**
   ```
   Start with: "Hello"
   Then: "What is 2+2?"
   These are easy for all models
   ```

4. **Check Provider Connection:**
   - **OpenRouter:** Need internet + valid API key
   - **LM Studio:** Need server running on localhost:1234
   - **Custom:** Need your endpoint URL

---

## 💡 Tips

1. **Start with OpenRouter** - easiest to test, no local setup
2. **Keep messages short** - for testing streaming
3. **Watch the typing indicator** - confirms it's working
4. **Check the Output panel** - see what's happening
5. **Try `Atlas: Select AI Chat Provider`** - easy way to switch

---

## ✨ Advanced: Custom Testing

**Test LM Studio responsiveness:**
```
Message: "Write a 500 word essay about AI"
Expected: Slow with local model, faster with OpenRouter
Shows: Streaming is working
```

**Test temperature differences:**
- Low (0.2): "What is 2+2?" - Always "4"
- High (1.5): "Tell me a story" - Different each time

```json
{
  "atlas.chatTemperature": 0.2
}
```

---

## 🎯 SUCCESS CRITERIA

You've successfully tested if:
- ✅ Chat opens without errors
- ✅ You can configure a provider
- ✅ Messages send and get responses
- ✅ Streaming shows real-time text
- ✅ UI is responsive and looks good
- ✅ Export creates valid Markdown
- ✅ Errors are handled gracefully

---

## 📞 If It Doesn't Work

**Most common issues:**

1. **"Cannot find LM Studio"**
   - Check: Is LM Studio actually running?
   - Solution: Start server in LM Studio app

2. **"OpenRouter API key not configured"**
   - Check: Did you paste the key?
   - Solution: Paste key and reload VS Code

3. **"Connection timeout"**
   - Check: Internet connection?
   - Solution: For OpenRouter, verify internet

4. **"Chat panel won't open"**
   - Solution: Reload VS Code window
   - `Ctrl+Shift+P` → "Developer: Reload Window"

---

**Ready? Let's go! Open Command Palette and run: `Atlas: Open AI Chat`** 🚀

