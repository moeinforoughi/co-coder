import { v4 as uuidv4 } from 'uuid';

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    createSession() {
        const sessionId = uuidv4();
        this.sessions.set(sessionId, {
            id: sessionId,
            code: '// Write your code here\n',
            language: 'javascript',
            participants: [],
            createdAt: Date.now()
        });
        return sessionId;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    updateSessionCode(sessionId, code, language) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.code = code;
            if (language) {
                session.language = language;
            }
            return true;
        }
        return false;
    }

    addParticipant(sessionId, socketId, username) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants.push({ socketId, username, joinedAt: Date.now() });
            return true;
        }
        return false;
    }

    removeParticipant(sessionId, socketId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants = session.participants.filter(p => p.socketId !== socketId);
            return true;
        }
        return false;
    }

    getParticipants(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.participants : [];
    }

    // Clean up old sessions (optional - can be called periodically)
    cleanupOldSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt > maxAgeMs) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

export default new SessionManager();
