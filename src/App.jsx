import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, signOutUser } from './firebase/auth.js'
import { getAuthorizedCustomer } from './firebase/customers.js'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SubmitTicket from './pages/SubmitTicket.jsx'
import TicketDetail from './pages/TicketDetail.jsx'

import Stella from './components/Stella.jsx'

import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const authorizedCustomer = await getAuthorizedCustomer(firebaseUser.uid)
          if (authorizedCustomer) {
            setCustomer(authorizedCustomer)
            setAuthError(null)
          } else {
            setAuthError('Your account does not have access to the LANZAR Customer Portal.')
            setCustomer(null)
          }
        } catch (error) {
          console.error('[AUTH ERROR] Error fetching customer:', error)
          setAuthError('Failed to verify account permissions.')
        }
      } else {
        setUser(null)
        setCustomer(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    await signOutUser()
    navigate('/')
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="portal-layout">
        <div className="portal-content loading-screen">
          <p>Connecting to LANZAR launching facility...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="portal-app">
      {user && customer && (
        <header className="portal-header">
          <div className="portal-brand">
            <h1>LANZAR CUSTOMER PORTAL</h1>
            <span className="org-name">{customer.customerName}</span>
          </div>
          <nav className="portal-nav">
            <button className="nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="nav-link" onClick={() => navigate('/submit')}>Submit Request</button>
            <button className="nav-button logout" onClick={handleSignOut}>Sign Out</button>
          </nav>
        </header>
      )}

      <main className="portal-layout">
        <div className="portal-content">
          <Routes>
            <Route 
              path="/" 
              element={
                !user ? <Login authError={authError} /> : 
                (customer ? <Navigate to="/dashboard" /> : <Login authError={authError} unauthorized={true} handleSignOut={handleSignOut} />)
              } 
            />
            <Route 
              path="/dashboard" 
              element={user && customer ? <Dashboard customer={customer} user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/submit" 
              element={user && customer ? <SubmitTicket customer={customer} user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/ticket/:id" 
              element={user && customer ? <TicketDetail customer={customer} /> : <Navigate to="/" />} 
            />
          </Routes>
        </div>

        {/* Stella Column for Desktop */}
        <aside className="stella-column">
           <Stella user={user} customer={customer} authError={authError} />
        </aside>
      </main>
    </div>
  )
}

export default App
