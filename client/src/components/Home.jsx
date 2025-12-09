import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
    const [sessionLink, setSessionLink] = useState('')
    const [joinSessionId, setJoinSessionId] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const createSession = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await response.json()

            const fullUrl = `${window.location.origin}/session/${data.sessionId}`
            setSessionLink(fullUrl)

            // Auto-navigate to session after a brief delay
            setTimeout(() => {
                navigate(`/session/${data.sessionId}`)
            }, 1000)
        } catch (error) {
            console.error('Error creating session:', error)
            alert('Failed to create session. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const joinSession = () => {
        if (joinSessionId.trim()) {
            navigate(`/session/${joinSessionId.trim()}`)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sessionLink)
        alert('Link copied to clipboard!')
    }

    return (
        <div className="home-container fade-in">
            <div className="home-content">
                <h1 className="home-title">Co-Coder</h1>
                <p className="home-subtitle">
                    Collaborative coding interviews made simple
                </p>

                <div className="home-actions">
                    <button
                        className="btn-primary"
                        onClick={createSession}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Creating Session...
                            </>
                        ) : (
                            '+ Create New Session'
                        )}
                    </button>

                    {sessionLink && (
                        <div className="link-display slide-in">
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Share this link:
                            </div>
                            <div style={{ marginBottom: '1rem' }}>{sessionLink}</div>
                            <button className="btn-secondary" onClick={copyToClipboard}>
                                📋 Copy Link
                            </button>
                        </div>
                    )}

                    <div className="divider">OR</div>

                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Enter session ID"
                            value={joinSessionId}
                            onChange={(e) => setJoinSessionId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && joinSession()}
                        />
                        <button className="btn-secondary" onClick={joinSession}>
                            Join
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <p>✨ Real-time collaboration</p>
                    <p>🎨 Syntax highlighting for JavaScript & Python</p>
                    <p>▶️ Execute code in the browser</p>
                </div>
            </div>
        </div>
    )
}

export default Home
