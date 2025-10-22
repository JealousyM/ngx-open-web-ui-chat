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

## TypeScript Interfaces

### ChatMessage

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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

## Lifecycle

1. **Component Initialization** (`ngOnInit`)
   - Configuration is applied
   - OpenWebUI service is configured
   - Initial chat session is created
   - `chatInitialized` event is emitted

2. **Message Sending**
   - User types message or `sendMessage()` is called
   - Message is added to display
   - **Full conversation history** is collected (all previous user and assistant messages)
   - Request is sent to OpenWebUI API with complete conversation context
   - Response is streamed back in real-time
   - Response is rendered (with markdown if enabled)

3. **Chat Management**
   - `createNewChat()` - Creates new server session and clears history
   - `clearChat()` - Clears local state and history

## Error Handling

The component includes built-in error handling:

- Network errors are logged to console (when `debug=true`)
- Failed requests don't crash the UI
- Loading states are properly managed

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

1. Use `clearChat()` instead of `createNewChat()` if you don't need a new server session
2. Disable markdown if not needed: `[enableMarkdown]="false"`
3. Monitor message count and implement pagination for long conversations
4. Use `OnPush` change detection strategy in parent components

## Browser Support

- Chrome/Edge: ✅ v90+
- Firefox: ✅ v88+
- Safari: ✅ v14+
- Mobile browsers: ✅ iOS Safari 14+, Chrome Mobile

## License

MIT

