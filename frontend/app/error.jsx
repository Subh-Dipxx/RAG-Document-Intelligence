'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled client exception:', error)
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#a1a1aa', maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        {error?.message || 'An unexpected client-side error occurred.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '0.6rem 1.25rem',
          fontSize: '0.9rem',
          fontWeight: 500,
          color: '#ffffff',
          backgroundColor: '#7c3aed',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        Try again
      </button>
    </div>
  )
}
