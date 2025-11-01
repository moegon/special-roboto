# Known Issues & Fixes

## ESLint Configuration Error

**Issue:** ESLint fails with parser services error when running `npx eslint src`

```
Error: Error while loading rule '@typescript-eslint/no-floating-promises': 
You have used a rule which requires parserServices to be generated. 
You must therefore provide a value for the "parserOptions.project" property
```

**Root Cause:** The flat config (`eslint.config.cjs`) doesn't specify `parserOptions.project` for TypeScript rules that need type information.

**Fix:** Update `eslint.config.cjs`:

```javascript
// eslint.config.cjs
const tseslint = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      // ... other rules
    },
  },
];
```

---

## TypeScript Version Mismatch

**Issue:** Warning about unsupported TypeScript version

```
WARNING: You are currently running a version of TypeScript which is not 
officially supported by @typescript-eslint/typescript-estree.

SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0
YOUR TYPESCRIPT VERSION: 5.9.3
```

**Impact:** Minor - extension works fine, but ESLint may have edge case bugs

**Fix Options:**

1. **Downgrade TypeScript (Safest):**
```bash
npm install --save-dev typescript@5.5.4
```

2. **Upgrade @typescript-eslint (When available):**
```bash
npm install --save-dev @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest
```

3. **Ignore (Current approach):** Continue with 5.9.3, report issues to @typescript-eslint if found

---

## Missing Icon in package.json

**Issue:** VS Code extension validation warning

```
Missing property "icon" for viewsContainer "atlasToolkit"
```

**Impact:** Extension works, but no custom icon appears in Activity Bar

**Fix:** 

1. Create icon file: `media/atlas-icon.svg` (or .png)
2. Update `package.json`:

```json
{
  "icon": "media/atlas-icon.png",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "atlasToolkit",
          "title": "Atlas",
          "icon": "media/atlas-icon.svg"
        }
      ]
    }
  }
}
```

**Icon Requirements:**
- SVG (scalable) or PNG (128x128px minimum)
- Light on transparent background for dark themes
- Simple, recognizable design

---

## No Test Suite

**Issue:** `npm run test` defined but no tests exist

**Impact:** No automated quality checks before deployment

**Recommendation:** Add basic test scaffolding

```bash
npm install --save-dev @vscode/test-electron mocha @types/mocha
```

Create `src/test/suite/extension.test.ts`:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension loads', async () => {
    const ext = vscode.extensions.getExtension('your-name-here.atlas-pipeline-vscode');
    assert.ok(ext);
  });

  test('Commands registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('atlas.ingestMedia'));
    assert.ok(commands.includes('atlas.refreshLibrary'));
  });
});
```

---

## Admin Console Mock Server Dependency

**Issue:** Development requires separate mock server process

**Current Workflow:**
```bash
# Terminal 1
cd mock-server
npm install
node server.js

# Terminal 2
cd admin-console
npm run dev
```

**Enhancement:** Add concurrent script to `package.json`:

```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev:mock\" \"npm run dev:ui\"",
    "dev:mock": "cd mock-server && node server.js",
    "dev:ui": "cd admin-console && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

---

## Cache Persistence

**Issue:** Extension uses `Memento` (ephemeral storage) for clip cache

**Impact:** Cached clips lost when VS Code restarts

**Current Implementation:**
```typescript
const CLIP_CACHE_KEY = "atlas.cachedClips";
// Uses context.workspaceState (workspace-specific, session-scoped)
```

**Enhancement:** Consider `globalState` or file-based persistence

```typescript
// Option 1: Global state (persists across sessions)
this.store.update(CLIP_CACHE_KEY, clips);

// Option 2: File storage
const cacheFile = vscode.Uri.joinPath(context.globalStorageUri, 'clips.json');
await vscode.workspace.fs.writeFile(cacheFile, Buffer.from(JSON.stringify(clips)));
```

---

## Missing CORS Headers for Local Development

**Issue:** Admin console may fail to connect to local extension API

**Symptom:** Browser console shows CORS errors

**Fix (mock-server/server.js):**

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

---

## Workspace State vs Global State

**Current:** Extension uses `workspaceState` for caching

**Implication:** Different workspaces have separate caches

**Decision Point:**
- Keep workspace-isolated (current) ✅ for project-specific media
- Or use `globalState` for shared cache across all projects

---

Last Updated: November 1, 2025
