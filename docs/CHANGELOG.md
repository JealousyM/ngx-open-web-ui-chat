# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.10] - 2025-11-22

### Added

- 📤 **Chat Export** - Export full conversation history
  - **Multiple Formats** - Support for PDF, TXT, and JSON exports
  - **PDF Export** - Generates formatted PDF with markdown rendering
  - **TXT Export** - Plain text format with role labels
  - **JSON Export** - Raw data export for backup/portability
  - **Context Menu Integration** - Accessible via right-click on chat history item
- 🛡️ **Active Chat Protection** - Prevent accidental deletion
  - **Disabled Delete Button** - "Delete Chat" is disabled for the currently active chat
  - **Visual Feedback** - Disabled state styling (grayed out, no hover effect)
  - **Tooltip** - Explanatory tooltip "Cannot delete active chat"
- 🌍 **Localization Updates**
  - Added missing Russian translations for sidebar sections ("Pinned", "All Chats")
  - Added translations for export formats and delete protection messages

### Fixed

- 🐛 **Chat List Updates** - Fixed issue where new chats wouldn't appear immediately in the sidebar
- 🐛 **Markdown Rendering** - Fixed indentation for lists and block elements in chat messages
- 🐛 **Search Preview** - Fixed TypeScript error in search result preview generation
- 🐛 **Modal Dimensions** - Fixed search modal size to be consistent (900x600px)
- 🐛 **Sidebar Localization** - Fixed missing translation keys for sidebar headers

### Technical Details
- Added `isActive` input to `ChatContextMenuComponent`
- Implemented `jspdf` integration for client-side PDF generation
- Improved `createNewChat` logic to manually update local state
- Added global SCSS styles for markdown list indentation
- Updated `chat-search-modal` styles for fixed dimensions

## [1.0.9] - 2025-11-20

### Added

- 🎤 **Voice Input** - Record audio messages with automatic transcription
  - **Voice Recording Button** - Microphone icon button near send button
  - **Real-time Spectrogram** - Visual frequency visualization during recording
  - **Stop Recording** - Dedicated stop button replaces voice button during recording
  - **Audio Transcription** - Automatic conversion of audio to text via OpenWebUI API
  - **Editable Transcription** - Review and edit transcribed text before sending
  - **Error Handling** - Comprehensive error messages for:
    - Browser not supporting audio recording
    - Microphone permission denied
    - Recording failures
    - Transcription API failures
  - **Retry Mechanism** - Retry button for failed transcriptions
  - **Audio Cleanup** - Automatic microphone release and resource cleanup
- 🌍 **Voice Input Translations** - Multi-language support for voice features
  - Added `retry`, `dismiss`, `transcribing` translation keys
  - Translations for all 10 supported languages: English, Chinese, Hindi, Spanish, Arabic, French, Portuguese, Russian, Bengali, Japanese
- 🎨 **Voice Input Styling** - Consistent UI design
  - Microphone button with hover states
  - Stop button with distinct red styling
  - Spectrogram canvas with visual separation
  - Error message banners with dismiss/retry buttons
- 🔧 **AudioRecorder Utility** - Web Audio API integration
  - MediaRecorder API for audio capture
  - AudioContext and AnalyserNode for frequency analysis
  - WebM format with Opus codec
  - 48kHz sample rate

### Technical Details
- Added `isRecording`, `recordingError`, `isTranscribing`, `transcriptionError` signals
- Added `AudioRecorder` utility class for managing Web Audio API
- Added `transcribeAudio()` method to OpenWebUIService
- Integrated with `/api/v1/audio/transcriptions` endpoint
- Real-time spectrogram rendering using canvas 2D context and requestAnimationFrame
- Proper audio context initialization and cleanup
- Browser compatibility checks for getUserMedia support

## [1.0.7] - 2025-11-18

### Added

- ⭐ **Response Interaction Controls** - Interactive action buttons for every assistant message
  - **Continue Response** - Extend incomplete or truncated responses
  - **Regenerate Response** - Generate alternative responses with multiple options:
    - Custom input with text field
    - Try Again (resend previous prompt)
    - More Concise
    - Add Details
  - Action buttons visibility:
    - Latest message: Always visible
    - Previous messages: Visible on hover
- 👍 **Comprehensive Rating System** - Detailed feedback mechanism for responses
  - **Good Rating (👍)** with 7 positive feedback tags:
    - Accurate information
    - Followed instructions perfectly
    - Showcased creativity
    - Positive attitude
    - Attention to detail
    - Thorough explanation
    - Other
  - **Bad Rating (👎)** with 8 negative feedback tags:
    - Don't like the style
    - Too verbose
    - Not helpful
    - Not factually correct
    - Didn't fully follow instructions
    - Refused when it shouldn't have
    - Being lazy
    - Other
  - **Detailed Rating Scale** - 1-10 numeric rating with tags and comments
  - **Rating Pre-population** - Edit existing ratings by clicking rating button again
  - **Confirmation Message** - "Thank you for your feedback" appears after submission
  - **Auto-dismiss** - Confirmation message disappears after 3 seconds
  - **Persistence** - Ratings saved to OpenWebUI server with full context
- 🌍 **Multi-language Rating Support** - All rating features translated to 10 languages
  - Added `ratingTagDontLikeStyle`, `ratingTagTooVerbose`, `ratingTagNotHelpful`, `ratingTagNotFactual`, `ratingTagDidntFollow`, `ratingTagRefused`, `ratingTagLazy`, `ratingFeedbackThankYou` translation keys
  - Translations for: English, Chinese, Hindi, Spanish, Arabic, French, Portuguese, Russian, Bengali, Japanese

### Changed
- Rating form now displays different tag options based on rating type (good vs bad)
- Rating form pre-populates with existing data when editing ratings
- Enhanced rating API integration with comment field persistence

### Technical Details
- Added `showRatingConfirmation` signal for confirmation message display
- Added `ratingConfirmationTimeout` for auto-dismiss functionality
- Enhanced `openRatingForm()` to check for existing ratings and pre-populate form
- Updated `updateRating()` service method to include comment in API payload
- Updated `updateChatSessionWithRating()` to save comment to chat session annotation
- Added rating confirmation styling with slide-down animation
- Rating form component now conditionally displays tags based on `initialRating` input

## [1.0.4] - 2025-11-11

### Added

- 🔧 **Chat History Persistence** - Conversations now properly saved to OpenWebUI server
  - Fixed `/api/v1/chats/{chatId}` payload structure with `chat` wrapper
  - Correct message relationships with `parentId` and `childrenIds`
  - Proper message deduplication to prevent duplicates
- 🔧 **Completion Finalization** - Proper integration with `/api/chat/completed` endpoint
  - Added `session_id` to completion payload
  - Sends full `messages` array instead of single `message`
  - Includes `model_item` with complete model metadata
- 🔧 **API Call Flow** - Correct sequence of operations:
  1. Update chat with user message (`/api/v1/chats/{chatId}`)
  2. Send completion request (`/api/chat/completions`)
  3. Receive streaming response via Socket.IO
  4. Update chat with assistant message (`/api/v1/chats/{chatId}`)
  5. Finalize completion (`/api/chat/completed`)
- 🔧 **Duplicate Prevention** - Fixed duplicate API calls
  - Added `isCompletionFinalized` flag to prevent multiple finalization calls
  - Proper handling of multiple Socket.IO events with `finish_reason: "stop"`
  - Unique message filtering by ID
- 🔧 **Streaming Logic** - Improved completion detection
  - Only finalize when `finish_reason: "stop"` AND content exists
  - Prevents premature completion on empty finish signals
  - Proper handling of content-first, finish-later event order
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
- Added `isCompletionFinalized` flag to prevent duplicate calls
- Improved `updateChatSession()` with message deduplication
- Enhanced `sendCompletionFinalization()` with full message context
- Fixed `handleCompletionEvent()` to handle finish signals correctly
- Added `updateChatBeforeCompletion()` to save user message before API call
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

- **1.0.9** - Voice input with automatic transcription
- **1.0.7** - Response interaction controls (continue, regenerate, rate) and comprehensive rating system
- **1.0.4** - Stop generation feature, upload files, chat history persistence and completion finalization fixes
- **1.0.3** - Package entry points fix
- **1.0.2** - NPM distribution fix
- **1.0.1** - Initial release

## Migration Guides

### Upgrading to 1.0.9

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Voice input button automatically appears near the send button
- Click to record, see real-time spectrogram, and get automatic transcription
- All features work out of the box with no configuration needed
- Requires HTTPS for microphone access (browser security requirement)

**Browser Requirements:**
- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- Microphone permission must be granted by user
- HTTPS connection (required for `getUserMedia` API)

**No code changes required** - voice input is automatically available.

### Upgrading to 1.0.7

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Response action buttons automatically appear on all assistant messages
- Rating system is fully integrated and ready to use
- All features work out of the box with no configuration needed

**No code changes required** - all new features are automatically available.

### Upgrading to 1.0.4

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's improved:**

**No code changes required** - all improvements are internal to the library.

### Upgrading to 1.0.4

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

New features are automatically available:
- Stop button appears during generation
- Call `stopGeneration()` programmatically if needed
- Chat history now persists correctly on OpenWebUI server
- Conversations are properly saved and can be viewed in OpenWebUI interface
- No duplicate API calls or messages
- Proper completion finalization with title generation and metadata

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


