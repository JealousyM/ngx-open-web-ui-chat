# Contributing to OpenWebUI TypeScript Embedded SDK

Thank you for your interest in contributing! We welcome contributions from the community. This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js >= 20.19.0
- npm or yarn
- Git
- Angular CLI (optional, but recommended)

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ngx-open-web-ui-chat.git
   cd ngx-open-web-ui-chat
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/jealousym/ngx-open-web-ui-chat.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Install library dependencies**
   ```bash
   cd projects/ngx-open-web-ui-chat
   npm install
   ```

6. **Install test app dependencies**
   ```bash
   cd test-app
   npm install
   ```

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/your-bug-fix-name
```

Use descriptive branch names:
- `feature/add-voice-input` ✅
- `fix/streaming-response-bug` ✅
- `docs/update-api-reference` ✅
- `f1` ❌

### Making Changes

#### Library Code

The main library code is located in `projects/ngx-open-web-ui-chat/src/lib/`:

```
src/lib/
├── components/          # UI components
├── services/           # API and business logic
├── models/             # TypeScript interfaces and types
└── i18n/              # Internationalization
```

**File Structure Guidelines:**
- Use separate `.ts`, `.html`, and `.scss` files for components
- Keep components focused and single-responsibility
- Use TypeScript strict mode
- Follow Angular style guide

#### Example Component Structure

```typescript
// my-component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.scss'],
  standalone: true
})
export class MyComponent {
  isLoading = signal(false);
  
  // Component logic
}
```

### Testing Your Changes

#### Build the Library

```bash
cd projects/ngx-open-web-ui-chat
npm run build
```

#### Run the Test Application

```bash
cd test-app
npm start
```

Visit `http://localhost:4200` to see your changes in action.

#### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile
- [ ] Markdown rendering works correctly
- [ ] Conversation history is maintained
- [ ] Error handling works properly
- [ ] Multi-language support (if applicable)

## Code Style and Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Sends a message to the chat
 * @param message - The message content
 * @returns Promise that resolves when message is sent
 */
public sendMessage(message: string): Promise<void> {
  // Implementation
}
```

### Angular Best Practices

- Use standalone components
- Use signals for state management
- Avoid RxJS where async/await is sufficient
- Use dependency injection with `inject()`
- Follow the Angular style guide

### SCSS

- Use nesting for related selectors
- Use variables for colors and spacing
- Keep specificity low
- Use BEM naming convention for classes

```scss
.chat-container {
  display: flex;
  
  &__header {
    padding: 1rem;
  }
  
  &__message {
    margin-bottom: 0.5rem;
  }
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ChatMessage`)
- **Services**: PascalCase with "Service" suffix (e.g., `OpenwebuiApiService`)
- **Files**: kebab-case (e.g., `chat-message.component.ts`)
- **CSS Classes**: kebab-case (e.g., `.chat-message`)
- **Variables/Functions**: camelCase (e.g., `sendMessage()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)

## Commit Guidelines

### Commit Message Format

Use clear, descriptive commit messages following this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

### Examples

```
feat(chat-input): add character count display

Add a character counter to the chat input field that shows
the current character count and maximum limit.

Closes #123
```

```
fix(streaming): handle connection timeout gracefully

Implement proper error handling for streaming connection
timeouts and display user-friendly error message.

Fixes #456
```

```
docs: update API reference for sendMessage method
```

## Pull Request Process

### Before Submitting

1. **Update your branch with latest changes**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run the build**
   ```bash
   cd projects/ngx-open-web-ui-chat
   npm run build
   ```

3. **Test thoroughly**
   - Run the test app
   - Test on different browsers
   - Test on mobile devices
   - Verify no console errors

4. **Check for linting issues**
   ```bash
   npm run lint  # if available
   ```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Use a clear, descriptive title
   - Reference related issues (e.g., "Closes #123")
   - Provide a detailed description of changes
   - Include screenshots for UI changes

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes
```

### PR Review Process

- At least one maintainer review required
- Address feedback and push updates
- Keep conversation professional and constructive
- Rebase and force-push if requested

## Reporting Issues

### Bug Reports

Include the following information:

```markdown
## Description
Clear description of the bug.

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Angular Version: 20.x
- Library Version: 1.0.7

## Screenshots
[Add screenshots if applicable]
```

### Feature Requests

```markdown
## Description
Clear description of the requested feature.

## Use Case
Why this feature is needed.

## Proposed Solution
How you envision this feature working.

## Alternatives Considered
Other approaches you've considered.
```

## Documentation

### Updating Documentation

- Update relevant `.md` files in the `docs/` directory
- Update README.md if adding new features
- Add JSDoc comments to public APIs
- Include examples for new features

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date with code changes

## Project Structure

```
ngx-open-web-ui-chat/
├── projects/
│   └── ngx-open-web-ui-chat/
│       ├── src/lib/
│       │   ├── components/
│       │   ├── services/
│       │   ├── models/
│       │   └── i18n/
│       └── dist/
├── test-app/
├── docs/
├── README.md
├── CONTRIBUTING.md
└── package.json
```

## Common Tasks

### Adding a New Component

1. Create component directory: `src/lib/components/my-component/`
2. Create files:
   - `my-component.ts` (component logic)
   - `my-component.html` (template)
   - `my-component.scss` (styles)
3. Export from `src/public-api.ts`
4. Add to test app for manual testing
5. Update documentation

### Adding a New Language

1. Add translations to `src/lib/i18n/translations.ts`
2. Update language list in README.md
3. Test in test app
4. Update I18N documentation

### Updating Dependencies

1. Update `package.json`
2. Run `npm install`
3. Test thoroughly
4. Document breaking changes
5. Update CHANGELOG.md

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email perevertkinma@gmail.com
- **General Help**: Check existing issues and documentation

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub contributors page
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OpenWebUI Documentation](https://docs.openwebui.com/)
- [Project README](./README.md)
- [API Reference](./docs/API.md)

---

Thank you for contributing to make this project better! 🎉
