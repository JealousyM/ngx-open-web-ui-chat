# ngx-open-web-ui-chat

Angular 20 component library for embedding OpenWebUI chat with Socket.IO streaming, conversation history and markdown support.

[![Angular](https://img.shields.io/badge/Angular-20-red)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Zoneless](https://img.shields.io/badge/Zoneless-✓-green)]()
[![Signals](https://img.shields.io/badge/Signals-✓-blue)]()
[![Demo](https://img.shields.io/badge/Demo-Live-blue)](https://jealousym.github.io/ngx-open-web-ui-chat/)

## 🌐 [Live Demo](https://jealousym.github.io/ngx-open-web-ui-chat/)

## Features

✨ **Conversation History** - AI remembers all previous messages  
📝 **Markdown Support** - Rich text rendering with ngx-markdown  
🚀 **Angular 2025** - Zoneless, Signals, Modern architecture  
⚡ **Socket.IO Streaming** - Real-time WebSocket chat with instant responses  
🌍 **10 Languages** - Multi-language UI support  
🎨 **SCSS Styling** - Modern CSS with nesting  
🔧 **TypeScript** - Full type safety  
📱 **Responsive** - Mobile-friendly design  
⏹️ **Stop Generation** - Cancel AI response anytime

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
  [language]="'ru'">  <!-- Russian -->
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
components/
├── openwebui-chat.ts       ← Logic
├── openwebui-chat.html     ← Template
└── openwebui-chat.scss     ← Styles
```

Clean separation of concerns.

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

### 1.0.4+ (Current)
- ✅ **Socket.IO Streaming** - Real-time WebSocket communication
- ✅ **Smart Completion Detection** - Handles multiple finish signal types
- ✅ **Conversation History** - Full context maintained
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

## Roadmap

- [ ] File upload support
- [ ] Dark mode theme
- [ ] Export chat history
- [ ] Voice input

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License

## Support

- 📧 Issues: [GitHub Issues](https://github.com/JealousyM/ngx-open-web-ui-chat/issues)
- 📚 Docs: [Documentation](../../docs/)

## Credits

Built with:
- [Angular 20](https://angular.dev)
- [Socket.IO Client](https://socket.io/)
- [ngx-markdown](https://www.npmjs.com/package/ngx-markdown)
- [marked](https://marked.js.org/)

---

Made with ❤️ for the Angular community
