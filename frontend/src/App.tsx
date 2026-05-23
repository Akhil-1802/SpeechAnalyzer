import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Speech from "./pages/Speech"
import Typing from "./pages/Typing"
import Result from "./pages/Result"
import Auth from "./pages/Auth"
import History from "./pages/History"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/speech/:topic" element={<ProtectedRoute><Speech /></ProtectedRoute>} />
        <Route path="/typing/:topic" element={<ProtectedRoute><Typing /></ProtectedRoute>} />
        <Route path="/result/:record_id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}

export default App
