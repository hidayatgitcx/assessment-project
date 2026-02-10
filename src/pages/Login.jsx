import { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard.jsx'
import './Login.css'

const MODES = {
  signin: 'signin',
  signup: 'signup',
  forgot: 'forgot',
  reset: 'reset',
}

function Login() {
  const [mode, setMode] = useState(MODES.signin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const clearStatus = () => {
    setMessage('')
    setError('')
  }

  const handleSignin = async (event) => {
    event.preventDefault()
    clearStatus()
    setBusy(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Signin failed.')
        return
      }

      setUser(data.user)
      setPassword('')
    } catch (err) {
      setError('Signin failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    clearStatus()
    setBusy(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Signup failed.')
        return
      }

      setUser(data.user)
      setPassword('')
    } catch (err) {
      setError('Signup failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignout = async () => {
    clearStatus()
    setBusy(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
      setUser(null)
      setMode(MODES.signin)
    } finally {
      setBusy(false)
    }
  }

  const handleForgot = async (event) => {
    event.preventDefault()
    clearStatus()
    setBusy(true)

    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Request failed.')
        return
      }

      if (data.resetToken) {
        setResetToken(data.resetToken)
        setMessage('Reset token created. Paste it below.')
        setMode(MODES.reset)
      } else {
        setMessage('If that account exists, a reset token was created.')
      }
    } catch (err) {
      setError('Request failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    clearStatus()
    setBusy(true)

    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Reset failed.')
        return
      }

      setMessage('Password reset. You can now sign in.')
      setMode(MODES.signin)
      setNewPassword('')
      setResetToken('')
    } catch (err) {
      setError('Reset failed.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1 className="login-title">Checking session...</h1>
        </div>
      </main>
    )
  }

  if (user) {
    return <Dashboard user={user} onSignout={handleSignout} />
  }

  let title = 'Sign in'
  if (mode === MODES.signup) title = 'Create account'
  if (mode === MODES.forgot) title = 'Forgot password'
  if (mode === MODES.reset) title = 'Reset password'

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="auth-switch">
          <button
            type="button"
            className={mode === MODES.signin ? 'pill active' : 'pill'}
            onClick={() => setMode(MODES.signin)}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === MODES.signup ? 'pill active' : 'pill'}
            onClick={() => setMode(MODES.signup)}
          >
            Sign up
          </button>
          <button
            type="button"
            className={mode === MODES.forgot ? 'pill active' : 'pill'}
            onClick={() => setMode(MODES.forgot)}
          >
            Forgot
          </button>
        </div>

        <h1 className="login-title">{title}</h1>
        {message ? <p className="status success">{message}</p> : null}
        {error ? <p className="status error">{error}</p> : null}

        {mode === MODES.forgot && (
          <form className="login-form" onSubmit={handleForgot}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <div className="login-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                Send reset token
              </button>
              <button type="button" className="btn ghost" onClick={() => setMode(MODES.signin)}>
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {mode === MODES.reset && (
          <form className="login-form" onSubmit={handleReset}>
            <label className="login-field">
              <span>Reset token</span>
              <input
                type="text"
                name="token"
                placeholder="paste token"
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
              />
            </label>
            <label className="login-field">
              <span>New password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <div className="login-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                Reset password
              </button>
              <button type="button" className="btn ghost" onClick={() => setMode(MODES.signin)}>
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {mode === MODES.signin && (
          <form className="login-form" onSubmit={handleSignin}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="login-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                Sign in
              </button>
              <button type="button" className="btn ghost" onClick={() => setMode(MODES.signup)}>
                Create account
              </button>
            </div>
          </form>
        )}

        {mode === MODES.signup && (
          <form className="login-form" onSubmit={handleSignup}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="login-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                Sign up
              </button>
              <button type="button" className="btn ghost" onClick={() => setMode(MODES.signin)}>
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export default Login
