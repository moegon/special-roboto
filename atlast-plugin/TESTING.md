# Atlas Pipeline Toolkit - Testing Guide

## ✅ Extension Installed Successfully!

The extension is now active in your VS Code instance.

---

## 🚀 Quick Test Steps

### 1. **Start Mock Server** ✅ (Already Running!)

The mock Atlas API server is running on `http://localhost:8080`

To restart it later:
```bash
cd mock-server
node server.js
```

### 2. **Configure Extension Settings**

1. Press `Ctrl+,` (Settings)
2. Search for "Atlas"
3. Set these values:
   - **Atlas: Api Base Url** → `http://localhost:8080`
   - **Atlas: Model Endpoint** → `http://localhost:8000/inference`

Or use Command Palette (`Ctrl+Shift+P`):
- Type: `Preferences: Open User Settings (JSON)`
- Add:
```json
{
  "atlas.apiBaseUrl": "http://localhost:8080",
  "atlas.modelEndpoint": "http://localhost:8000/inference"
}
```

### 3. **Open Atlas Activity Bar**

- Click the **Atlas icon** in the left sidebar (Activity Bar)
- You should see "ATLAS MEDIA LIBRARY" panel

### 4. **Test: Ingest Media**

1. **Command Palette** (`Ctrl+Shift+P`)
2. Type: `Atlas: Ingest Media`
3. Select a test image/video/audio file
4. Add tags (optional): `test, demo`
5. Add description (optional): `Testing ingestion`

**Expected Result:**
- Progress notification appears
- Success message: "Ingested 1 file(s) with Atlas"
- File appears in Media Library panel

### 5. **Test: View Clip**

1. In Media Library panel, click on an ingested clip
2. Or use Command Palette: `Atlas: Open Clip`

**Expected Result:**
- Webview panel opens showing clip details
- Displays name, status, tags, metadata

### 6. **Test: Analyse Clip**

1. Right-click a clip in Media Library
2. Select `Atlas: Analyse Clip`
3. Or use Command Palette

**Expected Result:**
- "Analysing..." notification
- Output channel shows analysis results
- Labels, scores, summary displayed

### 7. **Test: Refresh Library**

1. Command Palette: `Atlas: Refresh Media Library`

**Expected Result:**
- Library panel refreshes
- Shows all cached clips

---

## 🧪 Test Scenarios

### Scenario A: Offline Mode (No Server)

1. Stop mock server: `Ctrl+C` in terminal
2. Try ingesting media
3. **Expected:** File cached locally with "local-only" status

### Scenario B: Batch Ingestion

1. `Atlas: Ingest Media`
2. Select multiple files (Ctrl+Click)
3. Add tags for all
4. **Expected:** Progress for each file, all appear in library

### Scenario C: Different Media Types

Test with:
- **Image:** `.png`, `.jpg`
- **Video:** `.mp4`, `.mov`
- **Audio:** `.mp3`, `.wav`

### Scenario D: Error Handling

1. Set wrong API URL: `http://localhost:9999`
2. Try ingesting
3. **Expected:** Error message, falls back to local cache

---

## 🔍 Verification Checklist

- [ ] Extension appears in Extensions list (`Ctrl+Shift+X`)
- [ ] Atlas icon visible in Activity Bar
- [ ] Media Library panel opens
- [ ] Can ingest single file
- [ ] Can ingest multiple files
- [ ] Files appear in library after ingestion
- [ ] Can open clip preview
- [ ] Can analyse clip (mock response shown)
- [ ] Settings update correctly
- [ ] Offline mode caches files locally
- [ ] Error messages display appropriately

---

## 🎨 Test the Admin Console (Optional)

```bash
cd admin-console
npm install  # if not already done
npm run dev
```

Visit `http://localhost:5173` and:
1. Click Settings (gear icon)
2. Set API URL to `http://localhost:8080`
3. Browse clips in the UI
4. Test chat functionality

---

## 🐛 Debugging

### View Extension Logs

1. **Output Panel:** View → Output
2. Select "Atlas Pipeline" from dropdown

### Check for Errors

1. **Developer Tools:** Help → Toggle Developer Tools
2. Check Console tab for errors

### Reload Extension

- Command Palette: `Developer: Reload Window`

### Uninstall Extension

```bash
code --uninstall-extension atlas-toolkit.atlas-pipeline-vscode
```

Or via UI: Extensions → Atlas Pipeline Toolkit → Uninstall

---

## 📊 Mock Server Endpoints

The mock server provides these endpoints:

- `POST /ingest` - Upload media file
- `GET /clips` - List all clips
- `GET /clips/:id` - Get specific clip
- `POST /analyse` - Analyse a clip

### Test with curl

```bash
# List clips
curl http://localhost:8080/clips

# Get specific clip
curl http://localhost:8080/clips/clip-123
```

---

## 🎯 Production Testing

### Test with Real Atlas API

1. Update settings to point to actual Atlas deployment
2. Set `atlas.apiKey` if authentication required
3. Test with real multimedia files

### Performance Testing

1. Ingest 10+ files in batch
2. Check memory usage
3. Verify no lag in UI

### Error Recovery

1. Disconnect network during ingestion
2. Verify graceful fallback to cache
3. Reconnect and refresh

---

## 📝 Test Report Template

```
Date: ___________
VS Code Version: ___________
Extension Version: 0.0.1

Functionality Tested:
[ ] Media ingestion (single file)
[ ] Media ingestion (batch)
[ ] Clip preview
[ ] Clip analysis
[ ] Library refresh
[ ] Offline caching
[ ] Settings configuration
[ ] Error handling

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

## 🚀 Next Steps

After testing:

1. ✅ Fix any issues found
2. ✅ Update version in `package.json`
3. ✅ Document changes in `CHANGELOG.md`
4. ✅ Repackage: `vsce package`
5. ✅ Publish: `vsce publish`

---

**Mock Server Status:** 🟢 Running on http://localhost:8080  
**Extension Status:** 🟢 Installed and Active  
**Ready to Test:** ✅ YES

Happy Testing! 🎉
