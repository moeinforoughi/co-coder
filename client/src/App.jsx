import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import CodingSession from './components/CodingSession'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/session/:sessionId" element={<CodingSession />} />
            </Routes>
        </Router>
    )
}

export default App
