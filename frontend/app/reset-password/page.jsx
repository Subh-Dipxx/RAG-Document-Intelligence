'use client'

import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('This password reset link is invalid or incomplete.')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to reset password.')
      }

      setSuccess('Password reset successfully. You can now sign in with your new password.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Unable to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow" aria-hidden="true" />

      <div className="login-card">
        <div className="login-brand" aria-hidden="true">R</div>

        <div className="login-header">
          <h1>DocGPT</h1>
          <p>Set a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            autoComplete="new-password"
            disabled={loading || !!success}
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            autoComplete="new-password"
            disabled={loading || !!success}
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          {!success ? (
            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button full-width"
              onClick={() => {
                window.location.href = '/'
              }}
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </main>
  )
}
