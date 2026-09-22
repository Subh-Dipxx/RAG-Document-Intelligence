'use client'

import { useState } from 'react'

function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.5 13.2A6.6 6.6 0 0 1 10.8 4.8 7 7 0 1 0 19.2 13.8a6.5 6.5 0 0 1-2.7-.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function LoginPage({ onLogin, theme = 'dark', onToggleTheme }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isLight = theme === 'light'
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username.trim() || !password) {
      setError('Please enter username and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Login failed')
      }

      onLogin(data.access_token, username.trim())
    } catch (err) {
      console.error(err)
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()

    if (!forgotEmail.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to send reset link')
      }

      setSuccess(data?.message || 'If an account with that email exists, a password reset link has been sent.')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || "Signup failed")
      }

      setSuccess("Account created successfully. You can now sign in.")
      setMode("login")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error(err)
      setError(err.message || "Signup failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow" aria-hidden="true" />

      {typeof onToggleTheme === 'function' && (
        <button
          type="button"
          className="theme-toggle login-theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={isLight}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className={`theme-toggle-knob ${isLight ? 'is-light' : ''}`}>
            {isLight ? <IconSun /> : <IconMoon />}
          </span>
          <span className="theme-toggle-label">{isLight ? 'Light' : 'Dark'}</span>
        </button>
      )}

      <div className="login-card">
        <div className="login-brand" aria-hidden="true">R</div>
        <div className="login-header">
          
          <h1>DocGPT</h1>
          <p>{isForgot ? "Reset your password securely." : isSignup ? "Create your account to access the knowledge workspace." : "Sign in to access the knowledge workspace."}</p>
        </div>

        <form onSubmit={isForgot ? handleForgotPassword : isSignup ? handleSignup : handleLogin} className="login-form">
          {!isForgot && (
            <>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                disabled={loading}
              />
            </>
          )}

          {isSignup && (
            <>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                autoComplete="email"
                disabled={loading}
              />
            </>
          )}

          {isForgot ? (
            <>
              <label htmlFor="forgotEmail">Email</label>
              <input
                id="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                disabled={loading}
              />
            </>
          ) : (
            <>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                disabled={loading}
              />

              {isSignup && (
                <>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </>
              )}
            </>
          )}

          {!isForgot && !isSignup && (
            <button
              type="button"
              className="login-mode-link login-forgot-link"
              onClick={() => switchMode("forgot")}
              disabled={loading}
            >
              Forgot Password?
            </button>
          )}

          {error && (
            <div className="login-error">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          <button type="submit" className="primary-button full-width" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                {isForgot ? "Sending reset link..." : isSignup ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              isForgot ? "Send Reset Link" : isSignup ? "Create Account" : "Sign In"
            )}
          </button>

          <div className="login-mode-switch">
            {isForgot ? (
              <>
                Remember your password?
                <button
                  type="button"
                  className="login-mode-link"
                  onClick={() => switchMode("login")}
                  disabled={loading}
                >
                  Sign In
                </button>
              </>
            ) : isSignup ? (
              <>
                Already have an account?
                <button
                  type="button"
                  className="login-mode-link"
                  onClick={() => switchMode("login")}
                  disabled={loading}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?
                <button
                  type="button"
                  className="login-mode-link"
                  onClick={() => switchMode("signup")}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

export default LoginPage