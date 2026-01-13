# OpenWebUI Chat Test Application

Modern Angular 20 test application showcasing all features of the `ngx-open-web-ui-chat` library with a beautiful, responsive interface.

## ✨ Features

### Core Features

#### 🔧 Dynamic Configuration
- Real-time Host URL and API Key input
- Secure password-masked API key field
- Configuration locked after connection
- Validation and error handling

#### 🤖 Smart Model Management
- Load models on-demand with "Show Models" button
- Model dropdown with search/filter
- Loading states and error handling
- Model switching support

#### 💬 Advanced Chat Interface
- Real-time streaming responses
- Markdown rendering with syntax highlighting
- File upload support
- Voice input with transcription
- Stop generation at any time
- Message actions (continue, regenerate, rate)

### Organization Features

#### 📂 Folder Management
- Create and organize chat folders
- Drag & drop chats into folders
- Nested folder support
- Context menu for folder operations
- Visual folder indicators

#### 📝 Notes System
- Integrated markdown editor
- Rich text formatting toolbar
- Auto-save functionality
- Search through notes
- Reference notes in chats

#### 🗃️ Archive Management
- Archive old conversations
- Search archived chats
- Unarchive or permanently delete
- Pagination for large archives

### Advanced Features

#### 🔌 Integrations
- Web Search toggle
- Code Interpreter toggle
- Real-time capability management
- Visual integration indicators

#### 🛠️ Tools Support
- Access server-side tools
- Select/deselect tools with checkmarks
- Tool descriptions and metadata
- Tools included in API requests

#### 🔗 Reference System
- Reference previous chats in new messages
- Reference notes for context
- Reference web pages for content
- Visual badge indicators
- Browse and select references

#### 🌐 Web Page Attachment
- Process web page content via API
- Attach web pages to messages
- Multi-language support
- Conditional feature toggle

### User Experience

#### 🎨 Modern UI/UX
- Clean, intuitive interface
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Loading states and feedback
- Error handling with user-friendly messages

#### ⌨️ Progressive Connection Flow
1. ✅ Enter Host URL and API Key
2. ✅ Load available models
3. ✅ Select desired model
4. ✅ Connect to chat session
5. ✅ Start chatting!

#### 🎯 Conditional UI Elements
- Chat interface enabled only after connection
- Clear Chat button active when messages exist
- Disconnect button to reset configuration
- Context-aware button states

## 🏗️ Architecture

### File Structure (Angular 2025)
```
test-app/src/app/
├── app.component.ts      ← TypeScript logic
├── app.component.html    ← Template
└── app.component.scss    ← Styles (SCSS)
```

### State Management
```typescript
// Signals for reactive state
hostUrl = '';
apiKey = '';
models = signal<any[]>([]);
selectedModelId = signal<string>('');
chatConnected = signal<boolean>(false);
messageCount = signal<number>(0);

// Computed for conditional logic
canLoadModels = computed(() => {...});
hasMessages = computed(() => {...});
```

### Component Communication
```typescript
// Event from chat → App
(messagesChanged)="onMessagesChanged($event)"

// App tracks message count
onMessagesChanged(count: number): void {
  this.messageCount.set(count);
}
```

## 🎯 User Flow

### Step 1: Configuration
```
┌─────────────────────────────┐
│ Host URL:                   │
│ http://localhost:8080       │
│                             │
│ API Key:                    │
│ ••••••••••••••••••••        │
│                             │
│ [Show Models] ←disabled     │
└─────────────────────────────┘
```

### Step 2: Load Models
```
┌─────────────────────────────┐
│ Host URL: ✓ (locked)        │
│ API Key: ✓ (locked)         │
│                             │
│ [Loading...] or [Show Models]│
│                             │
│ Models:                     │
│ ▼ Select a model            │
│   - GPT-4                   │
│   - Llama 3                 │
│   - Claude 3                │
└─────────────────────────────┘
```

### Step 3: Connect & Chat
```
┌─────────────────────────────┐
│ Selected: GPT-4 ✓           │
│ [✓ Connected]               │
│                             │
│ Chat Controls:              │
│ Language: [English ▼]       │
│ [Clear Chat] ←conditional   │
│ [Disconnect]                │
└─────────────────────────────┘

┌──────────────────────────────┐
│ Chat Interface (active)      │
│                              │
│ User: Hello!                 │
│ AI: Hi! How can I help?      │
│                              │
│ [Type message...] [Send]     │
└──────────────────────────────┘
```

## 🎨 UI Components

### Sidebar Sections

#### 1. Configuration
- Host URL input
- API Key input (password)
- Show Models button

#### 2. Models (conditional)
- Model selector dropdown
- Connect Chat button

#### 3. Chat Controls (conditional)
- Language selector
- Clear Chat button (conditional)
- Disconnect button

### Main Area

#### Placeholder (before connection)
  type="password"  // Visually hidden
  [(ngModel)]="apiKey"
  [disabled]="chatConnected()" // Locked after connect
/>
```

### State Validation
```typescript
canLoadModels = computed(() => {
  return this.hostUrl.trim() !== '' && 
         this.apiKey.trim() !== '' && 
         !this.chatConnected();
});
```

## 🚀 Running

```bash
cd test-app
npm install
npm start
```

Visit: `http://localhost:4200`

## 📱 Responsive Breakpoints

```scss
@media (max-width: 768px) {
  .app-container {
    flex-direction: column; // Stack vertically
  }
  
  .sidebar {
    width: 100%;
    max-height: 50vh;
  }
}
```

## 🎨 Styling

### Color Palette
- **Primary**: `#667eea` (Purple)
- **Success**: `#10b981` (Green)
- **Danger**: `#ef4444` (Red)
- **Secondary**: `#64748b` (Gray)

### Animations
- Button hover: `translateY(-1px)` + shadow
- Loading states
- Step completion indicators

## 📊 Features Comparison

| Feature | Before | After |
|---------|--------|-------|
| Config | Hardcoded | Dynamic Input |
| Models | Auto-load | On-demand |
| Chat | Always visible | Conditional |
| Layout | Horizontal | Vertical Sidebar |
| Clear Chat | Always enabled | Smart conditional |
| Connection | Implicit | Explicit flow |

## 🔧 Customization

### Change Host/API defaults
```typescript
// app.component.ts
hostUrl = 'http://your-host:8080';
apiKey = 'your-default-key';
```

### Adjust sidebar width
```scss
// app.component.scss
.sidebar {
  width: 400px; // Change from 320px
}
```

## 📚 Learn More

- [Library API Documentation](../projects/ngx-open-web-ui-chat/API.md)
- [Angular 2025 Architecture](../ANGULAR_2025_ARCHITECTURE.md)
- [Changelog](../docs/CHANGELOG.md)

---

**Built with** Angular 2025 + Signals + Zoneless 🚀

