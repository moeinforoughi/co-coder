import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sessionManager from './sessionManager.js';

const app = express();
const httpServer = createServer(app);

// Rate limiting map to prevent abuse
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;

// Rate limiting middleware
function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const record = rateLimitMap.get(ip);

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
    }

    record.count++;
    next();
}

// CORS configuration
app.use(cors());
app.use(express.json());
app.use(rateLimit);

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('../client/dist'));
}

// API Routes
app.get('/health', (req, res) => {
    const activeConnections = io.sockets.sockets.size;
    const activeSessions = sessionManager.sessions.size;

    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        connections: activeConnections,
        sessions: activeSessions,
        memory: process.memoryUsage(),
        version: '1.0.0'
    });
});

app.post('/api/session', (req, res) => {
    try {
        const sessionId = sessionManager.createSession();
        res.json({
            sessionId,
            url: `${req.protocol}://${req.get('host')}/session/${sessionId}`
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

app.get('/api/session/:id', (req, res) => {
    try {
        const session = sessionManager.getSession(req.params.id);
        if (session) {
            res.json({
                sessionId: session.id,
                exists: true,
                participants: session.participants.length,
                language: session.language,
                createdAt: session.createdAt
            });
        } else {
            res.status(404).json({ exists: false, error: 'Session not found' });
        }
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// Catch-all for SPA in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile('index.html', { root: '../client/dist' });
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-session', ({ sessionId, username }) => {
        try {
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
        } catch (error) {
            console.error('Error joining session:', error);
            socket.emit('error', { message: 'Failed to join session' });
        }
    });

    socket.on('code-change', ({ sessionId, code, language }) => {
        try {
            const session = sessionManager.getSession(sessionId);

            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            // Update session code
            sessionManager.updateSessionCode(sessionId, code, language);

            // Broadcast to all clients in the session except sender
            socket.to(sessionId).emit('code-update', { code, language });
        } catch (error) {
            console.error('Error updating code:', error);
            socket.emit('error', { message: 'Failed to update code' });
        }
    });

    socket.on('language-change', ({ sessionId, language }) => {
        try {
            const session = sessionManager.getSession(sessionId);

            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            // Update language
            session.language = language;

            // Broadcast to all clients in the session
            io.to(sessionId).emit('language-update', { language });
        } catch (error) {
            console.error('Error updating language:', error);
            socket.emit('error', { message: 'Failed to update language' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        try {
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
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const PORT = process.env.PORT || 3000;

// Only start server if not imported for testing
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║       CO-CODER SERVER RUNNING         ║
║                                       ║
║  Port: ${PORT.toString().padEnd(28)}  ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)} ║
║                                       ║
╚═══════════════════════════════════════╝
    `);
    });
}

// Clean up old sessions periodically (every hour)
if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
        sessionManager.cleanupOldSessions();
    }, 60 * 60 * 1000);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Export for testing
export { app, httpServer, io };
