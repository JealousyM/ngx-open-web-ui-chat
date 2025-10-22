# Markdown Support in OpenWebUI Embedded

## Overview

The `openwebui-chat` component supports rendering Markdown content using [ngx-markdown](https://www.npmjs.com/package/ngx-markdown).

## Installation

The markdown dependencies are automatically installed with the library:

```bash
npm install ngx-open-web-ui-chat
```

Required peer dependencies:
- `ngx-markdown`: ^19.0.0
- `marked`: ^15.0.0

## Usage

### Basic Usage

Markdown is **enabled by default**. Simply use the component:

```typescript
import { Component } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <openwebui-chat
      [endpoint]="'https://your-openwebui-instance.com'"
      [modelId]="'your-model-id'"
      [apiKey]="'your-api-key'"
    ></openwebui-chat>
  `
})
export class AppComponent {}
```

### Disabling Markdown

To display plain text without markdown rendering:

```typescript
<openwebui-chat
  [endpoint]="'https://your-openwebui-instance.com'"
  [modelId]="'your-model-id'"
  [apiKey]="'your-api-key'"
  [enableMarkdown]="false"
></openwebui-chat>
```

### Explicitly Enabling Markdown

```typescript
<openwebui-chat
  [endpoint]="'https://your-openwebui-instance.com'"
  [modelId]="'your-model-id'"
  [apiKey]="'your-api-key'"
  [enableMarkdown]="true"
></openwebui-chat>
```

## Supported Markdown Features

When markdown is enabled, the following features are supported:

### Headers
```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### Emphasis
```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic*** or ___bold italic___
~~strikethrough~~
```

### Lists
```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
   1. Nested item
```

### Links
```markdown
[Link text](https://example.com)
```

### Images
```markdown
![Alt text](https://example.com/image.png)
```

### Code Blocks
```markdown
Inline `code` with backticks

\`\`\`javascript
const example = 'code block';
console.log(example);
\`\`\`
```

### Blockquotes
```markdown
> This is a blockquote
> spanning multiple lines
```

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Horizontal Rules
```markdown
---
***
___
```

## Configuration Options

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `endpoint` | `string` | *required* | OpenWebUI instance URL |
| `modelId` | `string` | *required* | Model identifier |
| `apiKey` | `string` | *required* | API key for authentication |
| `enableMarkdown` | `boolean` | `true` | Enable/disable markdown rendering |
| `debug` | `boolean` | `false` | Enable debug logging |
| `style` | `Partial<CSSStyleDeclaration>` | `undefined` | Custom CSS styles |

## Examples

### Example 1: AI Assistant with Markdown

```typescript
import { Component } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <div class="app-container">
      <h1>AI Assistant</h1>
      <openwebui-chat
        [endpoint]="'https://ai.example.com'"
        [modelId]="'llama3'"
        [apiKey]="'sk-abc123'"
        [enableMarkdown]="true"
        [debug]="true"
      ></openwebui-chat>
    </div>
  `
})
export class AppComponent {}
```

### Example 2: Plain Text Chat

```typescript
<openwebui-chat
  [endpoint]="'https://ai.example.com'"
  [modelId]="'llama3'"
  [apiKey]="'sk-abc123'"
  [enableMarkdown]="false"
></openwebui-chat>
```

### Example 3: Dynamic Markdown Toggle

```typescript
import { Component, signal } from '@angular/core';
import { OpenwebuiChatComponent } from 'openwebui-embedded';

@Component({
  standalone: true,
  imports: [OpenwebuiChatComponent],
  template: `
    <div class="app-container">
      <label>
        <input type="checkbox" [(ngModel)]="markdownEnabled" />
        Enable Markdown
      </label>
      
      <openwebui-chat
        [endpoint]="'https://ai.example.com'"
        [modelId]="'llama3'"
        [apiKey]="'sk-abc123'"
        [enableMarkdown]="markdownEnabled()"
      ></openwebui-chat>
    </div>
  `
})
export class AppComponent {
  markdownEnabled = signal(true);
}
```

## Styling Markdown Content

The component includes default styles for markdown elements. You can override them with custom CSS:

```css
::ng-deep openwebui-chat {
  /* Style markdown headers */
  h1, h2, h3 {
    color: #333;
    margin: 16px 0 8px;
  }
  
  /* Style code blocks */
  pre {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  code {
    background: #f0f0f0;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }
  
  /* Style links */
  a {
    color: #007bff;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
}
```

## Technical Details

### Implementation

The markdown rendering is implemented using:
- **ngx-markdown**: Angular wrapper for marked
- **marked**: Fast markdown parser and compiler

### Performance

- Markdown is rendered on-demand per message
- Streaming responses are rendered as markdown in real-time
- No performance impact when `enableMarkdown` is `false`

### Security

- All markdown content is sanitized by Angular's built-in DomSanitizer
- XSS protection is enabled by default
- HTML in markdown is escaped unless explicitly allowed

## Troubleshooting

### Markdown Not Rendering

1. Ensure `enableMarkdown` is set to `true` (it's the default)
2. Check that `ngx-markdown` and `marked` are installed
3. Verify your content includes valid markdown syntax

### Styling Issues

1. Use `::ng-deep` to override markdown styles
2. Check browser console for CSS conflicts
3. Ensure your global styles don't override markdown styles

### Performance Issues

1. Disable markdown for large message histories
2. Use `enableMarkdown="false"` for plain text use cases
3. Consider pagination for long conversations

## Version Compatibility

| openwebui-embedded | ngx-markdown | marked | Angular |
|-------------------|--------------|--------|---------|
| 1.0.0+ | ^19.0.0 | ^15.0.0 | ^20.0.0 |

## License

MIT

