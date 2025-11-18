# OpenWebUI Chat Test Application

Modern test application for demonstrating the `ngx-open-web-ui-chat` library.

## 🎨 Features

### 1. **Dynamic Configuration**
- Real-time Host URL and API Key input
- Secure API key storage (input type="password")
- Lock changes after connection

### 2. **Smart Model Loading**
- "Show Models" button active only when Host and API Key are provided
- Automatic loading of available models list
- Loading indicator

### 3. **Progressive Connection Flow**
1. ✅ Enter Host URL and API Key
2. ✅ Load models (Show Models)
3. ✅ Select model from list
4. ✅ Connect to chat (Connect Chat)

### 4. **Conditional UI**
- **Chat available** only after model selection and connection
- **Clear Chat** active only when there are messages
- **Disconnect** to reset all settings

### 5. **Modern Layout**
- **Sidebar** (left panel): Configuration, models, controls
- **Chat Area** (right panel): Chat interface
- **Placeholder**: Beautiful user guide

### 6. **Responsive Design**
- Adaptive layout for mobile devices
- SCSS with modern features (nesting, variables)

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
- Welcome message
- Step-by-step guide
- Visual indicators

#### Chat (after connection)
- Full `openwebui-chat` component
- Real-time messaging
- Markdown support

## 🔒 Security

### API Key Protection
```typescript
<input 
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

