import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { useSocket } from '../hooks/useSocket'
import { executeCode } from '../utils/codeExecutor'

function CodingSession() {
    const { sessionId } = useParams()
    const navigate = useNavigate()
    const [code, setCode] = useState('// Write your code here\n')
    const [language, setLanguage] = useState('javascript')
    const [output, setOutput] = useState('')
    const [executing, setExecuting] = useState(false)
    const [participants, setParticipants] = useState([])
    const [username] = useState(() => `User${Math.floor(Math.random() * 1000)}`)
    const { socket, connected } = useSocket(sessionId, username)
    const isRemoteUpdate = useRef(false)

    useEffect(() => {
        // Verify session exists
        fetch(`/api/session/${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.exists) {
                    alert('Session not found')
                    navigate('/')
                }
            })
            .catch(err => {
                console.error('Error checking session:', err)
            })
    }, [sessionId, navigate])

    useEffect(() => {
        if (!socket) return

        socket.on('session-state', ({ code: initialCode, language: initialLanguage, participants: initialParticipants }) => {
            isRemoteUpdate.current = true
            setCode(initialCode)
            setLanguage(initialLanguage)
            setParticipants(initialParticipants)
        })

        socket.on('code-update', ({ code: newCode, language: newLanguage }) => {
            isRemoteUpdate.current = true
            setCode(newCode)
            if (newLanguage) {
                setLanguage(newLanguage)
            }
        })

        socket.on('language-update', ({ language: newLanguage }) => {
            setLanguage(newLanguage)
        })

        socket.on('user-joined', ({ username: newUsername, participants: updatedParticipants }) => {
            setParticipants(updatedParticipants)
            setOutput(prev => prev + `\n✓ ${newUsername} joined the session`)
        })

        socket.on('user-left', ({ participants: updatedParticipants }) => {
            setParticipants(updatedParticipants)
            setOutput(prev => prev + `\n✗ A user left the session`)
        })

        return () => {
            socket.off('session-state')
            socket.off('code-update')
            socket.off('language-update')
            socket.off('user-joined')
            socket.off('user-left')
        }
    }, [socket])

    const handleCodeChange = (value) => {
        setCode(value)

        if (!isRemoteUpdate.current && socket && connected) {
            socket.emit('code-change', { sessionId, code: value, language })
        }
        isRemoteUpdate.current = false
    }

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value
        setLanguage(newLanguage)

        if (socket && connected) {
            socket.emit('language-change', { sessionId, language: newLanguage })
            socket.emit('code-change', { sessionId, code, language: newLanguage })
        }
    }

    const handleRunCode = async () => {
        setExecuting(true)
        setOutput('Executing...')

        try {
            const result = await executeCode(code, language)
            setOutput(result.output)
        } catch (error) {
            setOutput(`Error: ${error.message}`)
        } finally {
            setExecuting(false)
        }
    }

    const getLanguageExtension = () => {
        switch (language) {
            case 'python':
                return python()
            case 'javascript':
            default:
                return javascript()
        }
    }

    const copySessionLink = () => {
        const link = window.location.href
        navigator.clipboard.writeText(link)
        alert('Session link copied to clipboard!')
    }

    return (
        <div className="fade-in">
            <div className="header">
                <div className="logo">&lt;CO-CODER/&gt;</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{
                        color: connected ? 'var(--cyber-neon-green)' : 'var(--cyber-neon-pink)',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        textShadow: connected ? 'var(--glow-green)' : 'var(--glow-pink)'
                    }}>
                        {connected ? '● CONNECTED' : '● DISCONNECTED'}
                    </span>
                    <button className="btn-secondary" onClick={copySessionLink}>
                        📋 Copy
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/')}>
                        ← Exit
                    </button>
                </div>
            </div>

            <div className="editor-container">
                <div className="editor-main">
                    <div className="editor-toolbar">
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            style={{ width: 'auto', minWidth: '150px' }}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                        </select>

                        <button
                            className="btn-success"
                            onClick={handleRunCode}
                            disabled={executing}
                        >
                            {executing ? (
                                <>
                                    <span className="spinner"></span>
                                    Running...
                                </>
                            ) : (
                                '▶ Run Code'
                            )}
                        </button>

                        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Session: <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                {sessionId.substring(0, 8)}...
                            </span>
                        </div>
                    </div>

                    <div className="editor-wrapper">
                        <CodeMirror
                            value={code}
                            height="100%"
                            theme="dark"
                            extensions={[getLanguageExtension()]}
                            onChange={handleCodeChange}
                        />
                    </div>

                    {output && (
                        <div className={`output-panel ${output.includes('Error') ? 'error' : 'success'}`}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Output:</div>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
                        </div>
                    )}
                </div>

                <div className="sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-title">Participants ({participants.length})</div>
                        <div className="participant-list">
                            {participants.map((participant, index) => (
                                <div key={participant.socketId} className="participant-item">
                                    <div className="participant-avatar">
                                        {participant.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="participant-name">{participant.username}</div>
                                    <div className="status-indicator"></div>
                                </div>
                            ))}
                            {participants.length === 0 && (
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                                    No participants yet
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-title">Tips</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            <p>💡 Changes sync in real-time</p>
                            <p>🔄 Switch languages anytime</p>
                            <p>⚡ Code runs in your browser</p>
                            <p>🔗 Share the link to invite others</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CodingSession
