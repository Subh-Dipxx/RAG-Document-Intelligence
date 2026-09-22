'use client'

import { useEffect } from 'react'

export default function ResetPasswordRedirect() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')

    if (!token) {
      window.location.replace('/')
      return
    }

    window.location.replace('/?reset_token=' + encodeURIComponent(token))
  }, [])

  return null
}
