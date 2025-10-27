# OpenWebUI Chat Test Application

Современное тестовое приложение для демонстрации библиотеки `ngx-open-web-ui-chat`.

## 🎨 Features

### 1. **Dynamic Configuration**
- Ввод Host URL и API Key в реальном времени
- Безопасное хранение API ключа (input type="password")
- Блокировка изменений после подключения

### 2. **Smart Model Loading**
- Кнопка "Show Models" активна только при наличии Host и API Key
- Автоматическая загрузка списка доступных моделей
- Индикатор загрузки

### 3. **Progressive Connection Flow**
1. ✅ Ввод Host URL и API Key
2. ✅ Загрузка моделей (Show Models)
3. ✅ Выбор модели из списка
4. ✅ Подключение к чату (Connect Chat)

### 4. **Conditional UI**
- **Чат доступен** только после выбора модели и подключения
- **Clear Chat** активен только когда есть сообщения
- **Disconnect** для сброса всех настроек

### 5. **Modern Layout**
- **Sidebar** (левая панель): Конфигурация, модели, управление
- **Chat Area** (правая панель): Интерфейс чата
- **Placeholder**: Красивый гайд для пользователя

### 6. **Responsive Design**
- Адаптивная верстка для мобильных устройств
- SCSS с modern features (nesting, variables)

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
// Signals для reactive state
hostUrl = '';
apiKey = '';
models = signal<any[]>([]);
selectedModelId = signal<string>('');
chatConnected = signal<boolean>(false);
messageCount = signal<number>(0);

// Computed для условной логики
canLoadModels = computed(() => {...});
hasMessages = computed(() => {...});
```

### Component Communication
```typescript
// Event от чата → App
(messagesChanged)="onMessagesChanged($event)"

// App отслеживает количество сообщений
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
  type="password"  // Скрыт визуально
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

