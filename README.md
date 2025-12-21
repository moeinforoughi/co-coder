# Co-Coder ⚡
<img width="1917" height="940" alt="Screenshot 2025-12-09 142055" src="https://github.com/user-attachments/assets/d545519a-7eaa-48f0-ac3a-3070eb328307" />


[![CI/CD](https://github.com/yourusername/co-coder/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/co-coder/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A collaborative coding interview platform with **real-time editing**, **syntax highlighting**, and **browser-based code execution**. Features a stunning **cyber-themed UI** with neon effects and smooth animations.

## ✨ Features

⚡ **Real-time Collaboration** - Multiple users can edit code simultaneously with instant synchronization  
🎨 **Syntax Highlighting** - Advanced highlighting for JavaScript and Python using CodeMirror 6  
▶️ **Code Execution** - Run Python (via WASM) and JavaScript code safely in the browser  
🔗 **Easy Sharing** - Generate and share session links instantly  
🌌 **Cyber Theme** - Stunning cyberpunk-inspired UI with neon colors, glitch effects, and animated grid background  
🚀 **CI/CD Pipeline** - Automated testing and deployment with GitHub Actions  
🛡️ **Production Ready** - Rate limiting, error handling, health checks, and monitoring  
📦 **Docker Support** - Containerized deployment with multi-stage builds

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Express.js + Socket.IO
- **Code Editor**: CodeMirror 6
- **Syntax Highlighting**: @codemirror/lang-javascript, @codemirror/lang-python
- **Code Execution**: Pyodide (Python WASM) + sandboxed JavaScript
- **Real-time Communication**: Socket.IO WebSockets
- **Testing**: Jest (backend), Vitest (frontend)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Development

Run both client and server concurrently:

```bash
npm run dev
```

This will start:
- Frontend development server on `http://localhost:5173`
- Backend server on `http://localhost:3000`

Or run them separately:

```bash
# Run server only
npm run server

# Run client only  
npm run client
```

### Testing

**Run all tests:**

```bash
npm test
```

**Backend integration tests only:**

```bash
cd server && npm test
```

**Frontend tests only:**

```bash
cd client && npm test
```

The integration tests verify:
- Session creation and management
- WebSocket connections
- Real-time code synchronization
- Multi-user collaboration
- User join/leave notifications

## Usage

1. **Create a Session**
   - Visit the homepage
   - Click "Create New Session"
   - Copy the generated link

2. **Share with Others**
   - Send the session link to participants
   - They can join instantly

3. **Collaborate**
   - All users see code changes in real-time
   - Switch between JavaScript and Python
   - Run code to see output

4. **Execute Code**
   - Select language (JavaScript or Python)
   - Write your code
   - Click "Run Code" to execute
   - View output in the panel below

## Project Structure

```
co-coder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities (code executor)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── server/                # Express backend
│   ├── tests/            # Integration tests
│   ├── index.js          # Server entry point
│   ├── sessionManager.js # Session management
│   └── package.json
│
└── package.json          # Root package.json with scripts
```

## Building for Production

```bash
# Build the frontend
npm run build

# The built files will be in client/dist/
```

## Docker

Build and run with Docker:

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

Or manually:

```bash
docker build -t co-coder .
docker run -p 3000:3000 co-coder
```

## 📊 CI/CD

Automated pipeline with GitHub Actions:
- ✅ Automated testing on push and PR
- 🐳 Docker image builds
- 🔍 Code quality checks
- 🚀 Auto-deployment ready

See [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) for details.

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions for all platforms
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Walkthrough](brain/.../walkthrough.md)** - Detailed implementation walkthrough

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

<div align="center">
  <strong>Built with ❤️ for collaborative coding interviews</strong>
</div>
