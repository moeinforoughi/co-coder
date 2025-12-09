# Co-Coder 🚀

A collaborative coding interview platform with real-time editing, syntax highlighting, and browser-based code execution.

## Features

✨ **Real-time Collaboration** - Multiple users can edit code simultaneously  
🎨 **Syntax Highlighting** - Support for JavaScript and Python with CodeMirror  
▶️ **Code Execution** - Run Python and JavaScript code safely in the browser using WASM  
🔗 **Easy Sharing** - Generate shareable links for instant collaboration  
🎯 **Modern UI** - Beautiful dark mode interface with glassmorphism effects

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

## Homework Answers

### Question 1: Initial Implementation
**Prompt**: "Build a collaborative coding interview platform with React+Vite frontend and Express.js backend. Features: create/share session links, real-time collaborative editing with WebSocket, syntax highlighting for JavaScript and Python, and browser-based code execution using WASM. Use Socket.IO for real-time communication and CodeMirror for the editor."

### Question 2: Integration Tests
**Command**: `cd server && npm test`

### Question 3: Running Both Client and Server
**Command in package.json**: `"dev": "concurrently \"npm run server\" \"npm run client\""`

### Question 4: Syntax Highlighting
**Library**: CodeMirror 6 (`@uiw/react-codemirror`)

### Question 5: Code Execution
**Library**: Pyodide (Python compiled to WASM)

### Question 6: Containerization
**Base Image**: `node:18-alpine`

### Question 7: Deployment
**Service**: Render.com

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT