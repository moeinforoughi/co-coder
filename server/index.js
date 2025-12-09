import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sessionManager from './sessionManager.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors());
app.use(express.json());

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('../client/dist'));
}

// API Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/session', (req, res) => {
    const sessionId = sessionManager.createSession();
    res.json({
        sessionId,
        url: `${req.protocol}://${req.get('host')}/session/${sessionId}`
    });
});

app.get('/api/session/:id', (req, res) => {
    const session = sessionManager.getSession(req.params.id);
    if (session) {
        res.json({
            sessionId: session.id,
            exists: true,
            participants: session.participants.length
        });
    } else {
        res.status(404).json({ exists: false, error: 'Session not found' });
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-session', ({ sessionId, username }) => {
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }

        // Join the room
        socket.join(sessionId);

        // Add participant
        sessionManager.addParticipant(sessionId, socket.id, username || 'Anonymous');

        // Send current session state to the new user
        socket.emit('session-state', {
            code: session.code,
            language: session.language,
            participants: sessionManager.getParticipants(sessionId)
        });

        // Notify others about new participant
        socket.to(sessionId).emit('user-joined', {
            socketId: socket.id,
            username: username || 'Anonymous',
            participants: sessionManager.getParticipants(sessionId)
        });

        console.log(`User ${username || 'Anonymous'} joined session ${sessionId}`);
    });

    socket.on('code-change', ({ sessionId, code, language }) => {
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }

        // Update session code
        sessionManager.updateSessionCode(sessionId, code, language);

        // Broadcast to all clients in the session except sender
        socket.to(sessionId).emit('code-update', { code, language });
    });

    socket.on('language-change', ({ sessionId, language }) => {
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }

        // Update language
        session.language = language;

        // Broadcast to all clients in the session
        io.to(sessionId).emit('language-update', { language });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Remove participant from all sessions
        for (const [sessionId, session] of sessionManager.sessions.entries()) {
            const wasParticipant = session.participants.some(p => p.socketId === socket.id);

            if (wasParticipant) {
                sessionManager.removeParticipant(sessionId, socket.id);

                // Notify others
                io.to(sessionId).emit('user-left', {
                    socketId: socket.id,
                    participants: sessionManager.getParticipants(sessionId)
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for testing
export { app, httpServer, io };
