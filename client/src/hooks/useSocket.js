import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocket(sessionId, username) {
    const [socket, setSocket] = useState(null)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        if (!sessionId) return

        const newSocket = io(window.location.origin, {
            transports: ['websocket', 'polling']
        })

        newSocket.on('connect', () => {
            console.log('Connected to server')
            setConnected(true)
            newSocket.emit('join-session', { sessionId, username })
        })

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server')
            setConnected(false)
        })

        newSocket.on('error', (error) => {
            console.error('Socket error:', error)
        })

        setSocket(newSocket)

        return () => {
            newSocket.close()
        }
    }, [sessionId, username])

    return { socket, connected }
}
