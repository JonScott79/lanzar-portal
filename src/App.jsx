import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, signOutUser } from './firebase/auth.js'
import { getAuthorizedCustomer } from './firebase/customers.js'
import { getAuthorizedAdmin } from './firebase/admins.js'

import Login from './pages/Login.jsx'
import CustomerApp from './CustomerApp.jsx'
import AdminApp from './admin/AdminApp.jsx'

import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setAuthError(null)
        
        try {
          // Check Admin first
          let foundAdmin = null
          try {
            foundAdmin = await getAuthorizedAdmin(firebaseUser.uid)
          } catch (e) {
            // normal customers might fail if firestore rules block /admins read
          }
          
          if (foundAdmin) {
            setAdmin(foundAdmin)
            // Admins might also have a customer record, but we prioritize Admin mode
          } else {
            setAdmin(null)
            const authorizedCustomer = await getAuthorizedCustomer(firebaseUser.uid)
            if (authorizedCustomer) {
              setCustomer(authorizedCustomer)
            } else {
              setAuthError('Your account does not have access to the LANZAR Portal.')
              setCustomer(null)
            }
          }
        } catch (error) {
          console.error('[AUTH ERROR] Error fetching user roles:', error)
          setAuthError('Failed to verify account permissions.')
        }
      } else {
        setUser(null)
        setCustomer(null)
        setAdmin(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    await signOutUser()
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <p>Connecting to LANZAR launching facility...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <div className="portal-app">
        <div className="portal-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Login authError={authError} />
        </div>
      </div>
    )
  }

  if (authError && !admin && !customer) {
    return (
      <div className="portal-app">
        <div className="portal-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Login authError={authError} unauthorized={true} handleSignOut={handleSignOut} />
        </div>
      </div>
    )
  }

  if (admin) {
    return <AdminApp admin={admin} user={user} handleSignOut={handleSignOut} />
  }

  if (customer) {
    return <CustomerApp customer={customer} user={user} handleSignOut={handleSignOut} />
  }

  return null
}

export default App
