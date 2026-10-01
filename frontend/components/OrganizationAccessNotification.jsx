'use client'

import { useEffect, useRef, useState } from 'react'

export default function OrganizationAccessNotification() {
  const [notification, setNotification] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const previousStatusRef = useRef(null)
  const hideTimerRef = useRef(null)
  const leaveTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const getToken = () =>
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token')

    const showNotification = (type) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }

      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
      }

      setLeaving(false)
      setNotification(type)

      hideTimerRef.current = window.setTimeout(() => {
        setLeaving(true)

        leaveTimerRef.current = window.setTimeout(() => {
          setNotification(null)
          setLeaving(false)
        }, 450)
      }, 3000)
    }

    const checkAccessStatus = async () => {
      const token = getToken()

      if (!token || cancelled) return

      try {
        const res = await fetch(
          '/api/v1/organization-members/my-organizations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!res.ok || cancelled) return

        const data = await res.json().catch(() => [])

        const organizations = Array.isArray(data)
          ? data
          : data?.organizations || []

        const tenantId = localStorage.getItem('tenant_id')

        const currentOrganization = organizations.find(
          (organization) =>
            String(organization.organization_id) === String(tenantId)
        )

        if (!currentOrganization) return

        const currentStatus = String(
          currentOrganization.access_status || ''
        ).toLowerCase()

        const previousStatus = previousStatusRef.current

        if (
          previousStatus === 'active' &&
          currentStatus === 'revoked'
        ) {
          showNotification('revoked')
        }

        previousStatusRef.current = currentStatus
      } catch (error) {
        console.error(
          'Failed to check organization access status:',
          error
        )
      }
    }

    checkAccessStatus()

    const intervalId = window.setInterval(
      checkAccessStatus,
      3000
    )

    return () => {
      cancelled = true
      window.clearInterval(intervalId)

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }

      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

  if (!notification) {
    return null
  }

  const isGranted = notification === 'granted'

  return (
    <>
      <div
        className={`organization-access-notification ${
          isGranted ? 'is-granted' : 'is-revoked'
        } ${leaving ? 'is-leaving' : 'is-visible'}`}
        role="alert"
      >
        <div className="organization-access-notification-icon">
          {isGranted ? (
            <span>✓</span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <div className="organization-access-notification-content">
          <div className="organization-access-notification-title">
            {isGranted
              ? 'Access granted by admin'
              : 'Access revoked by admin'}
          </div>

          <div className="organization-access-notification-message">
            {isGranted
              ? "You now have access to the organization's shared documents."
              : "Your access to the organization's shared documents has been revoked."}
          </div>
        </div>

        <button
          type="button"
          className="organization-access-notification-close"
          aria-label="Close notification"
          onClick={() => {
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current)
            }

            if (leaveTimerRef.current) {
              clearTimeout(leaveTimerRef.current)
            }

            setLeaving(true)

            leaveTimerRef.current = window.setTimeout(() => {
              setNotification(null)
              setLeaving(false)
            }, 450)
          }}
        >
          ×
        </button>
      </div>

      <style jsx>{`
        .organization-access-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;

          width: 380px;
          max-width: calc(100vw - 32px);

          display: flex;
          align-items: center;
          gap: 14px;

          padding: 16px 18px;

          border-radius: 14px;

          box-shadow:
            0 12px 30px rgba(15, 23, 42, 0.16);

          font-family: inherit;

          transform: translateX(calc(100% + 40px));
          opacity: 0;

          transition:
            transform 450ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 350ms ease;
        }

        .organization-access-notification.is-visible {
          transform: translateX(0);
          opacity: 1;
        }

        .organization-access-notification.is-leaving {
          transform: translateX(calc(100% + 40px));
          opacity: 0;
        }

        .organization-access-notification.is-granted {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-left: 4px solid #22c55e;
          color: #166534;
        }

        .organization-access-notification.is-revoked {
          background: linear-gradient(
            135deg,
            #fff7f7 0%,
            #fff1f2 100%
          );
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
          color: #991b1b;
        }

        .organization-access-notification-icon {
          flex: 0 0 auto;

          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
        }

        .is-granted .organization-access-notification-icon {
          background: #22c55e;
        }

        .is-revoked .organization-access-notification-icon {
          background: #ef4444;
        }

        .organization-access-notification-content {
          min-width: 0;
          flex: 1;
        }

        .organization-access-notification-title {
          font-size: 15px;
          line-height: 21px;
          font-weight: 700;
        }

        .is-granted .organization-access-notification-title {
          color: #14532d;
        }

        .is-revoked .organization-access-notification-title {
          color: #7f1d1d;
        }

        .organization-access-notification-message {
          margin-top: 3px;
          font-size: 13px;
          line-height: 19px;
          font-weight: 500;
        }

        .is-granted .organization-access-notification-message {
          color: #166534;
        }

        .is-revoked .organization-access-notification-message {
          color: #991b1b;
        }

        .organization-access-notification-close {
          flex: 0 0 auto;

          width: 28px;
          height: 28px;

          margin-top: -3px;
          margin-right: -4px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;
          border-radius: 7px;

          background: transparent;
          color: #64748b;

          font-size: 24px;
          line-height: 1;
          font-weight: 400;

          cursor: pointer;

          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .is-granted .organization-access-notification-close:hover {
          background: rgba(34, 197, 94, 0.08);
          color: #15803d;
        }

        .is-revoked .organization-access-notification-close:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
        }

        @media (max-width: 640px) {
          .organization-access-notification {
            top: 14px;
            right: 14px;
            width: calc(100vw - 28px);
          }
        }
      `}</style>
    </>
  )
}
