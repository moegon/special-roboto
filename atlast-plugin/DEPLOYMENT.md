# Atlas Pipeline Toolkit - Deployment Guide

## 📦 Pre-Deployment Checklist

### 1. Version Bump
```bash
# Update version in package.json
npm version patch  # or minor/major
```

### 2. Build Verification
```bash
# Extension build
npm run compile

# Admin console build
cd admin-console
npm run build
```

### 3. Package the Extension
```bash
# Install vsce if not already available
npm install -g @vscode/vsce

# Package the extension
vsce package
# Creates: atlas-pipeline-vscode-0.0.1.vsix
```

## 🚀 Publishing Options

### Option A: VS Code Marketplace (Public)

**Prerequisites:**
- Microsoft account
- Azure DevOps organization
- Personal Access Token (PAT) with Marketplace (Publish) scope

**Steps:**
```bash
# Create publisher (one-time)
vsce create-publisher <publisher-name>

# Login
vsce login <publisher-name>

# Update package.json publisher field
# "publisher": "your-actual-publisher-name"

# Publish
vsce publish
```

**Documentation:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension

### Option B: Private Distribution

**Manual Installation:**
```bash
# Share the .vsix file
code --install-extension atlas-pipeline-vscode-0.0.1.vsix
```

**Internal Marketplace:**
- Upload to Azure DevOps private gallery
- Or host on company artifact repository

### Option C: Open VSX Registry (Alternative)

```bash
# Install ovsx
npm install -g ovsx

# Get access token from https://open-vsx.org/user-settings/tokens
ovsx publish atlas-pipeline-vscode-0.0.1.vsix -p <token>
```

## 🌐 Admin Console Deployment

### Production Build
```bash
cd admin-console
npm run build
# Output: admin-console/dist/
```

### Deployment Targets

**Static Hosting (Netlify, Vercel, GitHub Pages):**
```bash
# Deploy dist/ folder to:
# - Netlify: drag-and-drop or CLI
# - Vercel: vercel --prod
# - GitHub Pages: copy to gh-pages branch
```

**Docker:**
```dockerfile
# Create admin-console/Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t atlas-admin-console .
docker run -p 8080:80 atlas-admin-console
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

## 🔧 Configuration Management

### Extension Settings
Users configure in VS Code settings:
- `atlas.apiBaseUrl` - Atlas API endpoint
- `atlas.apiKey` - Authentication token
- `atlas.modelEndpoint` - ML model inference URL

### Admin Console Settings
Stored in browser localStorage:
- API base URL
- Model endpoints
- UI preferences

**Production Config:**
- Create `.env.production` in `admin-console/`
- Set `VITE_ATLAS_API_URL` environment variable
- Build with: `npm run build`

## 📋 Release Process

### 1. Pre-Release
```bash
# Run linter
npm run lint

# Fix ESLint config if needed (see KNOWN_ISSUES.md)

# Create changelog entry
# Update CHANGELOG.md with version changes
```

### 2. Tag Release
```bash
git tag -a v0.0.1 -m "Initial release"
git push origin v0.0.1
```

### 3. Create GitHub Release
- Go to repository releases
- Create new release from tag
- Upload `.vsix` file as asset
- Include changelog

### 4. Announce
- Update README with marketplace badge
- Notify users via email/Slack
- Post on relevant forums

## 🔐 Security Considerations

- **Never commit** API keys or tokens
- Use environment variables for sensitive config
- Enable HTTPS for admin console in production
- Implement rate limiting on API endpoints
- Regular dependency audits: `npm audit`

## 📊 Monitoring

### Extension Telemetry (Optional)
- Add Application Insights SDK
- Track command usage
- Monitor error rates

### Admin Console Analytics
- Google Analytics 4
- Plausible Analytics (privacy-friendly)
- Self-hosted Matomo

## 🆘 Rollback Procedure

### Extension
```bash
# Users can downgrade via:
code --install-extension atlas-pipeline-vscode-0.0.0.vsix

# Or unpublish from marketplace
vsce unpublish <publisher>.<extension>
```

### Admin Console
```bash
# Revert to previous deployment
git checkout v0.0.0
cd admin-console
npm run build
# Re-deploy dist/
```

## 📚 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Query Production](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

---

**Last Updated:** November 1, 2025  
**Extension Version:** 0.0.1  
**Admin Console Version:** 0.0.1
