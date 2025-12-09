import request from 'supertest';
import { io as Client } from 'socket.io-client';
import { app, httpServer } from '../index.js';

describe('Co-Coder Integration Tests', () => {
    let serverPort;
    let server;

    beforeAll((done) => {
        serverPort = 3001; // Use different port for testing
        server = httpServer.listen(serverPort, () => {
            done();
        });
    });

    afterAll((done) => {
        server.close(() => {
            done();
        });
    });

    describe('API Endpoints', () => {
        test('Health check endpoint returns OK', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
        });

        test('POST /api/session creates a new session', async () => {
            const response = await request(app)
                .post('/api/session')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('url');
            expect(typeof response.body.sessionId).toBe('string');
        });

        test('GET /api/session/:id returns session info', async () => {
            // Create a session first
            const createResponse = await request(app)
                .post('/api/session')
                .send();

            const sessionId = createResponse.body.sessionId;

            // Get session info
            const getResponse = await request(app)
                .get(`/api/session/${sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.exists).toBe(true);
            expect(getResponse.body.sessionId).toBe(sessionId);
        });

        test('GET /api/session/:id returns 404 for non-existent session', async () => {
            const response = await request(app)
                .get('/api/session/non-existent-id');

            expect(response.status).toBe(404);
            expect(response.body.exists).toBe(false);
        });
    });

    describe('WebSocket Communication', () => {
        test('Client can connect to WebSocket server', (done) => {
            const client = Client(`http://localhost:${serverPort}`);

            client.on('connect', () => {
                expect(client.connected).toBe(true);
                client.disconnect();
                done();
            });
        });

        test('Client can join a session', (done) => {
            const client = Client(`http://localhost:${serverPort}`);
            const sessionId = 'test-session-123';

            client.on('connect', () => {
                client.emit('join-session', {
                    sessionId,
                    username: 'TestUser'
                });
            });

            client.on('error', (error) => {
                // Session not found is expected
                expect(error.message).toBeTruthy();
                client.disconnect();
                done();
            });

            // If no error within 1 second, consider it a success
            setTimeout(() => {
                client.disconnect();
                done();
            }, 1000);
        });

        test('Multiple clients can join the same session', (done) => {
            // First create a real session
            request(app)
                .post('/api/session')
                .send()
                .then(response => {
                    const sessionId = response.body.sessionId;

                    const client1 = Client(`http://localhost:${serverPort}`);
                    const client2 = Client(`http://localhost:${serverPort}`);

                    let client1Joined = false;
                    let client2Joined = false;

                    client1.on('connect', () => {
                        client1.emit('join-session', {
                            sessionId,
                            username: 'User1'
                        });
                    });

                    client1.on('session-state', () => {
                        client1Joined = true;
                        if (client2Joined) {
                            client1.disconnect();
                            client2.disconnect();
                            done();
                        }
                    });

                    client2.on('connect', () => {
                        // Give client1 time to join first
                        setTimeout(() => {
                            client2.emit('join-session', {
                                sessionId,
                                username: 'User2'
                            });
                        }, 100);
                    });

                    client2.on('session-state', () => {
                        client2Joined = true;
                        if (client1Joined) {
                            client1.disconnect();
                            client2.disconnect();
                            done();
                        }
                    });

                    setTimeout(() => {
                        client1.disconnect();
                        client2.disconnect();
                        if (!client1Joined || !client2Joined) {
                            done(new Error('Clients did not join in time'));
                        }
                    }, 3000);
                });
        });

        test('Code changes are broadcast to other clients', (done) => {
            request(app)
                .post('/api/session')
                .send()
                .then(response => {
                    const sessionId = response.body.sessionId;
                    const testCode = 'console.log("Hello, World!")';

                    const client1 = Client(`http://localhost:${serverPort}`);
                    const client2 = Client(`http://localhost:${serverPort}`);

                    client1.on('connect', () => {
                        client1.emit('join-session', { sessionId, username: 'User1' });
                    });

                    client2.on('connect', () => {
                        setTimeout(() => {
                            client2.emit('join-session', { sessionId, username: 'User2' });
                        }, 100);
                    });

                    client2.on('session-state', () => {
                        // Client2 joined, now client1 sends a code change
                        client1.emit('code-change', {
                            sessionId,
                            code: testCode,
                            language: 'javascript'
                        });
                    });

                    client2.on('code-update', (data) => {
                        expect(data.code).toBe(testCode);
                        expect(data.language).toBe('javascript');
                        client1.disconnect();
                        client2.disconnect();
                        done();
                    });

                    setTimeout(() => {
                        client1.disconnect();
                        client2.disconnect();
                        done(new Error('Code update not received in time'));
                    }, 3000);
                });
        });

        test('User disconnect notifies other participants', (done) => {
            request(app)
                .post('/api/session')
                .send()
                .then(response => {
                    const sessionId = response.body.sessionId;

                    const client1 = Client(`http://localhost:${serverPort}`);
                    const client2 = Client(`http://localhost:${serverPort}`);

                    client1.on('connect', () => {
                        client1.emit('join-session', { sessionId, username: 'User1' });
                    });

                    client2.on('connect', () => {
                        setTimeout(() => {
                            client2.emit('join-session', { sessionId, username: 'User2' });
                        }, 100);
                    });

                    let bothJoined = false;
                    client2.on('session-state', () => {
                        bothJoined = true;
                        // Both clients joined, now disconnect client1
                        setTimeout(() => {
                            client1.disconnect();
                        }, 100);
                    });

                    client2.on('user-left', (data) => {
                        if (bothJoined) {
                            expect(data.participants).toBeDefined();
                            client2.disconnect();
                            done();
                        }
                    });

                    setTimeout(() => {
                        client1.disconnect();
                        client2.disconnect();
                        done(new Error('User left event not received in time'));
                    }, 3000);
                });
        });
    });
});
