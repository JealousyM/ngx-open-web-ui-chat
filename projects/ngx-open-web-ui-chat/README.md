# ngx-open-web-ui-chat

Angular 20 component library for embedding OpenWebUI chat with Socket.IO streaming, conversation history and markdown support.

[![Angular](https://img.shields.io/badge/Angular-20-red)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Zoneless](https://img.shields.io/badge/Zoneless-✓-green)]()
[![Signals](https://img.shields.io/badge/Signals-✓-blue)]()
[![Demo](https://img.shields.io/badge/Demo-Live-blue)](https://micode-ai.github.io/ngx-open-web-ui-chat/)
[![NPM Version](https://img.shields.io/npm/v/ngx-open-web-ui-chat.svg)](https://www.npmjs.com/package/ngx-open-web-ui-chat)
![NPM Downloads](https://img.shields.io/npm/d18m/ngx-open-web-ui-chat.svg)



## 🌐 [Live Demo](https://micode-ai.github.io/ngx-open-web-ui-chat/)


## Features

✨ **Conversation History** - AI remembers all previous messages  
📝 **Markdown Support** - Rich text rendering with ngx-markdown  
🚀 **Angular 2025** - Zoneless, Signals, Modern architecture  
⚡ **Socket.IO Streaming** - Real-time WebSocket chat with instant responses  
📎 **File Upload** - Attach files to messages (documents, images, etc.)  
🎤 **Voice Input** - Record audio messages with automatic transcription  
🌍 **10 Languages** - Multi-language UI support  
🎨 **SCSS Styling** - Modern CSS with nesting  
🔧 **TypeScript** - Full type safety  
📱 **Responsive** - Mobile-friendly design  
⏹️ **Stop Generation** - Cancel AI response anytime  
⭐ **Response Actions** - Continue, regenerate, and rate responses  
👍 **Rating System** - Comprehensive feedback with good/bad ratings  
💬 **Ask & Explain** - Context menu for selected text with AI explanations  
📂 **Folder Support** - Organize chats into folders with drag & drop  
📝 **Notes Support** - Integrated markdown note editor with sidebar  
🗃️ **Archived Chats** - View, search, unarchive, and delete archived conversations  
🔌 **Integrations** - Toggle Web Search and Code Interpreter capabilities  
🛠️ **Tools Support** - Access and enable server-side tools from Open WebUI API  
💬 **Reference Chats** - Reference previous conversations in new messages  
📝 **Reference Notes** - Reference notes in new messages  
🌐 **Web Page Attachment** - Process and attach web page content to messages  
🎛️ **Feature Toggles** - Conditional display of advanced features


## Installation

```bash
npm install ngx-open-web-ui-chat
```

## ⚠️ IMPORTANT: Required Setup

**🐛 Having issues? → [TROUBLESHOOTING GUIDE](../../TROUBLESHOOTING.md)**

### Step 1: Install peer dependencies (if not already installed)

```bash
npm install ngx-markdown marked socket.io-client
```

### Step 2: Configure providers in `main.ts`

**THIS IS REQUIRED!** Add these providers or the component won't work:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),           // Required for zoneless mode
    provideHttpClient(withInterceptorsFromDi()), // Required for HTTP
    provideMarkdown()                            // Required for markdown rendering
  ]
}).catch((err) => console.error(err));
```

### Step 3: Remove zone.js from angular.json

```json
{
  "polyfills": []  // Must be empty, no "zone.js"!
}
```

### 2. Use Component

```typescript
import { Component } from '@angular/core';
import { OpenwebuiChatComponent } from 'ngx-open-web-ui-chat';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <openwebui-chat
      [endpoint]="'https://your-openwebui-instance.com'"
      [modelId]="'llama3'"
      [apiKey]="'sk-your-api-key'">
    </openwebui-chat>
  `
})
export class AppComponent {}
```

## API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `endpoint` | `string` | ✅ | - | OpenWebUI instance URL |
| `modelId` | `string` | ✅ | - | AI model identifier |
| `apiKey` | `string` | ✅ | - | API authentication key |
| `enableMarkdown` | `boolean` | ❌ | `true` | Enable markdown rendering |
| `debug` | `boolean` | ❌ | `false` | Enable debug logging |
| `language` | `string` | ❌ | `'en'` | UI language code |
| `history` | `boolean` | ❌ | `false` | Enable chat history sidebar |
| `folders` | `boolean` | ❌ | `false` | Enable folder support |
| `notes` | `boolean` | ❌ | `false` | Enable notes feature |
| `integrations` | `boolean` | ❌ | `false` | Enable integrations menu |
| `tools` | `boolean` | ❌ | `false` | Enable tools selection menu |
| `showReferenceChats` | `boolean` | ❌ | `false` | Enable reference chat selection |
| `showReferenceNotes` | `boolean` | ❌ | `false` | Enable reference note selection |
| `showAttachWebPage` | `boolean` | ❌ | `false` | Enable web page attachment feature |
| `style` | `Partial<CSSStyleDeclaration>` | ❌ | - | Custom CSS styles |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `chatInitialized` | `EventEmitter<void>` | Emitted when chat session is ready |
| `messagesChanged` | `EventEmitter<number>` | Emitted when message count changes |

### Methods

```typescript
// Send a message programmatically
sendMessage(message: string): void

// Clear all messages (keeps session)
clearChat(): void

// Create new chat session (clears messages)
createNewChat(): void

// Change to different model
changeModel(modelId: string): void

// Get available models (async)
async getModels(): Promise<any>
```

## Conversation History

The component automatically maintains full conversation context:

```json
[
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi! How can I help?"},
  {"role": "user", "content": "What did I say before?"},
  {"role": "assistant", "content": "You said 'Hello'"}
]
```

**All previous messages are sent with each new request**, enabling the AI to:
- Remember the entire conversation
- Provide context-aware responses
- Reference earlier messages

## Examples

### Basic Chat

```typescript
<openwebui-chat
  [endpoint]="'https://ai.example.com'"
  [modelId]="'llama3'"
  [apiKey]="'sk-abc123'">
</openwebui-chat>
```

### With Controls

```typescript
import { Component, ViewChild } from '@angular/core';
import { OpenwebuiChatComponent } from 'ngx-open-web-ui-chat';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <button (click)="clearChat()">Clear</button>
    <button (click)="sendHello()">Say Hi</button>
    
    <openwebui-chat
      #chat
      [endpoint]="endpoint"
      [modelId]="modelId"
      [apiKey]="apiKey"
      (chatInitialized)="onReady()"
      (messagesChanged)="onMsgCount($event)">
    </openwebui-chat>
  `
})
export class AppComponent {
  @ViewChild('chat') chat?: OpenwebuiChatComponent;
  
  clearChat() {
    this.chat?.clearChat();
  }
  
  sendHello() {
    this.chat?.sendMessage('Hello!');
  }
  
  onReady() {
    console.log('Chat ready!');
  }
  
  onMsgCount(count: number) {
    console.log('Messages:', count);
  }
}
```

### Multi-language

```typescript
<openwebui-chat
  [endpoint]="endpoint"
  [modelId]="modelId"
  [apiKey]="apiKey"
  [language]="'en'">
</openwebui-chat>
```

**Supported:** `en`, `zh`, `hi`, `es`, `ar`, `fr`, `pt`, `ru`, `bn`, `ja`

### Plain Text (No Markdown)

```typescript
<openwebui-chat
  [endpoint]="endpoint"
  [modelId]="modelId"
  [apiKey]="apiKey"
  [enableMarkdown]="false">
</openwebui-chat>
```

## Markdown Support

Enabled by default. Supports:

- **Headers** (H1-H6)
- **Emphasis** (bold, italic, strikethrough)
- **Lists** (ordered & unordered)
- **Links** and **Images**
- **Code blocks** (inline & multiline)
- **Blockquotes**
- **Tables**
- **Horizontal rules**

Example response:

````markdown
# Title

Here's **bold** and `code`.

```javascript
console.log('Hello');
```

- Item 1
- Item 2
````

Will render as formatted HTML automatically!

## Custom Styling

Override component styles:

```css
::ng-deep openwebui-chat {
  .message.user {
    background: #4CAF50;
  }
  
  .message.assistant {
    background: #f0f0f0;
  }
  
  /* Markdown elements */
  code {
    background: #f5f5f5;
    padding: 2px 4px;
  }
}
```

## Angular 2025 Architecture

### Zoneless

```typescript
provideZonelessChangeDetection()
```

No ZoneJS dependency = smaller bundle, better performance.

### Signals

```typescript
// Component state
messages = signal<ChatMessage[]>([]);
isLoading = signal(false);
```

Reactive, efficient, modern.

### File Structure

```
src/lib/
├── components/
│   ├── openwebui-chat.ts           ← Main component logic
│   ├── openwebui-chat.html         ← Main template
│   ├── openwebui-chat.scss         ← Main styles
│   ├── chat-input/                 ← Input component
│   ├── chat-message/               ← Message display component
│   ├── chat-history-sidebar/       ← History sidebar components
│   │   ├── sidebar/                ← Main sidebar container
│   │   ├── list/                   ← Chat list
│   │   ├── item/                   ← Chat item
│   │   ├── header/                 ← Sidebar header
│   │   ├── context-menu/           ← Chat context menu
│   │   ├── folder-list/            ← Folder list
│   │   ├── folder-item/            ← Folder item
│   │   └── folder-context-menu/    ← Folder context menu
│   ├── archived-chats-modal/       ← Archived chats modal component
│   ├── attach-webpage-modal/       ← Web page attachment modal component
│   ├── chat-search-modal/          ← Search modal
│   ├── confirm-dialog/             ← Confirmation dialogs
│   ├── error-banner/               ← Error display component
│   ├── export-format-menu/         ← Export options menu
│   ├── note-editor/                ← Note editor component
│   ├── notes-sidebar/              ← Notes sidebar component
│   ├── message-actions/            ← Action buttons component
│   ├── rating-form/                ← Rating form component
│   ├── regenerate-menu/            ← Regenerate menu component
│   ├── text-selection-menu/        ← Text selection context menu
│   └── ask-explain-modal/          ← Ask/Explain modal component
├── services/
│   └── openwebui-api.ts            ← API service
├── models/
│   └── chat.model.ts               ← Type definitions
├── utils/
│   ├── audio-recorder.ts           ← Audio recording utility
│   └── date-formatter.ts           ← Date formatting utility
└── i18n/
    └── translations.ts             ← Multi-language support
```

Clean separation of concerns with modular component architecture.

### inject() DI

```typescript
private service = inject(OpenWebUIService);
```

Modern dependency injection pattern.

## Development

### Build

```bash
npm run build
# Output: dist/
```

### Link Locally

```bash
cd dist
npm link

# In your app
npm link ngx-open-web-ui-chat
```

### Test

See `test-app/` for a complete example application.

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Requirements

- **Node.js**: >= 20.19.0
- **Angular**: ^20.0.0
- **TypeScript**: ~5.8.0

## Troubleshooting

### Markdown Not Rendering

**Problem:** Markdown appears as plain text.

**Solution:** Add providers to `main.ts`:

```typescript
import { provideMarkdown } from 'ngx-markdown';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideMarkdown()  // Required!
  ]
});
```

### Import Error

**Problem:** `Cannot find module 'ngx-open-web-ui-chat'`

**Solution:**
1. `npm install ngx-open-web-ui-chat`
2. Restart TypeScript server
3. For local dev, use `npm link`

### Conversation History Not Working

**Problem:** AI doesn't remember previous messages.

**Solution:** This is fixed in v1.0.0+. Update to latest version:

```bash
npm update ngx-open-web-ui-chat
```

## Documentation

Full documentation available in the repository:

- **[API Reference](../../docs/API.md)** - Complete API docs
- **[Markdown Guide](../../docs/MARKDOWN.md)** - Markdown features
- **[I18N Guide](../../docs/I18N.md)** - Multi-language setup

## Architecture

### Socket.IO Integration

The library uses **Socket.IO** for real-time bidirectional communication with OpenWebUI:

- **WebSocket Connection** - Persistent connection for instant message delivery
- **Event-Driven** - Handles `chat:completion`, `status`, and other events
- **Automatic Reconnection** - Resilient connection with retry logic  
- **Task Management** - Tracks message generation via task IDs
- **Completion Detection** - Smart handling of finish signals

### How It Works

1. **Initial Connection** - Socket.IO connects to `/ws/socket.io` on configure
2. **Chat Creation** - Creates new chat session via REST API
3. **Message Sending** - POST to `/api/chat/completions` with `session_id` and `chat_id`
4. **Real-time Streaming** - Server sends incremental content via Socket.IO events
5. **Completion** - Detects finish signals and saves conversation to server

## Version History

### 1.0.18 (Current)
- ✅ **Reference Notes Support** - Reference notes in new messages
- ✅ **Reference Note Menu** - Browse and select notes to reference
- ✅ **Visual Indicator** - Referenced notes appear as badges
- ✅ **Translations** - Added reference note translation keys

### 1.0.17
- ✅ **Reference Chat Support** - Reference previous conversations in new messages
- ✅ **Reference Chat Menu** - Browse and select chats to reference
- ✅ **Visual Indicator** - Referenced chats appear as badges
- ✅ **Pagination** - Load more chats with infinite scroll
- ✅ **Translations** - Added reference chat translation keys

### 1.0.16
- ✅ **Tools Support** - Access and enable server-side tools from Open WebUI API
- ✅ **Tools Menu** - Select/deselect tools with visual checkmarks
- ✅ **Tool Indicator** - Visual badge showing enabled tools
- ✅ **API Integration** - Fetches tools from `/api/v1/tools/` endpoint
- ✅ **Translations** - Added tools-related translation keys

### 1.0.15
- ✅ **Integrations Support** - Toggle external capabilities
- ✅ **Web Search** - Enable/disable web search
- ✅ **Code Interpreter** - Enable/disable code execution
- ✅ **Translations** - Added support for integration keys

### 1.0.14
- ✅ **Archived Chats Modal** - View, search, unarchive, and delete archived chats
- ✅ **Search Archived** - Debounced search through archived conversations
- ✅ **Pagination** - Load more archived chats with infinite scroll
- ✅ **Accessibility** - Focus trap and keyboard navigation for modal

### 1.0.13
- ✅ **Notes Support** - Integrated markdown note editor
- ✅ **Notes Sidebar** - Create, edit, and organize notes
- ✅ **Auto-save** - Notes are automatically saved

### 1.0.12
- ✅ **Folder Support** - Organize chats into folders with drag & drop
- ✅ **Drag & Drop** - Improved drag and drop experience for chats and folders
- ✅ **Context Menus** - Manage folders with right-click context menu
- ✅ **Nested Folders** - Support for hierarchical folder structures
- ✅ **Text Selection Menu** - Right-click on selected text to ask questions or get explanations
- ✅ **Ephemeral Completions** - Ask/Explain responses don't clutter chat history
- ✅ **Full Localization** - All Ask & Explain features translated to 10 languages
- ✅ **Unit Tests** - Complete test coverage for new components

### 1.0.10
- ✅ **Chat Export** - Export conversations to PDF, TXT, and JSON formats
- ✅ **Active Chat Protection** - Prevent accidental deletion of the currently active chat
- ✅ **Markdown Improvements** - Better list indentation and search preview rendering
- ✅ **UI Polish** - Fixed search modal dimensions and sidebar localization
- ✅ **Bug Fixes** - Immediate chat list updates and various stability improvements

### 1.0.9
- ✅ **Voice Input** - Record audio messages with automatic transcription
- ✅ **Real-time Spectrogram** - Visual feedback during recording
- ✅ **Multi-language Transcription** - Support for multiple languages

### 1.0.7
- ✅ **Response Actions** - Continue, regenerate, and rate responses
- ✅ **Rating System** - Comprehensive feedback with good/bad ratings

### 1.0.4
- ✅ **File Upload Support** - Attach files to messages with UI
- ✅ **Socket.IO Streaming** - Real-time WebSocket communication
- ✅ **Smart Completion Detection** - Handles multiple finish signal types
- ✅ **Conversation History** - AI remembers all previous messages
- ✅ **Chat History Persistence** - Full conversation saved to OpenWebUI server
- ✅ **Completion Finalization** - Proper `/api/chat/completed` endpoint integration
- ✅ **Duplicate Prevention** - Fixed duplicate API calls and messages
- ✅ **Correct API Flow** - Proper sequence: update chat → completions → update chat → completed
- ✅ **Message Structure** - Correct parentId/childrenIds relationships
- ✅ **Model Item Support** - Full model metadata in requests
- ✅ **Angular 2025** - Zoneless, signals, modern architecture
- ✅ **File Separation** - TS/HTML/SCSS split
- ✅ **messagesChanged Event** - Track message count
- ✅ **inject() DI** - Modern dependency injection
- ✅ **SCSS Styling** - Modern CSS with nesting
- ✅ **Async/Await** - Modern API patterns

### 1.0.0 (Initial)
- ✅ Basic chat functionality
- ✅ Markdown rendering
- ✅ Streaming responses
- ✅ Multi-language support

## File Upload

The component supports file attachments:

```typescript
// Files are automatically uploaded when selected
// They appear in the UI with filename and size
// Click × to remove before sending
```

**Supported workflow:**
1. Click + button in input area
2. Select "Upload Files" from menu
3. Choose file to upload
4. File appears in preview area
5. Send message - file is attached automatically

Files are sent to OpenWebUI API and processed according to the model capabilities.

## Response Interaction Controls

The component provides interactive controls for each assistant response:

### Action Buttons

Every assistant message displays action buttons:

- **Continue** - Extend incomplete responses
- **Regenerate** - Generate alternative responses with options:
  - Custom input with text field
  - Try Again (resend previous prompt)
  - More Concise
  - Add Details
- **Rate Good** 👍 - Provide positive feedback
- **Rate Bad** 👎 - Provide negative feedback

**Visibility:**
- Latest message: Always visible
- Previous messages: Visible on hover

### Rating System

Comprehensive feedback system with two rating types:

#### Good Rating (👍)
When rating a response as good, you can select from:
- Accurate information
- Followed instructions perfectly
- Showcased creativity
- Positive attitude
- Attention to detail
- Thorough explanation
- Other

#### Bad Rating (👎)
When rating a response as bad, you can select from:
- Don't like the style
- Too verbose
- Not helpful
- Not factually correct
- Didn't fully follow instructions
- Refused when it shouldn't have
- Being lazy
- Other

**Features:**
- **Detailed Ratings** - 1-10 scale with tags and comments
- **Pre-population** - Edit existing ratings by clicking the rating button again
- **Confirmation** - "Thank you for your feedback" message after submission
- **Persistence** - Ratings saved to OpenWebUI server with full context

### Continue Response

Extend incomplete or truncated responses:

```typescript
// Automatically continues from where the response stopped
// Maintains conversation context
// Updates the same message with additional content
```

### Regenerate Response

Generate alternative responses with multiple options:

```typescript
// Try Again - Resend the same prompt for a different response
// More Concise - Request a shorter version
// Add Details - Request more comprehensive information
// Custom Input - Provide specific instructions for regeneration
```

## Voice Input

The component supports voice recording with automatic transcription:

### Features

- **🎤 Voice Recording** - Click microphone button to start recording
- **📊 Real-time Spectrogram** - Visual feedback showing audio frequency during recording
- **🔴 Stop Recording** - Click stop button to end recording
- **✍️ Auto-transcription** - Audio automatically transcribed to text via OpenWebUI API
- **✏️ Editable Text** - Review and edit transcribed text before sending
- **🌐 Multi-language** - Transcription supports multiple languages
- **⚠️ Error Handling** - Clear error messages for permission issues or failures

### How It Works

1. **Click microphone button** near the send button
2. **Grant microphone permission** when prompted by browser
3. **See spectrogram visualization** showing your voice in real-time
4. **Click stop button** when finished recording
5. **Wait for transcription** - audio is sent to OpenWebUI API
6. **Review transcribed text** in the input field
7. **Edit if needed** and send your message

### Browser Support

Voice input requires:
- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- Microphone permission granted by user
- HTTPS connection (required for microphone access)

### Error Messages

The component handles various error scenarios:
- **Browser not supported** - "Your browser doesn't support voice recording"
- **Permission denied** - "Microphone permission denied. Please enable it in your browser settings"
- **Recording failed** - "Failed to record audio. Please try again"
- **Transcription failed** - "Failed to transcribe audio. Please try again" with retry button

### Technical Details

- **Audio Format**: WebM with Opus codec
- **Sample Rate**: 48kHz (Web Audio API standard)
- **API Endpoint**: `/api/v1/audio/transcriptions`
- **Visualization**: Real-time FFT analysis with frequency bars
- **Cleanup**: Automatic microphone release after recording

## Ask & Explain Feature

The component includes an interactive context menu for selected text:

### How to Use

1. **Select text** in any chat message
2. **Right-click** to open the context menu
3. Choose:
   - **Ask** - Type a custom question about the selected text
   - **Explain** - Get an instant AI explanation

### Features

- 💬 **Context Menu** - Clean, positioned menu on right-click
- ❓ **Ask Mode** - Input field for custom questions
- 📖 **Explain Mode** - Instant explanations without additional input
- 🎨 **Modal Interface** - Beautiful modal for displaying responses
- 📝 **Markdown Rendering** - Formatted AI responses
- ⚡ **Streaming** - Real-time response generation
- 🌍 **Localized** - Full translation support
- 🔒 **Ephemeral** - Responses don't persist in chat history

### Example

```
User selects: "Angular signals are reactive primitives"
Right-clicks → Explain

AI Response (in modal):
"Angular signals are a new reactive state management system..."
```

## Folder Support

Organize your conversations efficiently with folders:

### Features

- 📂 **Create Folders** - Group related chats together
- 🖱️ **Drag & Drop** - Easily move chats into folders
- 📑 **Nested Structure** - Create subfolders for better organization
- ✏️ **Manage** - Rename or delete folders via context menu

### Usage

1. **Enable Folders**: Set `[folders]="true"` in your component
2. **Create Folder**: Click the "New Folder" button in the sidebar
3. **Move Chats**: Drag and drop chats into folders
4. **Context Menu**: Right-click folders to manage them

```typescript
<openwebui-chat
  [folders]="true"
  ...>
</openwebui-chat>
```

## Tools Support

Access and enable server-side tools from the Open WebUI API:

### Features

- 🛠️ **Tools Menu** - Access tools via the "+" dropdown menu
- ✅ **Selection** - Select/deselect tools with visual checkmarks
- 🔵 **Tool Indicator** - Badge showing enabled tools in input area
- ⚡ **Prefetch** - Tools list prefetched on init for faster display
- 🔗 **API Integration** - Selected tool IDs sent in completion requests

### Usage

1. **Enable Tools**: Set `[tools]="true"` in your component
2. **Access Menu**: Click "+" button and select "Tools"
3. **Select Tools**: Click tools to toggle selection
4. **Send Message**: Selected tools are automatically included in requests

```typescript
<openwebui-chat
  [tools]="true"
  ...>
</openwebui-chat>
```

### How It Works

1. Component fetches available tools from `/api/v1/tools/`
2. Tools appear in a submenu with name and description
3. Selected tools show a checkmark indicator
4. Tool indicator badge appears when tools are enabled
5. `tool_ids` array is included in completion request payload

## Reference Chat Support

Reference previous conversations to provide context for new messages:

### Features

- 💬 **Reference Chat Menu** - Access via the "+" dropdown menu
- 📋 **Chat Selection** - Browse and select from existing chats
- 🏷️ **Visual Indicator** - Referenced chats appear as badges in input area
- ♾️ **Pagination** - Load more chats with infinite scroll
- 🔗 **API Integration** - Referenced chat IDs included in completion requests

### Usage

1. **Enable Reference Chats**: Set `[showReferenceChats]="true"` in your component
2. **Access Menu**: Click "+" button and select "Reference Chat"
3. **Select Chat**: Click a chat to reference it
4. **Send Message**: Referenced chat context is automatically included

```typescript
<openwebui-chat
  [showReferenceChats]="true"
  ...>
</openwebui-chat>
```

### How It Works

1. Click "+" button and select "Reference Chat"
2. Browse available chats with pagination support
3. Select a chat to reference - it appears as a badge
4. Send your message - the referenced chat provides context
5. AI can access the referenced conversation for better responses

## Reference Notes Support

Reference notes to provide context for new messages:

### Features

- 📝 **Reference Note Menu** - Access via the "+" dropdown menu
- 📋 **Note Selection** - Browse and select from existing notes
- 🏷️ **Visual Indicator** - Referenced notes appear as badges in input area
- 🔗 **API Integration** - Referenced note IDs included in completion requests

### Usage

1. **Enable Reference Notes**: Set `[showReferenceNotes]="true"` in your component
2. **Access Menu**: Click "+" button and select "Reference Note"
3. **Select Note**: Click a note to reference it
4. **Send Message**: Referenced note context is automatically included

```typescript
<openwebui-chat
  [showReferenceNotes]="true"
  ...>
</openwebui-chat>
```

### How It Works

1. Click "+" button and select "Reference Note"
2. Browse available notes
3. Select a note to reference - it appears as a badge
4. Send your message - the referenced note provides context
5. AI can access the referenced note content for better responses

## Web Page Attachment

Process and attach web page content to your messages:

### Features

- 🌐 **Web Page Processing** - Extract and process web page content via OpenWebUI API
- 📥 **Attachment Menu** - Access via the "+" dropdown menu alongside file upload
- 🔗 **API Integration** - Uses `/api/v1/retrieval/process/web` endpoint
- 🏷️ **Visual Indicator** - Attached web pages appear as badges in input area
- 🌍 **Multi-language** - Full translation support in 10 languages
- 🎛️ **Conditional Display** - Enable/disable via `showAttachWebPage` property

### Usage

1. **Enable Feature**: Set `[showAttachWebPage]="true"` in your component
2. **Access Menu**: Click "+" button and select "Attach Web Page"
3. **Enter URL**: Paste the web page URL in the modal dialog
4. **Process Content**: Click "Attach" to process the web page
5. **Send Message**: The web page content is automatically included

```typescript
<openwebui-chat
  [showAttachWebPage]="true"
  ...>
</openwebui-chat>
```

### How It Works

1. Click "+" button and select "Attach Web Page"
2. Enter a valid web page URL in the modal dialog
3. The URL is sent to `/api/v1/retrieval/process/web` endpoint
4. OpenWebUI processes the web page content
5. Processed content is attached as a file-like object
6. Send your message - the web page content provides context
7. AI can access the processed web page content for better responses

### Example

```typescript
// User attaches: https://example.com/article
// System processes and includes content in message context
// AI can reference the article content in responses
```

### Error Handling

- Invalid URLs are rejected with clear error messages
- Network errors are displayed with retry options
- Processing failures show descriptive error messages
- All errors are translated in 10 languages

## Archived Chats

Access and manage your archived conversations with the archived chats modal:

### Features

- 🗃️ **View Archived** - Dedicated modal to access all archived chats
- 🔍 **Search** - Search through archived chats with debounced query
- 📤 **Unarchive** - Restore chats to your main chat list
- 🗑️ **Delete** - Permanently delete archived chats with confirmation
- ♾️ **Pagination** - Load more with infinite scroll
- ⌨️ **Keyboard Navigation** - Focus trap and ESC to close

### Usage

1. **Enable History**: Set `[history]="true"` to enable chat sidebar
2. **Archive Chats**: Right-click any chat and select "Archive"
3. **View Archived**: Click "Archived Chats" in the sidebar header
4. **Manage**: Search, unarchive, or delete from the modal

```typescript
<openwebui-chat
  [history]="true"
  ...>
</openwebui-chat>
```

## Roadmap

- [x] File upload support
- [x] Response interaction controls (continue, regenerate, rate)
- [x] Comprehensive rating system
- [x] Voice input with transcription
- [x] Export chat history
- [x] Ask & Explain for selected text
- [x] Folder support (Drag & Drop)
- [x] Notes support with markdown editor
- [x] Archived chats modal with search
- [x] Tools support with API integration
- [x] Reference chat support for conversation context
- [x] Web page attachment with content processing
- [x] Conditional feature display with toggles

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License

## Support

- 📧 Issues: [GitHub Issues](https://github.com/micode-ai/ngx-open-web-ui-chat/issues)
- 📚 Docs: [Documentation](../../docs/)

## Credits

Built with:
- [Angular 20](https://angular.dev)
- [Socket.IO Client](https://socket.io/)
- [ngx-markdown](https://www.npmjs.com/package/ngx-markdown)
- [marked](https://marked.js.org/)

---

Made with ❤️ for the Angular community
