import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth
    const stored = localStorage.getItem('cafe_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('cafe_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // For demo, simulate API call
    await new Promise(r => setTimeout(r, 500))
    
    const mockUser = {
      id: '1',
      email,
      name: 'مدير المقهى',
      cafeId: '1',
      cafe: {
        id: '1',
        name: 'مقهى الريم',
        settings: {
          theme: 'default',
          language: 'ar'
        }
      }
    }
    
    setUser(mockUser)
    localStorage.setItem('cafe_user', JSON.stringify(mockUser))
    return mockUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cafe_user')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
