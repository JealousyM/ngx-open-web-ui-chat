# API Documentation

## Component: `openwebui-chat`

### Inputs (Properties)

#### Required Inputs

| Name | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | The URL of your OpenWebUI instance (e.g., `https://ai.example.com`) |
| `modelId` | `string` | The identifier of the AI model to use (e.g., `llama3`, `gpt-4`) |
| `apiKey` | `string` | API authentication key for OpenWebUI access |

#### Optional Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `enableMarkdown` | `boolean` | `true` | Enable/disable markdown rendering for messages |
| `debug` | `boolean` | `false` | Enable debug logging to console |
| `language` | `string` | `'en'` | UI language code (en, ru, zh, etc.) |
| `history` | `boolean` | `false` | Enable chat history sidebar |
| `folders` | `boolean` | `false` | Enable folder support for organizing chats |
| `notes` | `boolean` | `false` | Enable notes feature with markdown editor |
| `integrations` | `boolean` | `false` | Enable integrations (web search, code interpreter) menu |
| `tools` | `boolean` | `false` | Enable tools selection menu for server-side tools |
| `style` | `Partial<CSSStyleDeclaration>` | `undefined` | Custom inline styles for the component |

### Outputs (Events)

| Name | Type | Description |
|------|------|-------------|
| `chatInitialized` | `EventEmitter<void>` | Emitted when chat session is successfully created and ready |
| `messagesChanged` | `EventEmitter<number>` | Emitted when messages count changes (after send or clear) |

### Public Methods

#### `sendMessage(message: string): void`

Programmatically send a message to the AI.

**Parameters:**
- `message` (string): The message content to send

**Example:**
```typescript
this.chatComponent.sendMessage('Hello AI!');
```

#### `createNewChat(): void`

Create a new chat session. This will:
- Create a new session on the server
- Clear all existing messages
- Reset the chat interface

**Example:**
```typescript
this.chatComponent.createNewChat();
```

#### `stopGeneration(): Promise<void>`

Stop the current AI response generation. This will:
- Abort the ongoing stream request using AbortController
- Get active tasks from `/api/tasks/chat/{chat_id}`
- Stop the running task via `/api/tasks/stop/{task_id}`
- Save the partial response as a complete message
- Reset loading state

**Example:**
```typescript
await this.chatComponent.stopGeneration();
```

**Note:** The stop button is automatically shown in the UI during generation, replacing the send button.

#### `clearChat(): void`

Clear the current chat completely. This will:
- Remove all messages from display
- Clear the input field
- Reset loading states
- Keep the same session ID

**Example:**
```typescript
this.chatComponent.clearChat();
```

## Usage Examples

### Basic Setup

```typescript
import { Component } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <openwebui-chat
      [endpoint]="'https://ai.example.com'"
      [modelId]="'llama3'"
      [apiKey]="'sk-abc123'"
    ></openwebui-chat>
  `
})
export class AppComponent {}
```

### With ViewChild Reference

```typescript
import { Component, ViewChild } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <openwebui-chat
      #chatRef
      [endpoint]="endpoint"
      [modelId]="modelId"
      [apiKey]="apiKey"
      [debug]="true"
    ></openwebui-chat>
  `
})
export class AppComponent {
  @ViewChild('chatRef') chat?: OpenwebuiChatComponent;

  endpoint = 'https://ai.example.com';
  modelId = 'llama3';
  apiKey = 'sk-abc123';
}
```

### With Control Buttons

```typescript
import { Component, ViewChild } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <div class="controls">
      <button (click)="sendGreeting()">Send Greeting</button>
      <button (click)="stopResponse()">Stop Response</button>
      <button (click)="startNew()">New Chat</button>
      <button (click)="clear()">Clear</button>
    </div>
    
    <openwebui-chat
      #chat
      [endpoint]="endpoint"
      [modelId]="modelId"
      [apiKey]="apiKey"
    ></openwebui-chat>
  `
})
export class AppComponent {
  @ViewChild('chat') chatComponent?: OpenwebuiChatComponent;

  endpoint = 'https://ai.example.com';
  modelId = 'llama3';
  apiKey = 'sk-abc123';

  sendGreeting() {
    this.chatComponent?.sendMessage('Hello, how can you help me?');
  }

  stopResponse() {
    this.chatComponent?.stopGeneration();
  }

  startNew() {
    this.chatComponent?.createNewChat();
  }

  clear() {
    this.chatComponent?.clearChat();
  }
}
```

### With Event Handlers

```typescript
import { Component, ViewChild } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <openwebui-chat
      #chat
      [endpoint]="endpoint"
      [modelId]="modelId"
      [apiKey]="apiKey"
      (chatInitialized)="onChatReady()"
    ></openwebui-chat>
  `
})
export class AppComponent {
  @ViewChild('chat') chatComponent?: OpenwebuiChatComponent;

  endpoint = 'https://ai.example.com';
  modelId = 'llama3';
  apiKey = 'sk-abc123';

  onChatReady() {
    this.chatComponent?.sendMessage('Hi! I need help with...');
  }
}
```

### Dynamic Configuration

```typescript
import { Component, ViewChild, signal } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent, FormsModule],
  template: `
    <div class="config">
      <label>
        <input type="checkbox" [(ngModel)]="markdownEnabled" />
        Enable Markdown
      </label>
      <label>
        <input type="checkbox" [(ngModel)]="debugMode" />
        Debug Mode
      </label>
      <button (click)="clearChat()">Clear Chat</button>
    </div>
    
    <openwebui-chat
      #chat
      [endpoint]="endpoint"
      [modelId]="modelId"
      [apiKey]="apiKey"
      [enableMarkdown]="markdownEnabled"
      [debug]="debugMode"
    ></openwebui-chat>
  `
})
export class AppComponent {
  @ViewChild('chat') chatComponent?: OpenwebuiChatComponent;

  endpoint = 'https://ai.example.com';
  modelId = 'llama3';
  apiKey = 'sk-abc123';
  
  markdownEnabled = true;
  debugMode = false;

  clearChat() {
    this.chatComponent?.clearChat();
  }
}
```

## File Upload

The component supports file attachments with the following features:

### Upload Flow

1. Click the 📎 (paperclip) button in the input area
2. Select "Upload Files" from the popup menu
3. Choose a file from your system
4. File is automatically uploaded to `/api/v1/files/`
5. File preview appears above the input field
6. Click × on file to remove before sending
7. Send message - files are automatically attached

### File Display

- **In preview area**: Shows filename, size, and remove button
- **In messages**: Files appear as badges with icon, name, and size
- **File formats**: Supported formats depend on OpenWebUI server configuration

### API Methods

```typescript
// Upload a file
async uploadFile(file: File): Promise<UploadedFile>

// Check file processing status
async checkFileStatus(fileId: string, stream?: boolean): Promise<FileProcessStatus>
```

## TypeScript Interfaces

### ChatMessage

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: UploadedFile[];
}
```

### UploadedFile

```typescript
interface UploadedFile {
  id: string;
  filename: string;
  user_id: string;
  hash?: string | null;
  data?: {
    status?: string;
    [key: string]: any;
  };
  meta?: {
    name: string;
    content_type: string;
    size: number;
    data?: Record<string, any>;
  };
  created_at?: number;
  updated_at?: number;
  status?: boolean;
  path?: string;
  access_control?: any;
}
```

### FileProcessStatus

```typescript
interface FileProcessStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  error?: string;
}
```

### OpenWebUIChatConfig

```typescript
interface OpenWebUIChatConfig {
  modelId: string;
  apiKey: string;
  endpoint: string;
  style?: Partial<CSSStyleDeclaration>;
  debug?: boolean;
}
```

### ToolItem

```typescript
interface ToolItem {
  id: string;
  user_id: string;
  name: string;
  meta: {
    description: string;
    manifest?: {
      title: string;
      description: string;
      repository?: string;
      author?: string;
      author_url?: string;
      version?: string;
    };
  };
  access_control?: Record<string, any>;
  updated_at: number;
  created_at: number;
  specs?: ToolSpec[];
}

interface ToolSpec {
  name: string;
  description: string;
  parameters: {
    properties: Record<string, any>;
    required?: string[];
    type: string;
  };
}
```

**Note:** The library automatically uses Socket.IO for real-time streaming. WebSocket connection is established on component initialization.

## Conversation History

The component **automatically maintains conversation context**. Each API request includes the complete conversation history:

```json
[
  {
    "role": "user",
    "content": "How are you"
  },
  {
    "role": "assistant",
    "content": "Hello! I'm fine!"
  }
]
```

This enables the AI to:
- Remember previous questions and answers
- Maintain context across the entire conversation
- Provide coherent responses based on conversation history

## Architecture

### Socket.IO Integration

The library uses **Socket.IO** for real-time bidirectional communication with OpenWebUI:

- **WebSocket Connection** - Persistent connection to `/ws/socket.io` for instant message delivery
- **Event-Driven Architecture** - Handles `chat:completion`, `status`, and `message` events
- **Automatic Reconnection** - Resilient connection with configurable retry logic
- **Task Management** - Tracks message generation via task IDs
- **Smart Completion Detection** - Handles multiple finish signal types (`finish_reason: "stop"`, `status: complete`)

### Message Flow

1. **Socket.IO Connection** - Established on component initialization
2. **Session Creation** - `POST /api/v1/chats/new` creates chat session
3. **Message Sending** - `POST /api/chat/completions` with `session_id`, `chat_id`, and full conversation history
4. **Real-time Streaming** - Server sends incremental content via Socket.IO `events` channel
5. **Content Accumulation** - Delta content is accumulated and rendered in real-time
6. **Completion Detection** - Detects finish signals and saves complete conversation via `POST /api/chat/completed`

## Lifecycle

1. **Component Initialization** (`ngOnInit`)
   - Configuration is applied
   - OpenWebUI service is configured
   - **Socket.IO connection is established** to `/ws/socket.io`
   - Initial chat session is created via REST API
   - `chatInitialized` event is emitted

2. **Message Sending**
   - User types message or `sendMessage()` is called
   - Message is added to display
   - **Full conversation history** is collected (all previous user and assistant messages)
   - Request is sent to OpenWebUI API with `session_id`, `chat_id`, and complete conversation context
   - **Response is streamed back in real-time via Socket.IO events**
   - Content is accumulated and rendered incrementally (with markdown if enabled)
   - **Stop button** replaces send button during generation
   - User can stop generation at any time with partial response saved
   - On completion, conversation is saved to server via `/api/chat/completed`

3. **Chat Management**
   - `createNewChat()` - Creates new server session and clears history
   - `clearChat()` - Clears local state and history (keeps Socket.IO connection)

## Error Handling

The component includes built-in error handling:

- **Socket.IO reconnection** - Automatic retry on connection loss (up to 3 attempts)
- **Network errors** - Logged to console (when `debug=true`)
- **Failed requests** - Don't crash the UI, gracefully handled
- **Loading states** - Properly managed across all operations
- **Abort handling** - Clean cancellation of ongoing requests

## Best Practices

1. **Always use ViewChild for programmatic control:**
   ```typescript
   @ViewChild('chat') chatComponent?: OpenwebuiChatComponent;
   ```

2. **Check component existence before calling methods:**
   ```typescript
   this.chatComponent?.sendMessage('Hello');
   ```

3. **Enable debug mode during development:**
   ```typescript
   [debug]="true"
   ```

4. **Handle chatInitialized event for auto-actions:**
   ```typescript
   (chatInitialized)="onChatReady()"
   ```

5. **Use markdown for rich content:**
   ```typescript
   [enableMarkdown]="true"
   ```

## Security Considerations

- **Never expose API keys in client code** - Use environment variables
- **Validate endpoint URLs** - Ensure HTTPS in production
- **Implement rate limiting** - Prevent abuse of chat functionality
- **Sanitize user input** - Although markdown parser handles this

## Performance Tips

1. **Socket.IO Connection** - Persistent connection is reused across messages (efficient)
2. Use `clearChat()` instead of `createNewChat()` if you don't need a new server session
3. Disable markdown if not needed: `[enableMarkdown]="false"`
4. Monitor message count and implement pagination for long conversations
5. Use `OnPush` change detection strategy in parent components
6. **Delta Streaming** - Content is rendered incrementally for better perceived performance

## File Upload Best Practices

1. **File Size Limits**: Check your OpenWebUI server configuration for max file size
2. **File Types**: Ensure the model supports the file type you're uploading
3. **Multiple Files**: Currently single file per upload, select multiple times if needed
4. **Error Handling**: File upload errors are logged when `debug=true`
5. **Preview Before Send**: Review uploaded files before sending the message

## Browser Support

- Chrome/Edge: ✅ v90+
- Firefox: ✅ v88+
- Safari: ✅ v14+
- Mobile browsers: ✅ iOS Safari 14+, Chrome Mobile

**File Upload**: Supported on all modern browsers with File API support

## License

MIT

