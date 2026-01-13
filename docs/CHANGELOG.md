# Changelog

All notable changes to the ngx-open-web-ui-chat project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2025-01-13

### Added

- 🌐 **Web Page Attachment Feature** - Process and attach web page content to messages
  - **Attach Web Page Menu** - New "Attach Web Page" option in the "+" dropdown menu
  - **Web Page Processing** - Uses `/api/v1/retrieval/process/web` endpoint to extract content
  - **Modal Interface** - Clean dialog for entering web page URLs
  - **Visual Indicator** - Attached web pages appear as badges in the input area
  - **Error Handling** - Comprehensive validation and error messaging
  - **API Integration** - Seamless integration with OpenWebUI web processing API
- 🎛️ **Feature Toggle Property** - `showAttachWebPage` input to conditionally display the feature
  - Enable/disable web page attachment functionality
  - Granular control over advanced features
  - Default: `false` (opt-in)
- 🌍 **Complete Translation Support**
  - Added `attachWebPage`, `attachWebPageTitle`, `attachWebPageDescription` translation keys
  - Added `webPageUrlLabel`, `webPageUrlPlaceholder`, `processing` translation keys
  - Translations for all 10 supported languages: English, Chinese, Hindi, Spanish, Arabic, French, Portuguese, Russian, Bengali, Japanese
- 📁 **New Component** - `AttachWebpageModalComponent` for web page attachment workflow
  - Standalone modal with form validation
  - URL validation and error handling
  - Loading states and user feedback
  - Clean SCSS styling with responsive design

### Technical Details
- Added `processWebPage()` method to `OpenWebUIService` with proper API integration
- Extended `ChatInputComponent` with web page attachment state management signals
- Added `webpageAttached` EventEmitter for web page selection changes
- Updated `sendMessage()` to include attached web page content in request payload
- Added URL validation utilities and error handling
- Created dedicated modal component with HTML/SCSS/TS separation
- Implemented proper cleanup and state management

## [1.1.0] - 2025-12-28

### Changed

- 📚 **Documentation Overhaul** - Comprehensive update of all documentation files
  - Improved README structure and clarity
  - Enhanced API documentation with better examples
  - Updated feature descriptions and usage guides
  - Added more detailed troubleshooting information
  - Refreshed screenshots and visual guides
- 🎨 **UI/UX Improvements** - Enhanced user interface and experience
  - Better visual feedback for user actions
  - Improved loading states and transitions
  - Enhanced error messages and handling
- 🐛 **Bug Fixes** - Various stability improvements
  - Fixed edge cases in chat history management
  - Improved file upload error handling
  - Enhanced Socket.IO reconnection logic

### Technical Details
- Updated all README files with current feature set
- Improved code examples and usage patterns
- Enhanced inline documentation and comments
- Updated dependencies to latest stable versions


## [1.0.18] - 2025-12-24

### Added

- 📝 **Reference Notes Support** - Reference notes in new messages
  - **Reference Note Menu** - New "Reference Note" option in the "+" dropdown menu
  - **Note Selection** - Browse and select from existing notes to reference
  - **Visual Indicator** - Referenced notes appear as badges in the input area
  - **API Integration** - Referenced note IDs included in completion requests
  - **Prefetch Optimization** - Notes list loaded on menu open for faster display
- 🌍 **Reference Note Translations**
  - Added `referenceNote`, `selectReferenceNote`, `noNotesAvailable` translation keys
  - Translations for all 10 supported languages

### Technical Details
- Added `ReferenceNoteFile` interface to chat.model.ts
- Added `referenceNoteSelected` EventEmitter for note selection changes
- Added `showReferenceNotes` input to enable/disable the feature
- Extended ChatInputComponent with reference note state management signals
- Updated `sendMessage` to include referenced notes in request payload

## [1.0.17] - 2025-12-22

### Added

- 💬 **Reference Chat Support** - Reference previous conversations in new messages
  - **Reference Chat Menu** - New "Reference Chat" option in the "+" dropdown menu
  - **Chat Selection** - Browse and select from existing chats to reference
  - **Visual Indicator** - Referenced chats appear as badges in the input area
  - **Pagination** - Load more chats with infinite scroll in selection menu
  - **API Integration** - Referenced chat IDs included in completion requests
  - **Prefetch Optimization** - Chats list loaded on menu open for faster display
- 🌍 **Reference Chat Translations**
  - Added `referenceChat`, `selectReferenceChat`, `noChatsAvailable` translation keys
  - Translations for all 10 supported languages

### Technical Details
- Added `ReferenceChatFile` interface to chat.model.ts
- Added `getChatsForReference()` method to OpenWebUIService
- Extended ChatInputComponent with reference chat state management signals
- Added `referenceChatSelected` EventEmitter for chat selection changes
- Added `showReferenceChats` input to enable/disable the feature
- Updated `sendMessage` to include referenced chats in request payload

## [1.0.16] - 2025-12-17

### Added

- 🛠️ **Tools Support** - Access and enable server-side tools from Open WebUI API
  - **Tools Menu** - New "Tools" option in the "+" dropdown menu
  - **Tool Selection** - Select/deselect tools with visual checkmarks
  - **Tool Indicator** - Visual badge showing enabled tools in input area
  - **API Integration** - Fetches available tools from `/api/v1/tools/` endpoint
  - **Completion Request** - Selected tool IDs included in `tool_ids` array
  - **Prefetch Optimization** - Tools list prefetched on component init for faster display
- 🌍 **Tools Translations**
  - Added `tools`, `noToolsAvailable`, `toolsEnabled`, `loadingTools`, `toolsError` translation keys
  - Translations for all 10 supported languages

### Technical Details
- Added `ToolItem` and `ToolSpec` interfaces to chat.model.ts
- Added `getTools()` method to OpenWebUIService
- Extended ChatInputComponent with tools state management signals
- Added `toolsChanged` EventEmitter for tool selection changes
- Updated `sendMessage` to include `tool_ids` in completion request payload

## [1.0.15] - 2025-12-10

### Added

- 🔌 **Integrations Support** - Toggle external capabilities
  - **Web Search** - Enable/disable web search capabilities
  - **Code Interpreter** - Enable/disable code execution
  - **Integrations Menu** - Dedicated menu in chat input to manage active integrations
  - **UI Integration** - Visual indicators for active integrations
- 🌍 **Integrations Translations**
## [1.0.14] - 2025-12-05

### Added

- 🗃️ **Archived Chats Modal** - View and manage archived conversations
  - **View Archived Chats** - Dedicated modal to access all archived chats
  - **Search Archived** - Search through archived chats with debounced query
  - **Unarchive Chats** - Restore archived chats to main chat list
  - **Delete Archived** - Permanently delete archived chats with confirmation
  - **Pagination** - Load more archived chats with infinite scroll
  - **Keyboard Navigation** - Focus trap and ESC to close
  - **Multi-language** - Full translation support for archived chat interface
- 🌍 **Expanded Translations**
  - Added `archivedChats` translation key to all 10 supported languages

### Fixed

- 🐛 **Archived Chats Search** - Fixed search functionality in archived chats modal
- 🐛 **List Refresh** - Fixed archived chats list not refreshing after unarchive

### Technical Details
- Added `ArchivedChatsModalComponent` with WCAG accessibility features
- Added `getArchivedChats()` API method with search and pagination
- Implemented debounced search with RxJS Subject
- Added focus trap and keyboard navigation for modal accessibility

## [1.0.13] - 2025-11-30

### Added

- 📝 **Notes Support** - Integrated markdown note editor
  - **Markdown Editor** - Rich text editing with preview mode
  - **Formatting Toolbar** - GitHub-like toolbar for bold, italic, lists, code, etc.
  - **Sidebar Integration** - Dedicated notes sidebar with search and management
  - **Auto-save** - Notes are automatically saved
  - **Multi-language** - Full translation support for note interface
- 🌍 **Expanded Translations**
  - Added missing translations for Folders and Notes in all supported languages
  - Improved parity across English, Chinese, Hindi, Spanish, Arabic, French, Portuguese, Russian, Bengali, and Japanese

### Fixed

- 🐛 **Build Issues** - Resolved SCSS compilation errors in note editor
- 🐛 **Translations** - Fixed missing keys in non-English languages

## [1.0.12] - 2025-11-28

### Added

- 📂 **Folder Support** - Organize chats into folders
  - **Create Folders** - Create new folders to group related conversations
  - **Drag & Drop** - Drag chats into folders and reorder them
  - **Context Menu** - Right-click on folders to rename or delete
  - **Nested Organization** - Keep your workspace clean and structured
- 🖱️ **Drag & Drop Improvements**
  - **Visual Feedback** - Clear indicators when dragging items
  - **Smooth Animations** - Better user experience during reordering

### Fixed

- 🐛 **Drag & Drop** - Fixed issues with drop targets and list updates
- 🐛 **Chat Move** - Fixed bug where moved chats wouldn't appear immediately
- 🐛 **Subfolder Creation** - Fixed issue with creating subfolders

## [1.0.11] - 2025-11-24

### Added

- 💬 **Ask & Explain Feature** - Interactive context menu for selected text
  - **Text Selection Menu** - Right-click on selected text to open context menu
  - **Ask Option** - Ask custom questions about selected text
  - **Explain Option** - Get instant AI explanations of selected content
  - **Modal Interface** - Beautiful modal for displaying AI responses
  - **Ephemeral Completions** - Responses don't persist in chat history
  - **Streaming Responses** - Real-time AI responses with loading indicators
  - **Markdown Rendering** - Formatted responses with syntax highlighting
- 🌍 **Translation Support** - Ask/Explain UI fully localized
  - Added `ask`, `explain`, `askQuestion`, `askPlaceholder` translation keys
  - Translations for all 10 supported languages
  - Localized prompts sent to AI based on active language
- 📝 **Component Architecture** - Modular design
  - `TextSelectionMenuComponent` - Contextual menu display
  - `AskExplainModalComponent` - Modal for questions and responses
  - Separate HTML, SCSS, and TypeScript files for maintainability
- ✅ **Unit Tests** - Full test coverage
  - `TextSelectionMenuComponent.spec.ts` - Menu interaction tests
  - `AskExplainModalComponent.spec.ts` - Modal functionality tests

### Changed
- Updated modal styling with fixed height (600px) and proper padding
- Enhanced context menu positioning logic
- Improved response display with auto-scroll to bottom

### Technical Details
- Added `generateEphemeralCompletion()` to OpenWebUIService
- Implemented `handleContextMenu()` event listener
- Created reusable modal component with dual modes (ask/explain)
- Context menu closes on outside click
- Proper cleanup and state management

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

- **1.2.0** - Web page attachment feature with API integration and conditional display
- **1.0.18** - Reference Notes support for referencing notes in messages
- **1.0.17** - Reference Chat support for referencing previous conversations
- **1.0.16** - Tools support with API integration and selection menu
- **1.0.15** - Integrations support (web search, code interpreter)
- **1.0.14** - Archived chats modal with search, unarchive, and delete functionality
- **1.0.13** - Notes support with integrated markdown editor
- **1.0.12** - Folder support with drag & drop organization
- **1.0.11** - Ask & Explain feature with context menu for selected text
- **1.0.10** - Chat export (PDF/TXT/JSON) and active chat protection
- **1.0.9** - Voice input with automatic transcription
- **1.0.7** - Response interaction controls (continue, regenerate, rate) and comprehensive rating system
- **1.0.4** - Stop generation feature, upload files, chat history persistence and completion finalization fixes
- **1.0.3** - Package entry points fix
- **1.0.2** - NPM distribution fix
- **1.0.1** - Initial release

## Migration Guides

### Upgrading to 1.2.0

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Web page attachment menu automatically appears in the "+" dropdown when `[showAttachWebPage]="true"`
- Enter web page URLs to process and attach content to your messages
- Attached web pages appear as badges in the input area
- All features work out of the box with no configuration needed

**To enable web page attachment:**
```typescript
<openwebui-chat
  [showAttachWebPage]="true"
  ...>
</openwebui-chat>
```

**Requirements:**
- OpenWebUI server with `/api/v1/retrieval/process/web` endpoint available
- Valid web page URLs (HTTP/HTTPS)

**No code changes required** - web page attachment functionality is automatically available when enabled.



### Upgrading to 1.0.18

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Reference Note menu automatically appears in the "+" dropdown when `[showReferenceNotes]="true"`
- Select notes to reference them in your messages
- Referenced notes appear as badges in the input area
- All features work out of the box with no configuration needed

**To enable reference notes:**
```typescript
<openwebui-chat
  [showReferenceNotes]="true"
  ...>
</openwebui-chat>
```

**No code changes required** - reference note functionality is automatically available when enabled.

### Upgrading to 1.0.17

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Reference Chat menu automatically appears in the "+" dropdown when `[showReferenceChats]="true"`
- Select previous chats to reference them in your messages
- Referenced chats appear as badges in the input area
- All features work out of the box with no configuration needed

**To enable reference chats:**
```typescript
<openwebui-chat
  [showReferenceChats]="true"
  ...>
</openwebui-chat>
```

**No code changes required** - reference chat functionality is automatically available when enabled.

### Upgrading to 1.0.16

No breaking changes. Simply update:

```bash
npm update ngx-open-web-ui-chat
```

**What's new:**
- Tools menu automatically appears in the "+" dropdown when `[tools]="true"`
- Select tools to include them in completion requests
- Tool indicator badge shows when tools are enabled
- All features work out of the box with no configuration needed

**To enable tools:**
```typescript
<openwebui-chat
  [tools]="true"
  ...>
</openwebui-chat>
```

**No code changes required** - tools functionality is automatically available when enabled.

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


