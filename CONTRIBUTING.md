# Contributing to Co-Coder

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
```bash
git clone https://github.com/yourusername/co-coder.git
cd co-coder
```

2. Install dependencies
```bash
npm run install:all
```

3. Start development servers
```bash
npm run dev
```

## Project Structure

```
co-coder/
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Documentation
└── .github/         # CI/CD workflows
```

## Making Changes

### Branch Naming

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Tests

### Commit Messages

Follow conventional commits:

```
feat: add support for TypeScript syntax highlighting
fix: resolve WebSocket reconnection issue
docs: update deployment guide
test: add tests for session management
refactor: improve code executor performance
```

## Testing

Before submitting a PR:

```bash
# Run all tests
npm test

# Run server tests only
cd server && npm test

# Run client tests only
cd client && npm test
```

## Code Style

- Use consistent formatting
- Add comments for complex logic
- Follow existing patterns
- Keep functions small and focused

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Ensure all tests pass
5. Update documentation
6. Submit PR with clear description

## Areas for Contribution

- 🎨 UI/UX improvements
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation
- 🧪 Tests
- 🌐 Internationalization
- ♿ Accessibility

## Questions?

Open an issue for discussion before major changes.
