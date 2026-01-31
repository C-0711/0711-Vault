import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'

// Context
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Pages
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Photos from './pages/Photos'
import Documents from './pages/Documents'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Import from './pages/Import'
import Calendar from './pages/Calendar'
import Assistant from './pages/Assistant'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('vault_token')
    if (token) {
      setUser({ token })
    }
    setLoading(false)
  }, [])

  const login = (token, userId) => {
    localStorage.setItem('vault_token', token)
    localStorage.setItem('vault_user_id', userId)
    setUser({ token, userId })
  }

  const logout = () => {
    localStorage.removeItem('vault_token')
    localStorage.removeItem('vault_user_id')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/photos" element={<Photos />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/import" element={<Import />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </AuthContext.Provider>
  )
}

export default App
