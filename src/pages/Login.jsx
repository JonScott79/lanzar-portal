import { useState } from 'react'
import { signInWithEmail, sendPasswordReset } from '../firebase/auth.js'
import './Login.css'

export default function Login({ authError: globalAuthError, unauthorized, handleSignOut }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [resetMode, setResetMode] = useState(false)

  const error = localError || globalAuthError

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    setSuccessMsg(null)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      let message = 'Incorrect email or password.'
      if (err.code === 'auth/invalid-email') message = 'Please enter a valid email address.'
      if (err.code === 'auth/too-many-requests') message = 'Account temporarily disabled due to too many failed attempts.'
      setLocalError(message)
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    try {
      await sendPasswordReset(email)
      setSuccessMsg('A password reset link has been sent to your email.')
      setEmail('')
    } catch (err) {
      setLocalError('Failed to send reset email. Please verify your email address.')
    } finally {
      setLoading(false)
    }
  }

  if (unauthorized) {
    return (
      <div className="login-panel">
        <h2 className="login-title">ACCESS DENIED</h2>
        <p className="login-desc">You do not have customer access to this portal.</p>
        {error && <p className="error-msg">{error}</p>}
        <button className="primary-btn" onClick={handleSignOut}>SIGN OUT</button>
      </div>
    )
  }

  return (
    <div className="login-panel">
      <h2 className="login-title">{resetMode ? 'RESET PASSWORD' : 'CUSTOMER LOGIN'}</h2>
      <p className="login-desc">
        {resetMode 
          ? 'Enter your email address to receive a password reset link.' 
          : 'Sign in with your LANZAR credentials to manage your support requests.'}
      </p>

      <form onSubmit={resetMode ? handleReset : handleLogin} className="login-form">
        <div className="form-group">
          <label>EMAIL ADDRESS</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="e.g. customer@example.com"
            required 
            disabled={loading}
          />
        </div>

        {!resetMode && (
          <div className="form-group">
            <div className="label-row">
              <label>PASSWORD</label>
              <button type="button" className="text-link" onClick={() => setResetMode(true)}>Forgot?</button>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
              disabled={loading}
            />
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        <div className="form-actions">
          {resetMode && (
            <button type="button" className="text-link" onClick={() => setResetMode(false)} disabled={loading}>
              &larr; Back to Login
            </button>
          )}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'PROCESSING...' : (resetMode ? 'SEND LINK' : 'SIGN IN')}
          </button>
        </div>
      </form>
    </div>
  )
}
