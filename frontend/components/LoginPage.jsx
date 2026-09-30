'use client'

import { useEffect, useState } from 'react'

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
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isLight = theme === 'light'
  const [accountType, setAccountType] = useState('individual')
  const [organizationLogin, setOrganizationLogin] = useState('')
  const [loginAccounts, setLoginAccounts] = useState([])
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [selectedLoginUsername, setSelectedLoginUsername] = useState('')
  const isOrganization = accountType === 'organization'

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')

    if (token) {
      setResetToken(token)
      setMode('reset')
      setError('')
      setSuccess('')
      setPassword('')
      setConfirmPassword('')
    }
  }, [])

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Please enter email and password.')
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
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Login failed')
      }

      if (data.requires_account_selection) {
        setLoginAccounts(data.accounts || [])
        setSelectedLoginUsername('')
        setShowAccountSelection(true)
        return
      }

      onLogin(data.access_token, email.trim())
    } catch (err) {
      console.error(err)
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLoginAccount = async () => {
    if (!selectedLoginUsername) {
      setError('Please select an account.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/auth/select-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          username: selectedLoginUsername,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Unable to select account')
      }

      setShowAccountSelection(false)
      setLoginAccounts([])
      setSelectedLoginUsername('')

      onLogin(data.access_token, email.trim())
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to select account.')
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

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Unable to send reset link')
      }

      setSuccess(data?.message || 'If an account with that email exists, a password reset link has been sent.')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!resetToken) {
      setError('This password reset link is invalid or incomplete.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: password,
          confirm_password: confirmPassword,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Unable to reset password.')
      }

      setSuccess('Password reset successfully. You can now sign in with your new password.')
      setPassword('')
      setConfirmPassword('')
      setResetToken('')
      setMode('login')
      window.history.replaceState({}, '', '/')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to reset password.')
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

    if (isOrganization && !organizationLogin.trim()) {
      setError("Please enter the organization name.")
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
      const res = await fetch(
        isOrganization
          ? "/api/v1/auth/organization-signup"
          : "/api/v1/auth/signup",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          ...(isOrganization
            ? { organization_name: organizationLogin.trim() }
            : {}),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Signup failed")
      }

      setSuccess(
        data?.message ||
        (
          isOrganization
            ? "Organization account created successfully. You can now sign in."
            : "Account created successfully. You can now sign in."
        )
      )
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
          <p>
            {isReset
              ? "Set a new password for your account."
              : isForgot
                ? "Reset your password securely."
                : isSignup
                  ? "Create your account to access the knowledge workspace."
                  : "Sign in to access the knowledge workspace."}
          </p>
        </div>

        <form
          onSubmit={
            isReset
              ? handleResetPassword
              : isForgot
                ? handleForgotPassword
                : isSignup
                  ? handleSignup
                  : handleLogin
          }
          className="login-form"
        >
          {isSignup && !isForgot && !isReset && (
            <div className="account-type-control">
              <div className="account-type-label">Account Type</div>
              <div className="account-type-switch">
                <button
                  type="button"
                  className={`account-type-option${accountType === "individual" ? " active" : ""}`}
                  onClick={() => {
                    setAccountType("individual")
                    setOrganizationLogin("")
                    setError("")
                  }}
                  disabled={loading}
                >
                  Individual
                </button>
                <button
                  type="button"
                  className={`account-type-option${accountType === "organization" ? " active" : ""}`}
                  onClick={() => {
                    setAccountType("organization")
                    setError("")
                  }}
                  disabled={loading}
                >
                  Organization
                </button>
              </div>
            </div>
          )}

          {isSignup && isOrganization && !isForgot && !isReset && (
            <>
              <label htmlFor="organization-login">Organization Name</label>
              <input
                id="organization-login"
                type="text"
                value={organizationLogin}
                onChange={(e) => setOrganizationLogin(e.target.value)}
                placeholder="Enter organization name"
                autoComplete="organization"
                disabled={loading}
              />
            </>
          )}
          {!isForgot && !isReset && (
            <>
              {isSignup ? (
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
              ) : (
                <>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    autoComplete="email"
                    disabled={loading}
                  />
                </>
              )}
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

              {(isSignup || isReset) && (
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


          {!isForgot && !isSignup && !isReset && (
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
              isReset ? "Reset Password" : isForgot ? "Send Reset Link" : isSignup ? "Create Account" : "Sign In"
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

        {showAccountSelection && !isSignup && !isForgot && !isReset && (
          <div className="login-account-notification" role="dialog" aria-modal="false">
            <div className="login-account-notification-header">
              <div>
                <div className="login-account-notification-title">
                  Choose an account
                </div>
                <div className="login-account-notification-subtitle">
                  Multiple accounts use this email
                </div>
              </div>

              <button
                type="button"
                className="login-account-notification-close"
                onClick={() => {
                  setShowAccountSelection(false)
                  setLoginAccounts([])
                  setSelectedLoginUsername('')
                  setError('')
                }}
                disabled={loading}
                aria-label="Close account selection"
              >
                ×
              </button>
            </div>

            <div className="login-account-notification-options">
              {loginAccounts.map((account) => (
                <label
                  key={account.username}
                  className={`login-account-notification-option${
                    selectedLoginUsername === account.username ? " selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="login-account"
                    value={account.username}
                    checked={selectedLoginUsername === account.username}
                    onChange={() => {
                      setSelectedLoginUsername(account.username)
                      setError('')
                    }}
                    disabled={loading}
                  />

                  <span className="login-account-notification-radio" />

                  <span className="login-account-notification-content">
                    <strong>{account.username}</strong>

                    {account.organization_names?.length > 0 && (
                      <small>
                        {account.organization_names.join(', ')}
                      </small>
                    )}
                  </span>
                </label>
              ))}
            </div>

            {error && (
              <div className="login-account-notification-error">
                {error}
              </div>
            )}

            <button
              type="button"
              className="primary-button full-width"
              onClick={handleSelectLoginAccount}
              disabled={loading || !selectedLoginUsername}
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </div>
        )}

    </main>
  )
}

export default LoginPage