# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-10-24

### Added
- ⏹️ **Stop Generation** - Users can now stop AI response generation at any time
  - Stop button replaces send button during generation
  - Dual stop: AbortController (client) + API call (server)
  - Uses `/api/tasks/chat/{chat_id}` to get running tasks
  - Uses `/api/tasks/stop/{task_id}` to stop server task
  - Saves partial response as a complete message
  - Red stop button with hover effect
- Multi-language support for stop button (10 languages)
- `stopGeneration()` async method in component and service

### Changed
- UI dynamically switches between Send and Stop buttons based on loading state
- Updated API documentation with `stopGeneration()` method
- Updated README with stop generation feature

### Technical Details
- Added `abortController` and `currentChatId` to service
- Two-step stop: client (AbortController) + server (API)
- API integration: GET `/api/tasks/chat/{chat_id}` and POST `/api/tasks/stop/{task_id}`
- Added `stop` translation key to all language files
- Added `.stop-button` CSS class with red styling (#dc3545)

## [1.0.3] - 2025-10-24

### Fixed
- Corrected package.json entry points for proper NPM distribution
- Removed incorrect `main` and `types` fields from source package.json
- ng-packagr now properly generates correct module paths

### Added
- Troubleshooting documentation
- Installation guide with common issues

## [1.0.2] - 2025-10-24

### Fixed
- Package entry points for proper module resolution
- NPM installation issues

### Changed
- Version bump to fix distribution

## [1.0.1] - 2025-10-24

### Added
- Initial public release
- Conversation history support
- Markdown rendering with ngx-markdown
- Angular 2025 architecture (zoneless, signals)
- Streaming responses
- Multi-language UI (10 languages)
- SCSS styling
- Full TypeScript support

### Features
- Real-time chat with OpenWebUI
- Automatic conversation context management
- Mobile-responsive design
- Customizable styling
- Debug mode
- Event emitters for chat lifecycle

---

## Version History

- **1.0.4** - Stop generation feature
- **1.0.3** - Package entry points fix
- **1.0.2** - NPM distribution fix
- **1.0.1** - Initial release

## Migration Guides

### Upgrading to 1.0.4

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

New features are automatically available:
- Stop button appears during generation
- Call `stopGeneration()` programmatically if needed

### Upgrading from 1.0.1/1.0.2 to 1.0.3+

If you experienced "Cannot find module" errors:

```bash
npm uninstall ngx-open-web-ui-chat
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm install ngx-open-web-ui-chat@latest
```

## Links

- [NPM Package](https://www.npmjs.com/package/ngx-open-web-ui-chat)
- [GitHub Repository](https://github.com/JealousyM/ngx-open-web-ui-chat)
- [Live Demo](https://jealousym.github.io/ngx-open-web-ui-chat/)
- [API Documentation](API.md)

---

**Maintained by:** Mikhail Perevertkin  
**License:** MIT


