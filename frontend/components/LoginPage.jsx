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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isLight = theme === 'light'

  const handleSubmit = async (e) => {
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
          <p>Sign in to access the knowledge workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={loading}
          />

          {error && (
            <div className="login-error">
              <span>!</span>
              {error}
            </div>
          )}

          <button type="submit" className="primary-button full-width" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}

export default LoginPage