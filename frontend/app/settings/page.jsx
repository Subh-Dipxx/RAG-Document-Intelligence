'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [settingsSection, setSettingsSection] = useState('account')

  const [accountType, setAccountType] = useState('individual')
  const [role, setRole] = useState(null)
  const [username, setUsername] = useState('')
  const [tenantId, setTenantId] = useState(null)

  const [myOrganizations, setMyOrganizations] = useState([])
  const [loadingMyOrganizations, setLoadingMyOrganizations] = useState(false)
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState(null)
  const [organizationSwitchError, setOrganizationSwitchError] = useState('')

  const [organizationName, setOrganizationName] = useState('')
  const [newOrganizationName, setNewOrganizationName] = useState('')
  const [organizationCurrentPassword, setOrganizationCurrentPassword] = useState('')
  const [showChangeOrganization, setShowChangeOrganization] = useState(false)
  const [organizationNameSaving, setOrganizationNameSaving] = useState(false)
  const [organizationNameMessage, setOrganizationNameMessage] = useState('')
  const [organizationNameError, setOrganizationNameError] = useState('')

  const [pendingOrganizationInvitations, setPendingOrganizationInvitations] = useState([])
  const [invitationActionId, setInvitationActionId] = useState(null)
  const [invitationActionError, setInvitationActionError] = useState('')

  const [showChangeUsername, setShowChangeUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameChanging, setUsernameChanging] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameMessage, setUsernameMessage] = useState('')

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const [showAddAccount, setShowAddAccount] = useState(false)
  const [addAccountType, setAddAccountType] = useState('organization')
  const [addAccountUsername, setAddAccountUsername] = useState('')
  const [addAccountEmail, setAddAccountEmail] = useState('')
  const [addAccountPassword, setAddAccountPassword] = useState('')
  const [addAccountConfirmPassword, setAddAccountConfirmPassword] = useState('')
  const [addAccountOrganizationName, setAddAccountOrganizationName] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)
  const [addAccountError, setAddAccountError] = useState('')
  const [addAccountMessage, setAddAccountMessage] = useState('')

  const [organizationMembers, setOrganizationMembers] = useState([])
  const [loadingOrganizationMembers, setLoadingOrganizationMembers] = useState(false)
  const [showOrganizationMembers, setShowOrganizationMembers] = useState(false)
  const [organizationMemberSearch, setOrganizationMemberSearch] = useState('')
  const [organizationMemberSearchInput, setOrganizationMemberSearchInput] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [invitingMember, setInvitingMember] = useState(false)
  const [memberInviteError, setMemberInviteError] = useState('')
  const [memberInviteMessage, setMemberInviteMessage] = useState('')
  const [deletingOrganizationMemberId, setDeletingOrganizationMemberId] = useState(null)
  const [organizationMemberDeleteError, setOrganizationMemberDeleteError] = useState('')
  const [grantingOrganizationMemberId, setGrantingOrganizationMemberId] = useState(null)
  const [pendingRevokeMember, setPendingRevokeMember] = useState(null)

  const [accessRequests, setAccessRequests] = useState([])
  const [loadingAccessRequests, setLoadingAccessRequests] = useState(false)
  const [accessRequestError, setAccessRequestError] = useState('')

  const [adminOrganizations, setAdminOrganizations] = useState([])
  const [loadingAdminOrganizations, setLoadingAdminOrganizations] = useState(false)

  const [showSwitchAccounts, setShowSwitchAccounts] = useState(false)
  const [switchAccounts, setSwitchAccounts] = useState([])
  const [loadingSwitchAccounts, setLoadingSwitchAccounts] = useState(false)
  const [switchingAccountId, setSwitchingAccountId] = useState(null)
  const [switchAccountError, setSwitchAccountError] = useState('')
  const [pendingDeleteOrganization, setPendingDeleteOrganization] = useState(null)
  const [deleteOrganizationPassword, setDeleteOrganizationPassword] = useState('')
  const [deleteOrganizationPasswordVisible, setDeleteOrganizationPasswordVisible] = useState(false)
  const [deletingOrganizationId, setDeletingOrganizationId] = useState(null)
  const [deleteOrganizationError, setDeleteOrganizationError] = useState('')

  const filteredOrganizationMembers = organizationMembers.filter((member) => {
    const search = organizationMemberSearch.trim().toLowerCase()

    if (!search) {
      return true
    }

    return String(member.username || '')
      .toLowerCase()
      .includes(search)
  })

  const getToken = () =>
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token')

  const authHeaders = () => {
    const token = getToken()
    return token
      ? { Authorization: `Bearer ${token}` }
      : {}
  }

  const handleUnauthorized = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token')
    localStorage.removeItem('auth_token')
    router.push('/')
  }

  useEffect(() => {
    const storedAccountType =
      localStorage.getItem('account_type') || 'individual'
    const storedRole = localStorage.getItem('role')
    const storedUsername = localStorage.getItem('username')
    const storedTenantId = localStorage.getItem('tenant_id')

    setAccountType(storedAccountType)
    setRole(storedRole)
    setUsername(storedUsername || '')
    setTenantId(storedTenantId || null)

    if (storedAccountType === 'organization' && storedRole === 'admin') {
      setSettingsSection('organization')
    }

    fetchMyOrganizations()
    fetchOrganizationInvitations()
    fetchAdminOrganizations()
  }, [])

  useEffect(() => {
    if (accountType === 'organization' && role === 'admin') {
      if (settingsSection === 'organization') {
        fetchOrganizationMembers()
        fetchAccessRequests()
      }
    }
  }, [settingsSection, accountType, role, tenantId])

  const fetchMyOrganizations = async () => {
    const token = getToken()
    if (!token) return

    setLoadingMyOrganizations(true)

    try {
      const res = await fetch('/api/v1/organization-members/my-organizations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) return

      const data = await res.json()
      const organizations = Array.isArray(data)
        ? data
        : data?.organizations || []

      setMyOrganizations(organizations)

      const currentTenantId =
        localStorage.getItem('tenant_id') || tenantId

      const current = organizations.find(
        (organization) =>
          String(organization.organization_id) === String(currentTenantId)
      )

      if (current) {
        setTenantId(current.organization_id)
        setOrganizationName(current.organization_name || '')
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoadingMyOrganizations(false)
    }
  }

  const fetchAdminOrganizations = async () => {
    const token = getToken()
    if (!token) return

    setLoadingAdminOrganizations(true)

    try {
      const res = await fetch('/api/v1/account-management/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        setAdminOrganizations([])
        return
      }

      const data = await res.json()
      setAdminOrganizations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load administered organizations:', error)
      setAdminOrganizations([])
    } finally {
      setLoadingAdminOrganizations(false)
    }
  }

  const fetchSwitchAccounts = async () => {
    const token = getToken()
    if (!token || role !== 'admin') return

    setLoadingSwitchAccounts(true)
    setSwitchAccountError('')

    try {
      const res = await fetch('/api/v1/account-management/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (res.status === 403) {
        setSwitchAccounts([])
        setSwitchAccountError(
          'Only organization administrators can switch accounts.'
        )
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSwitchAccounts([])
        setSwitchAccountError(
          data?.detail || 'Failed to load switchable accounts.'
        )
        return
      }

      const data = await res.json()
      setSwitchAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load switchable accounts:', error)
      setSwitchAccounts([])
      setSwitchAccountError('Failed to load switchable accounts.')
    } finally {
      setLoadingSwitchAccounts(false)
    }
  }

  const openSwitchAccounts = async () => {
    if (role !== 'admin') return

    setShowSwitchAccounts(true)
    await fetchSwitchAccounts()
  }

  const switchAccount = async (organizationId) => {
    if (!organizationId || switchingAccountId) return

    const token = getToken()
    if (!token) return

    setSwitchingAccountId(organizationId)
    setSwitchAccountError('')

    try {
      const res = await fetch('/api/v1/account-management/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setSwitchAccountError(
          data?.detail || 'Failed to switch account.'
        )
        return
      }

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('username', data.username || '')
      localStorage.setItem('role', data.role || '')
      localStorage.setItem('tenant_id', data.tenant_id || '')
      localStorage.setItem('account_type', data.account_type || 'organization')

      setTenantId(data.tenant_id || '')
      setUsername(data.username || '')
      setRole(data.role || '')
      setAccountType(data.account_type || 'organization')

      setShowSwitchAccounts(false)
      setSwitchAccounts([])
      setSwitchingAccountId(null)

      window.location.reload()
    } catch (error) {
      console.error('Failed to switch account:', error)
      setSwitchAccountError('Failed to switch account.')
    } finally {
      setSwitchingAccountId(null)
    }
  }

  const switchOrganization = async (organizationId) => {
    if (!organizationId || organizationId === tenantId) return

    const token = getToken()
    if (!token) return

    setSwitchingOrganizationId(organizationId)
    setOrganizationSwitchError('')

    try {
      const res = await fetch('/api/v1/organization-members/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to switch organization.')
      }

      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('auth_token', data.access_token)
      }

      if (data?.tenant_id) {
        localStorage.setItem('tenant_id', data.tenant_id)
        setTenantId(data.tenant_id)
      }

      if (data?.role) {
        localStorage.setItem('role', data.role)
        setRole(data.role)
      }

      if (data?.account_type) {
        localStorage.setItem('account_type', data.account_type)
        setAccountType(data.account_type)
      }

      if (data?.organization_name) {
        setOrganizationName(data.organization_name)
      }

      window.location.href = '/'
    } catch (error) {
      setOrganizationSwitchError(error.message)
    } finally {
      setSwitchingOrganizationId(null)
    }
  }

  const fetchOrganizationInvitations = async () => {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch('/api/v1/organization-members/invitations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) return

      const data = await res.json()
      const invitations = Array.isArray(data)
        ? data
        : data?.invitations || []

      setPendingOrganizationInvitations(
        invitations.filter(
          (invitation) =>
            invitation.status === 'pending' ||
            invitation.status === 'PENDING'
        )
      )
    } catch (error) {
      console.error('Failed to load invitations:', error)
    }
  }

  const respondToOrganizationInvitation = async (invitationId, action) => {
    const token = getToken()
    if (!token) return

    setInvitationActionId(invitationId)
    setInvitationActionError('')

    try {
      const res = await fetch(
        `/api/v1/organization-members/invitations/${invitationId}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || `Unable to ${action} invitation.`)
      }

      if (action === 'accept') {
        if (data?.access_token) {
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('token', data.access_token)
          localStorage.setItem('auth_token', data.access_token)
        }

        if (data?.organization_id) {
          localStorage.setItem('tenant_id', data.organization_id)
          setTenantId(data.organization_id)
        }

        if (data?.role) {
          localStorage.setItem('role', data.role)
          setRole(data.role)
        }

        if (data?.account_type) {
          localStorage.setItem('account_type', data.account_type)
          setAccountType(data.account_type)
        }

        localStorage.setItem('account_type', 'organization')
      }

      await fetchOrganizationInvitations()
      await fetchMyOrganizations()

      if (action === 'accept') {
        window.location.href = '/'
      }
    } catch (error) {
      setInvitationActionError(error.message)
    } finally {
      setInvitationActionId(null)
    }
  }

  const updateOrganizationName = async (event) => {
    event.preventDefault()

    const token = getToken()
    if (!token) return

    const trimmedName = newOrganizationName.trim()

    if (!trimmedName) {
      setOrganizationNameError('Organization name is required.')
      return
    }

    setOrganizationNameSaving(true)
    setOrganizationNameError('')
    setOrganizationNameMessage('')

    try {
      const res = await fetch('/api/v1/organization-members/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: trimmedName,
          current_password: organizationCurrentPassword,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to update organization name.'
        )
      }

      setOrganizationName(trimmedName)
      setNewOrganizationName(trimmedName)
      setOrganizationCurrentPassword('')
      setShowChangeOrganization(false)
      setOrganizationNameMessage('Organization name updated successfully.')

      await fetchMyOrganizations()
      await fetchAdminOrganizations()
    } catch (error) {
      setOrganizationNameError(error.message)
    } finally {
      setOrganizationNameSaving(false)
    }
  }

  const addAccount = async (event) => {
    event.preventDefault()

    if (role !== 'admin') {
      setAddAccountError(
        'Only organization administrators can add accounts.'
      )
      return
    }

    const username = addAccountUsername.trim()
    const email = addAccountEmail.trim().toLowerCase()
    const organizationName = addAccountOrganizationName.trim()

    if (!username) {
      setAddAccountError('Username is required.')
      return
    }

    if (!email) {
      setAddAccountError('Email is required.')
      return
    }

    if (!addAccountPassword) {
      setAddAccountError('Password is required.')
      return
    }

    if (addAccountPassword !== addAccountConfirmPassword) {
      setAddAccountError('Passwords do not match.')
      return
    }

    if (addAccountType === 'organization' && !organizationName) {
      setAddAccountError(
        'Organization name is required for organization accounts.'
      )
      return
    }

    const token = getToken()
    if (!token) return

    setAddingAccount(true)
    setAddAccountError('')
    setAddAccountMessage('')

    try {
      const res = await fetch('/api/v1/account-management/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: addAccountType,
          username,
          email,
          password: addAccountPassword,
          confirm_password: addAccountConfirmPassword,
          organization_name:
            addAccountType === 'organization'
              ? organizationName
              : null,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to create the account.'
        )
      }

      setAddAccountUsername('')
      setAddAccountEmail('')
      setAddAccountPassword('')
      setAddAccountConfirmPassword('')
      setAddAccountOrganizationName('')
      setAddAccountType('organization')
      setShowAddAccount(false)
      setAddAccountMessage(
        data?.message || 'Account created successfully.'
      )
    } catch (error) {
      setAddAccountError(error.message)
    } finally {
      setAddingAccount(false)
    }
  }

  const fetchOrganizationMembers = async () => {
    const token = getToken()
    if (!token) return

    setLoadingOrganizationMembers(true)
    setOrganizationMemberDeleteError('')

    try {
      const res = await fetch('/api/v1/organization-members', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Unable to load organization members.')
      }

      const data = await res.json()
      setOrganizationMembers(
        Array.isArray(data) ? data : data?.members || []
      )
    } catch (error) {
      setOrganizationMemberDeleteError(error.message)
    } finally {
      setLoadingOrganizationMembers(false)
    }
  }

  const revokeOrganizationMemberAccess = (member) => {
    if (role !== 'admin' || accountType !== 'organization') {
      return
    }

    if (!member?.user_id) {
      return
    }

    if (member.access_status !== 'active') {
      return
    }

    setOrganizationMemberDeleteError('')
    setPendingRevokeMember(member)
  }

  const confirmRevokeOrganizationMemberAccess = async () => {
    if (!pendingRevokeMember?.user_id) {
      return
    }

    const token = getToken()
    if (!token) {
      return
    }

    const member = pendingRevokeMember

    setDeletingOrganizationMemberId(member.user_id)
    setOrganizationMemberDeleteError('')

    try {
      const res = await fetch(
        `/api/v1/organization-members/${encodeURIComponent(member.user_id)}/revoke-access`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await res.json().catch(() => null)

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          `Failed to revoke member access (${res.status})`
        )
      }

      await fetchOrganizationMembers()
      setPendingRevokeMember(null)
    } catch (err) {
      console.error('Failed to revoke organization member access:', err)
      setOrganizationMemberDeleteError(
        err.message || 'Failed to revoke member access.'
      )
    } finally {
      setDeletingOrganizationMemberId(null)
    }
  }

  const grantOrganizationMemberAccess = async (member) => {
    const token = getToken()

    if (!token || role !== 'admin' || accountType !== 'organization') {
      return
    }

    if (!member?.user_id || member.role === 'admin') {
      return
    }

    setGrantingOrganizationMemberId(member.user_id)
    setMemberInviteError('')
    setMemberInviteMessage('')

    try {
      const res = await fetch(
        `/api/v1/organization-members/${encodeURIComponent(member.user_id)}/grant-access`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to send access notification.'
        )
      }

      setOrganizationMembers((current) =>
        current.map((currentMember) =>
          currentMember.user_id === member.user_id
            ? {
                ...currentMember,
                access_status: 'pending',
              }
            : currentMember
        )
      )

      setMemberInviteMessage(
        `Access request sent to ${member.username || member.email || 'this member'}.`
      )
    } catch (error) {
      console.error('Failed to grant organization access:', error)
      setMemberInviteError(
        error?.message || 'Unable to send access notification.'
      )
    } finally {
      setGrantingOrganizationMemberId(null)
    }
  }

  const deleteOrganizationMember = async (member) => {
    if (!member?.user_id) return

    const token = getToken()
    if (!token) return

    setDeletingOrganizationMemberId(member.user_id)
    setOrganizationMemberDeleteError('')

    try {
      const res = await fetch(
        `/api/v1/organization-members/${encodeURIComponent(member.user_id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to remove member.')
      }

      await fetchOrganizationMembers()
    } catch (error) {
      setOrganizationMemberDeleteError(error.message)
    } finally {
      setDeletingOrganizationMemberId(null)
    }
  }

  const inviteOrganizationMember = async (event) => {
    event.preventDefault()

    const token = getToken()
    if (!token) return

    const email = memberEmail.trim()

    if (!email) {
      setMemberInviteError('Member email is required.')
      return
    }

    setInvitingMember(true)
    setMemberInviteError('')
    setMemberInviteMessage('')

    try {
      const res = await fetch('/api/v1/organization-members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to invite member.')
      }

      setMemberEmail('')
      setMemberInviteMessage(
        data?.message || 'Invitation sent successfully.'
      )
      await fetchOrganizationMembers()
    } catch (error) {
      setMemberInviteError(error.message)
    } finally {
      setInvitingMember(false)
    }
  }

  const fetchAccessRequests = async () => {
    const token = getToken()
    if (!token) return

    setLoadingAccessRequests(true)
    setAccessRequestError('')

    try {
      const res = await fetch('/api/v1/access-requests', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to load access requests.')
      }

      setAccessRequests(
        Array.isArray(data)
          ? data
          : data?.requests || []
      )
    } catch (error) {
      setAccessRequestError(error.message)
    } finally {
      setLoadingAccessRequests(false)
    }
  }

  const resolveAccessRequest = async (requestId, action) => {
    const token = getToken()
    if (!token || !requestId) return

    setLoadingAccessRequests(true)
    setAccessRequestError('')

    try {
      const res = await fetch(
        `/api/v1/access-requests/${encodeURIComponent(requestId)}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || `Unable to ${action} access request.`
        )
      }

      await fetchAccessRequests()
    } catch (error) {
      setAccessRequestError(error.message)
      setLoadingAccessRequests(false)
    }
  }

  const handleChangeUsername = async (event) => {
    event.preventDefault()

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token')

    if (!token) return

    setUsernameChanging(true)
    setUsernameError('')
    setUsernameMessage('')

    try {
      const response = await fetch('/api/v1/auth/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_username: newUsername.trim(),
          password: usernamePassword,
        }),
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to change username.')
      }

      const updatedUsername =
        data?.username ||
        data?.user?.username ||
        newUsername.trim()

      localStorage.setItem('username', updatedUsername)
      setUsername(updatedUsername)
      setNewUsername('')
      setUsernamePassword('')
      setShowChangeUsername(false)
      setUsernameMessage('Username changed successfully.')
    } catch (error) {
      setUsernameError(error.message)
    } finally {
      setUsernameChanging(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token')

    if (!token) return

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordChanging(true)
    setPasswordError('')
    setPasswordMessage('')

    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to change password.')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowChangePassword(false)
      setPasswordMessage('Password changed successfully.')
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordChanging(false)
    }
  }

  const openDeleteOrganization = (organization) => {
    const currentTenantId =
      localStorage.getItem('tenant_id') || tenantId

    if (organization.organization_id === currentTenantId) {
      setDeleteOrganizationError(
        'You cannot delete the organization currently active in your session. Switch to another organization first.'
      )
      return
    }

    setPendingDeleteOrganization(organization)
    setDeleteOrganizationPassword('')
    setDeleteOrganizationPasswordVisible(false)
    setDeleteOrganizationError('')
  }

  const closeDeleteOrganization = () => {
    if (deletingOrganizationId) return

    setPendingDeleteOrganization(null)
    setDeleteOrganizationPassword('')
    setDeleteOrganizationPasswordVisible(false)
    setDeleteOrganizationError('')
  }

  const deleteOrganization = async () => {
    if (!pendingDeleteOrganization?.organization_id) return

    const organizationId = pendingDeleteOrganization.organization_id
    const currentTenantId =
      localStorage.getItem('tenant_id') || tenantId

    if (organizationId === currentTenantId) {
      setDeleteOrganizationError(
        'You cannot delete the organization currently active in your session. Switch to another organization first.'
      )
      return
    }

    if (!deleteOrganizationPassword) {
      setDeleteOrganizationError(
        'Enter the password for the account that administers this organization.'
      )
      return
    }

    const token = getToken()
    if (!token) return

    setDeletingOrganizationId(organizationId)
    setDeleteOrganizationError('')

    try {
      const res = await fetch(
        `/api/v1/account-management/organizations/${encodeURIComponent(organizationId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: deleteOrganizationPassword,
            admin_user_id:
              pendingDeleteOrganization?.user_id || null,
          }),
        }
      )

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to delete organization.'
        )
      }

      setAdminOrganizations((current) =>
        current.filter(
          (organization) =>
            organization.organization_id !== organizationId
        )
      )

      setMyOrganizations((current) =>
        current.filter(
          (organization) =>
            organization.organization_id !== organizationId
        )
      )

      closeDeleteOrganization()
      await fetchAdminOrganizations()
      await fetchMyOrganizations()
      await fetchSwitchAccounts()
    } catch (error) {
      setDeleteOrganizationError(error.message)
    } finally {
      setDeletingOrganizationId(null)
    }
  }

  const organizationAdminVisible =
    accountType === 'organization' && role === 'admin'

  return (
    <>
      <main className="settings-page">
        <div className="settings-page-shell">
          <header className="settings-page-header">
            <div>
              <p className="eyebrow">DocGPT</p>
              <h1>Settings</h1>
              <p className="settings-page-subtitle">
                Manage your account and organization access.
              </p>

              {accountType === 'organization' && organizationName && (
                <div className="settings-current-organization">
                  Organization: {organizationName}
                </div>
              )}
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={() => router.push('/')}
            >
              Back to DocGPT
            </button>
          </header>

          <div className="settings-page-body">
            <nav
              className="settings-sidebar"
              aria-label="Settings sections"
            >

              {organizationAdminVisible && (
                <button
                  type="button"
                  className={`settings-sidebar-item${
                    settingsSection === 'organization'
                      ? ' is-active'
                      : ''
                  }`}
                  onClick={() => {
                    setSettingsSection('organization')
                    router.replace('/settings')
                  }}
                >
                  <span className="settings-sidebar-icon" aria-hidden="true">
                    ⌘
                  </span>
                  <span>Organization</span>
                </button>
              )}

              <button
                type="button"
                className={`settings-sidebar-item${
                  settingsSection === 'account'
                    ? ' is-active'
                    : ''
                }`}
                onClick={() => {
                  setSettingsSection('account')
                  router.replace('/settings')
                }}
              >
                <span className="settings-sidebar-icon" aria-hidden="true">
                  ○
                </span>
                <span>Account</span>
              </button>
            </nav>

            <div
              className="settings-content settings-page-content"
              data-settings-section={settingsSection}
            >

              <div className="settings-section settings-section-account">
                <h3>Account</h3>

                {pendingOrganizationInvitations.length > 0 && (
                  <div
                    className="organization-invitations-list"
                    style={{
                      marginBottom: '20px',
                      display: 'grid',
                      gap: '12px',
                    }}
                  >
                    {pendingOrganizationInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="organization-invitation-card"
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'rgba(124, 58, 237, 0.09)',
                          border: '1px solid rgba(124, 58, 237, 0.28)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                fontSize: '1.05rem',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {invitation.organization_name}
                            </strong>

                            <p
                              className="settings-description"
                              style={{
                                marginTop: '4px',
                                fontSize: '0.875rem',
                              }}
                            >
                              You were given access by{' '}
                              <strong>
                                {invitation.invited_by_username}
                              </strong>
                              {invitation.invited_by_email
                                ? `(${invitation.invited_by_email})`
                                : ''}
                              .
                              Accept the invitation to access the
                              organization's shared documents.
                            </p>
                          </div>

                          <div
                            className="organization-invitation-actions"
                            style={{
                              display: 'flex',
                              gap: '8px',
                              flexShrink: 0,
                            }}
                          >
                            <button
                              type="button"
                              className="settings-save-button"
                              disabled={invitationActionId === invitation.id}
                              onClick={() =>
                                respondToOrganizationInvitation(
                                  invitation.id,
                                  'accept'
                                )
                              }
                            >
                              {invitationActionId === invitation.id
                                ? 'Accepting...'
                                : 'Accept Invitation'}
                            </button>

                            <button
                              type="button"
                              className="settings-secondary-button"
                              disabled={invitationActionId === invitation.id}
                              onClick={() =>
                                respondToOrganizationInvitation(
                                  invitation.id,
                                  'decline'
                                )
                              }
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {invitationActionError && (
                      <p className="settings-error-message">
                        {invitationActionError}
                      </p>
                    )}
                  </div>
                )}

                {!showChangeUsername ? (
                  <div className="settings-row settings-account-action">
                    <div>
                      <div className="settings-row-title">Username</div>
                      <div className="settings-row-description">
                        Change your current username.
                      </div>
                    </div>

                    <div className="settings-action-group">
                      <button
                        type="button"
                        className="settings-theme-button"
                        onClick={() => {
                          setShowChangePassword(false)
                          setShowChangeUsername(true)
                          setUsernameError('')
                          setUsernameMessage('')
                          setNewUsername('')
                          setUsernamePassword('')
                        }}
                      >
                        Change Username
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="change-password-form"
                    onSubmit={handleChangeUsername}
                  >
                    <div className="change-password-title">
                      Change Username
                    </div>

                    <div className="change-password-field">
                      <label htmlFor="new-username">
                        New username
                      </label>
                      <input
                        id="new-username"
                        type="text"
                        value={newUsername}
                        onChange={(event) =>
                          setNewUsername(event.target.value)
                        }
                        autoComplete="username"
                        placeholder="Enter new username"
                        maxLength={100}
                        disabled={usernameChanging}
                      />
                    </div>

                    <div className="change-password-field">
                      <label htmlFor="username-current-password">
                        Current password
                      </label>
                      <input
                        id="username-current-password"
                        type="password"
                        value={usernamePassword}
                        onChange={(event) =>
                          setUsernamePassword(event.target.value)
                        }
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        disabled={usernameChanging}
                      />
                    </div>

                    {usernameError && (
                      <div className="change-password-error">
                        {usernameError}
                      </div>
                    )}

                    {usernameMessage && (
                      <div className="change-password-success">
                        {usernameMessage}
                      </div>
                    )}

                    <div className="change-password-actions">
                      <button
                        type="button"
                        className="settings-secondary-button"
                        onClick={() => {
                          setShowChangeUsername(false)
                          setUsernameError('')
                          setUsernameMessage('')
                          setNewUsername('')
                          setUsernamePassword('')
                        }}
                        disabled={usernameChanging}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="settings-save-button"
                        disabled={usernameChanging}
                      >
                        {usernameChanging
                          ? 'Changing...'
                          : 'Change Username'}
                      </button>
                    </div>
                  </form>
                )}

                {!showChangePassword ? (
                  <div className="settings-row settings-password-action">
                    <div>
                      <div className="settings-row-title">
                        Password
                      </div>
                      <div className="settings-row-description">
                        Change your account password securely.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="settings-theme-button"
                      onClick={() => {
                        setShowChangeUsername(false)
                        setShowChangePassword(true)
                        setPasswordError('')
                        setPasswordMessage('')
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <form
                    className="change-password-form"
                    onSubmit={handleChangePassword}
                  >
                    <div className="change-password-title">
                      Change Password
                    </div>

                    <div className="change-password-field">
                      <label htmlFor="current-password">
                        Current password
                      </label>
                      <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        disabled={passwordChanging}
                      />
                    </div>

                    <div className="change-password-field">
                      <label htmlFor="new-password">
                        New password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        disabled={passwordChanging}
                      />
                    </div>

                    <div className="change-password-field">
                      <label htmlFor="confirm-password">
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        disabled={passwordChanging}
                      />
                    </div>

                    {passwordError && (
                      <div className="change-password-error">
                        {passwordError}
                      </div>
                    )}

                    {passwordMessage && (
                      <div className="change-password-success">
                        {passwordMessage}
                      </div>
                    )}

                    <div className="change-password-actions">
                      <button
                        type="button"
                        className="settings-cancel-button"
                        onClick={() => {
                          setShowChangePassword(false)
                          setCurrentPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                          setPasswordError('')
                          setPasswordMessage('')
                        }}
                        disabled={passwordChanging}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="settings-save-button"
                        disabled={passwordChanging}
                      >
                        {passwordChanging
                          ? 'Changing...'
                          : 'Change Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {role === 'admin' && (
                <div className="settings-section settings-section-account">
                  <div className="settings-row">
                    <div>
                      <div className="settings-row-title">
                        Add Account
                      </div>
                      <div className="settings-row-description">
                        Create another independent account while keeping
                        your current account and session active.
                      </div>
                    </div>

                    {!showAddAccount && (
                      <button
                        type="button"
                        className="settings-theme-button"
                        onClick={() => {
                          setShowAddAccount(true)
                          setAddAccountError('')
                          setAddAccountMessage('')
                        }}
                      >
                        Add Account
                      </button>
                    )}
                  </div>

                  {showAddAccount && (
                    <form
                      className="change-password-form"
                      onSubmit={addAccount}
                    >
                      <div className="change-password-title">
                        Create Additional Account
                      </div>

                      <div className="change-password-field">
                        <label htmlFor="add-account-username">
                          Username
                        </label>
                        <input
                          id="add-account-username"
                          type="text"
                          value={addAccountUsername}
                          onChange={(event) => {
                            setAddAccountUsername(event.target.value)
                            setAddAccountError('')
                          }}
                          autoComplete="username"
                          placeholder="Enter username"
                          maxLength={100}
                          disabled={addingAccount}
                        />
                      </div>

                      <div className="change-password-field">
                        <label htmlFor="add-account-email">
                          Email
                        </label>
                        <input
                          id="add-account-email"
                          type="email"
                          value={addAccountEmail}
                          onChange={(event) => {
                            setAddAccountEmail(event.target.value)
                            setAddAccountError('')
                          }}
                          autoComplete="email"
                          placeholder="Enter email address"
                          disabled={addingAccount}
                        />
                      </div>

                      {addAccountType === 'organization' && (
                        <div className="change-password-field">
                          <label htmlFor="add-account-organization-name">
                            Organization name
                          </label>
                          <input
                            id="add-account-organization-name"
                            type="text"
                            value={addAccountOrganizationName}
                            onChange={(event) => {
                              setAddAccountOrganizationName(
                                event.target.value
                              )
                              setAddAccountError('')
                            }}
                            placeholder="Enter organization name"
                            disabled={addingAccount}
                          />
                        </div>
                      )}

                      <div className="change-password-field">
                        <label htmlFor="add-account-password">
                          Password
                        </label>
                        <input
                          id="add-account-password"
                          type="password"
                          value={addAccountPassword}
                          onChange={(event) => {
                            setAddAccountPassword(event.target.value)
                            setAddAccountError('')
                          }}
                          autoComplete="new-password"
                          placeholder="Enter password"
                          disabled={addingAccount}
                        />
                      </div>

                      <div className="change-password-field">
                        <label htmlFor="add-account-confirm-password">
                          Confirm password
                        </label>
                        <input
                          id="add-account-confirm-password"
                          type="password"
                          value={addAccountConfirmPassword}
                          onChange={(event) => {
                            setAddAccountConfirmPassword(event.target.value)
                            setAddAccountError('')
                          }}
                          autoComplete="new-password"
                          placeholder="Re-enter password"
                          disabled={addingAccount}
                        />
                      </div>

                      {addAccountError && (
                        <div className="change-password-error">
                          {addAccountError}
                        </div>
                      )}

                      {addAccountMessage && (
                        <div className="change-password-success">
                          {addAccountMessage}
                        </div>
                      )}

                      <div className="change-password-actions">
                        <button
                          type="button"
                          className="settings-secondary-button"
                          onClick={() => {
                            if (addingAccount) return

                            setShowAddAccount(false)
                            setAddAccountType('organization')
                            setAddAccountUsername('')
                            setAddAccountEmail('')
                            setAddAccountPassword('')
                            setAddAccountConfirmPassword('')
                            setAddAccountOrganizationName('')
                            setAddAccountError('')
                            setAddAccountMessage('')
                          }}
                          disabled={addingAccount}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="settings-save-button"
                          disabled={addingAccount}
                        >
                          {addingAccount
                            ? 'Creating...'
                            : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>


              )}

              {role === 'admin' && (
                <div className="settings-section settings-section-account">
                  <div className="settings-row">
                    <div>
                      <div className="settings-row-title">
                        Switch Accounts
                      </div>
                      <div className="settings-row-description">
                        Switch between organization accounts registered with
                        your email without signing out.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="settings-theme-button"
                      onClick={openSwitchAccounts}
                      disabled={loadingSwitchAccounts}
                    >
                      {loadingSwitchAccounts
                        ? 'Loading...'
                        : 'Switch Accounts'}
                    </button>
                  </div>

                  {showSwitchAccounts && (
                    <div className="change-password-form">
                      <div className="change-password-title">
                        Switch Organization Account
                      </div>

                      {loadingSwitchAccounts ? (
                        <div className="settings-row-description">
                          Loading available organization accounts...
                        </div>
                      ) : switchAccounts.length === 0 ? (
                        <div className="settings-row-description">
                          No other organization accounts are available for
                          this email address.
                        </div>
                      ) : (
                        <div className="switch-account-list">
                          {switchAccounts.map((account) => (
                            <div
                              key={`${account.user_id}-${account.organization_id}`}
                              className={`switch-account-card${
                                account.current
                                  ? ' switch-account-card-current'
                                  : ''
                              }`}
                              role="button"
                              tabIndex={account.current ? -1 : 0}
                              onClick={() => {
                                if (!account.current && !switchingAccountId) {
                                  switchAccount(account.organization_id)
                                }
                              }}
                              onKeyDown={(event) => {
                                if (
                                  !account.current &&
                                  !switchingAccountId &&
                                  (event.key === 'Enter' || event.key === ' ')
                                ) {
                                  event.preventDefault()
                                  switchAccount(account.organization_id)
                                }
                              }}
                            >
                              <span
                                className={`switch-account-radio${
                                  account.current
                                    ? ' switch-account-radio-current'
                                    : ''
                                }`}
                              >
                                {account.current && (
                                  <span className="switch-account-radio-dot" />
                                )}
                              </span>

                              <span className="switch-account-icon">
                                <svg
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 21h18" />
                                  <path d="M5 21V7l7-4 7 4v14" />
                                  <path d="M9 21v-4h6v4" />
                                  <path d="M9 9h.01" />
                                  <path d="M15 9h.01" />
                                  <path d="M9 12h.01" />
                                  <path d="M15 12h.01" />
                                </svg>
                              </span>

                              <span className="switch-account-details">
                                <span className="switch-account-name-row">
                                  <span className="switch-account-name">
                                    {account.organization_name}
                                  </span>



                                  {account.current && (
                                    <span className="switch-account-current">
                                      Current
                                    </span>
                                  )}
                                </span>

                                <span className="switch-account-username">
                                  {account.username}
                                </span>
                              </span>

                              <button
                                type="button"
                                className="switch-account-delete"
                                onClick={(event) => {
                                  event.stopPropagation()

                                  if (!account.current) {
                                    openDeleteOrganization(account)
                                  }
                                }}
                                disabled={
                                  switchingAccountId !== null ||
                                  deletingOrganizationId !== null ||
                                  account.current
                                }
                                aria-label={`Delete ${account.organization_name}`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  width="16"
                                  height="16"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v5" />
                                  <path d="M14 11v5" />
                                </svg>
                              </button>

                            </div>
                          ))}
                        </div>
                      )}

                      {switchAccountError && (
                        <div className="change-password-error">
                          {switchAccountError}
                        </div>
                      )}

                      <div className="change-password-actions">
                        <button
                          type="button"
                          className="settings-secondary-button"
                          onClick={() => {
                            if (switchingAccountId) return

                            setShowSwitchAccounts(false)
                            setSwitchAccounts([])
                            setSwitchAccountError('')
                          }}
                          disabled={switchingAccountId !== null}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {accountType === 'organization' &&
                myOrganizations.length > 1 && (
                  <div className="settings-section">
                    <h3>Organizations</h3>

                    <div className="settings-row">
                      <div>
                        <div className="settings-row-title">
                          Current organization
                        </div>
                        <div className="settings-row-description">
                          Switch between organizations you have active access to.
                        </div>
                      </div>

                      <div className="settings-action-group">
                        <select
                          className="settings-theme-button"
                          value={tenantId || ''}
                          onChange={(event) =>
                            switchOrganization(event.target.value)
                          }
                          disabled={
                            loadingMyOrganizations ||
                            switchingOrganizationId !== null
                          }
                        >
                          {myOrganizations
                            .filter(
                              (organization) =>
                                organization.access_status === 'active'
                            )
                            .map((organization) => (
                              <option
                                key={organization.organization_id}
                                value={organization.organization_id}
                              >
                                {organization.organization_name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {switchingOrganizationId && (
                      <p className="settings-description">
                        Switching organization...
                      </p>
                    )}

                    {organizationSwitchError && (
                      <p className="settings-error-message">
                        {organizationSwitchError}
                      </p>
                    )}
                  </div>
                )}

              {organizationAdminVisible && (
                <div className="settings-section settings-section-organization">
                  <h3>Organization</h3>

                  {!showChangeOrganization ? (
                    <div className="settings-row">
                      <div>
                        <div className="settings-row-title">
                          Organization Name
                        </div>
                        <div className="settings-row-description">
                          Change your current organization name.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-theme-button"
                        onClick={() => {
                          setShowChangeOrganization(true)
                          setNewOrganizationName(organizationName)
                          setOrganizationCurrentPassword('')
                          setOrganizationNameError('')
                          setOrganizationNameMessage('')
                        }}
                      >
                        Change Organization Name
                      </button>
                    </div>
                  ) : (
                    <form
                      className="change-password-form"
                      onSubmit={updateOrganizationName}
                    >
                      <div className="change-password-title">
                        Change Organization Name Name
                      </div>

                      <div className="change-password-field">
                        <label htmlFor="organization-name">
                          New organization name
                        </label>
                        <input
                          id="organization-name"
                          type="text"
                          value={newOrganizationName}
                          onChange={(event) => {
                            setNewOrganizationName(event.target.value)
                            setOrganizationNameError('')
                            setOrganizationNameMessage('')
                          }}
                          placeholder="Enter organization name"
                          maxLength={200}
                          disabled={organizationNameSaving}
                        />
                      </div>

                      <div className="change-password-field">
                        <label htmlFor="organization-current-password">
                          Current password
                        </label>
                        <input
                          id="organization-current-password"
                          type="password"
                          value={organizationCurrentPassword}
                          onChange={(event) => {
                            setOrganizationCurrentPassword(event.target.value)
                            setOrganizationNameError('')
                            setOrganizationNameMessage('')
                          }}
                          autoComplete="current-password"
                          placeholder="Enter current password"
                          disabled={organizationNameSaving}
                        />
                      </div>

                      {organizationNameError && (
                        <p className="settings-error-message">
                          {organizationNameError}
                        </p>
                      )}

                      {organizationNameMessage && (
                        <p className="settings-success-message">
                          {organizationNameMessage}
                        </p>
                      )}

                      <div className="settings-action-group">
                        <button
                          type="button"
                          className="settings-secondary-button"
                          onClick={() => {
                            setShowChangeOrganization(false)
                            setOrganizationNameError('')
                            setOrganizationNameMessage('')
                            setOrganizationCurrentPassword('')
                            setNewOrganizationName(organizationName)
                          }}
                          disabled={organizationNameSaving}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="settings-save-button"
                          disabled={
                            organizationNameSaving ||
                            !newOrganizationName.trim()
                          }
                        >
                          {organizationNameSaving
                            ? 'Changing...'
                            : 'Change Organization Name'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {organizationAdminVisible && (
                <>
                  <div className="settings-section settings-section-organization">
                    <h3>Organization Members</h3>

                    <div className="settings-row">
                      <div>
                        <div className="settings-row-title">
                          Invite a member
                        </div>
                        <div className="settings-row-description">
                          Add an existing registered user to this organization by email.
                        </div>
                      </div>
                    </div>

                    <form
                      className="change-password-form"
                      onSubmit={inviteOrganizationMember}
                    >
                      <div className="change-password-field">
                        <label htmlFor="organization-member-email">
                          Member email
                        </label>
                        <input
                          id="organization-member-email"
                          type="email"
                          value={memberEmail}
                          onChange={(event) => {
                            setMemberEmail(event.target.value)
                            setMemberInviteError('')
                            setMemberInviteMessage('')
                          }}
                          autoComplete="email"
                          placeholder="member@example.com"
                          disabled={invitingMember}
                        />
                      </div>

                      {memberInviteError && (
                        <div className="change-password-error">
                          {memberInviteError}
                        </div>
                      )}

                      {memberInviteMessage && (
                        <div className="change-password-success">
                          {memberInviteMessage}
                        </div>
                      )}

                      <div className="change-password-actions">
                        <button
                          type="submit"
                          className="settings-save-button"
                          disabled={
                            invitingMember ||
                            !memberEmail.trim()
                          }
                        >
                          {invitingMember
                            ? 'Inviting...'
                            : 'Invite Member'}
                        </button>
                      </div>
                    </form>

                    <div className="organization-members-section">
                      <button
                        type="button"
                        className="organization-members-toggle"
                        onClick={() =>
                          setShowOrganizationMembers((current) => !current)
                        }
                        aria-expanded={showOrganizationMembers}
                      >
                        <span className="settings-row-description">
                          Current organization members
                        </span>

                        <span
                          className={`organization-members-chevron ${
                            showOrganizationMembers ? 'is-open' : ''
                          }`}
                          aria-hidden="true"
                        >
                          <span className="organization-members-chevron-icon" />
                        </span>
                      </button>

                      {showOrganizationMembers && (
                        <div>
                          {organizationMemberDeleteError && (
                            <div
                              className="change-password-error"
                              style={{ marginTop: '10px' }}
                            >
                              {organizationMemberDeleteError}
                            </div>
                          )}

                          {!loadingOrganizationMembers &&
                            organizationMembers.length > 0 && (
                              <div
                                className="organization-members-search-wrapper"
                              >
                                <input
                                  type="search"
                                  className="organization-members-search"
                                  value={organizationMemberSearchInput}
                                  onChange={(event) =>
                                    setOrganizationMemberSearchInput(
                                      event.target.value
                                    )
                                  }
                                  placeholder="Search members by name..."
                                  aria-label="Search organization members by name"
                                />

                                <button
                                  type="button"
                                  className="organization-members-search-icon"
                                  onClick={() =>
                                    setOrganizationMemberSearch(
                                      organizationMemberSearchInput
                                    )
                                  }
                                  aria-label="Search organization members"
                                  title="Search"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      cx="11"
                                      cy="11"
                                      r="6.5"
                                    />
                                    <path d="M16 16L21 21" />
                                  </svg>
                                </button>
                              </div>
                            )}

                          {loadingOrganizationMembers ? (
                            <div
                              className="settings-row-description"
                              style={{ marginTop: '10px' }}
                            >
                              Loading members...
                            </div>
                          ) : organizationMembers.length === 0 ? (
                            <div
                              className="settings-row-description"
                              style={{ marginTop: '10px' }}
                            >
                              No organization members found.
                            </div>
                          ) : (
                            <div
                              className="organization-members-list"
                              style={{ marginTop: '10px' }}
                            >
                              {filteredOrganizationMembers.length === 0 ? (
                                <div
                                  className="settings-row-description"
                                  style={{ padding: '10px 0' }}
                                >
                                  No members match your search.
                                </div>
                              ) : (
                                filteredOrganizationMembers.map((member) => {
                                const isAdmin = member.role === 'admin'
                                const hasAccess =
                                  member.access_status === 'active'
                                const isDeleting =
                                  deletingOrganizationMemberId ===
                                  member.user_id

                                return (
                                  <div
                                    key={member.user_id}
                                    className="organization-member-row"
                                  >
                                    <div className="organization-member-info">
                                      <div className="organization-member-name">
                                        {member.username}
                                      </div>

                                      <div className="settings-row-description">
                                        {member.email || 'No email'} · {member.role}
                                      </div>
                                    </div>

                                    {!isAdmin ? (
                                      <div
                                        className={`organization-member-access ${
                                          hasAccess
                                            ? 'is-granted'
                                            : 'is-pending'
                                        }`}
                                      >
                                        <span
                                          className="organization-member-access-dot"
                                          aria-hidden="true"
                                        />

                                        {hasAccess
                                          ? 'ACCESS GRANTED'
                                          : 'NO ACCESS'}
                                      </div>
                                    ) : (
                                      <div className="organization-member-access-spacer" />
                                    )}

                                    <div className="organization-member-actions">
                                      {!isAdmin && !hasAccess && (
                                        <button
                                          type="button"
                                          className="settings-save-button organization-member-grant-button"
                                          onClick={() =>
                                            grantOrganizationMemberAccess(member)
                                          }
                                          disabled={
                                            grantingOrganizationMemberId ===
                                              member.user_id || isDeleting
                                          }
                                        >
                                          {grantingOrganizationMemberId ===
                                          member.user_id
                                            ? 'Granting...'
                                            : 'Grant Access'}
                                        </button>
                                      )}

                                      {!isAdmin && hasAccess && (
                                        <button
                                          type="button"
                                          className="organization-member-revoke-button"
                                          onClick={() =>
                                            revokeOrganizationMemberAccess(member)
                                          }
                                          disabled={isDeleting}
                                        >
                                          {isDeleting
                                            ? 'Revoking...'
                                            : 'Revoke Access'}
                                        </button>
                                      )}

                                      {!isAdmin && (
                                        <button
                                          type="button"
                                          className="organization-member-delete-button"
                                          onClick={() =>
                                            deleteOrganizationMember(member)
                                          }
                                          disabled={isDeleting}
                                          aria-label={`Remove ${
                                            member.username || 'member'
                                          }`}
                                          title={
                                            isDeleting
                                              ? 'Removing member...'
                                              : 'Remove member'
                                          }
                                        >
                                          {isDeleting ? '…' : '🗑'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="settings-section settings-section-organization">
                    <h3>Access Requests</h3>

                    <div className="settings-row">
                      <div>
                        <div className="settings-row-title">
                          Document delete permissions
                        </div>
                        <div className="settings-row-description">
                          Review member requests and grant or reject delete access.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-theme-button"
                        onClick={fetchAccessRequests}
                        disabled={loadingAccessRequests}
                      >
                        {loadingAccessRequests
                          ? 'Refreshing...'
                          : 'Refresh'}
                      </button>
                    </div>

                    {accessRequestError && (
                      <div className="change-password-error">
                        {accessRequestError}
                      </div>
                    )}

                    {loadingAccessRequests && accessRequests.length === 0 ? (
                      <div className="settings-row-description">
                        Loading access requests...
                      </div>
                    ) : accessRequests.length === 0 ? (
                      <div className="settings-row-description">
                        No pending access requests.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gap: '10px',
                          marginTop: '12px',
                        }}
                      >
                        {accessRequests.map((request) => {
                          const requestId =
                            request?.id || request?.request_id

                          const requestDocumentId =
                            request?.document_id ||
                            request?.document?.id ||
                            request?.documentId

                          const requester =
                            request?.requester_username ||
                            request?.requester_name ||
                            request?.requester_id ||
                            'Unknown member'

                          return (
                            <div
                              key={
                                requestId ||
                                `${requestDocumentId}-${request?.created_at || 'request'}`
                              }
                              style={{
                                padding: '12px',
                                border:
                                  '1px solid var(--border-color, rgba(148, 163, 184, 0.2))',
                                borderRadius: '10px',
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>
                                {request?.document_name ||
                                  request?.document_title ||
                                  `Document ${
                                    requestDocumentId || 'unknown'
                                  }`}
                              </div>

                              <div
                                className="settings-row-description"
                                style={{ marginTop: '4px' }}
                              >
                                Requested by {requester}
                              </div>

                              <div
                                className="settings-row-description"
                                style={{ marginTop: '2px' }}
                              >
                                Permission: delete
                              </div>

                              <div
                                className="settings-action-group"
                                style={{ marginTop: '10px' }}
                              >
                                <button
                                  type="button"
                                  className="settings-save-button"
                                  onClick={() =>
                                    resolveAccessRequest(
                                      requestId,
                                      'approve'
                                    )
                                  }
                                  disabled={
                                    loadingAccessRequests ||
                                    !requestId
                                  }
                                >
                                  Grant Access
                                </button>

                                <button
                                  type="button"
                                  className="settings-secondary-button"
                                  onClick={() =>
                                    resolveAccessRequest(
                                      requestId,
                                      'reject'
                                    )
                                  }
                                  disabled={
                                    loadingAccessRequests ||
                                    !requestId
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {adminOrganizations.length > 0 && (
                    <div className="settings-section organization-admin-section">
                      <h3>Organizations you administer</h3>

                      <div
                        className="settings-row-description"
                        style={{ marginBottom: '14px' }}
                      >
                        Manage organizations administered by your accounts.
                        Deleting an organization permanently removes its
                        organization membership, invitations, access grants,
                        and access requests.
                      </div>

                      {deleteOrganizationError &&
                        !pendingDeleteOrganization && (
                          <div className="change-password-error">
                            {deleteOrganizationError}
                          </div>
                        )}

                      {loadingAdminOrganizations ? (
                        <div className="settings-row-description">
                          Loading organizations...
                        </div>
                      ) : (
                        adminOrganizations.map((organization) => {
                          const isCurrent =
                            organization.organization_id ===
                            (localStorage.getItem('tenant_id') || tenantId)

                          return (
                            <div
                              key={organization.organization_id}
                              className="organization-member-row"
                            >
                              <div className="organization-member-info">
                                <div className="organization-member-name">
                                  {organization.organization_name}
                                </div>

                                <div className="settings-row-description">
                                  {isCurrent
                                    ? 'Currently active organization'
                                    : 'Administered by your account'}
                                </div>
                              </div>

                              <div className="organization-member-delete">
                                <button
                                  type="button"
                                  className="organization-member-delete-button"
                                  disabled={isCurrent}
                                  onClick={() =>
                                    openDeleteOrganization(organization)
                                  }
                                  aria-label={`Delete ${organization.organization_name}`}
                                  title={
                                    isCurrent
                                      ? 'Switch to another organization before deleting this organization'
                                      : 'Delete organization'
                                  }
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {pendingRevokeMember && (
        <div
          className="delete-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (!deletingOrganizationMemberId) {
              setPendingRevokeMember(null)
              setOrganizationMemberDeleteError('')
            }
          }}
        >
          <div
            className="delete-confirm-panel revoke-member-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-member-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-content">
              <h2 id="revoke-member-title">
                Revoke access?
              </h2>

              <p className="delete-confirm-document">
                {pendingRevokeMember.username ||
                  pendingRevokeMember.email ||
                  'Organization member'}
              </p>

              <p className="delete-confirm-message">
                This will revoke this member's access to the organization.
                The member will remain in the organization and can still be
                removed separately.
              </p>

              {organizationMemberDeleteError && (
                <div className="delete-confirm-error">
                  {organizationMemberDeleteError}
                </div>
              )}
            </div>

            <div className="delete-confirm-actions">

              <button
                type="button"
                className="revoke-confirm-revoke"
                onClick={confirmRevokeOrganizationMemberAccess}
                disabled={Boolean(deletingOrganizationMemberId)}
              >
                {deletingOrganizationMemberId
                  ? 'Revoking...'
                  : 'Revoke'}
              </button>
              <button
                type="button"
                className="revoke-confirm-cancel"
                onClick={() => {
                  if (!deletingOrganizationMemberId) {
                    setPendingRevokeMember(null)
                    setOrganizationMemberDeleteError('')
                  }
                }}
                disabled={Boolean(deletingOrganizationMemberId)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteOrganization && (
        <div
          className="delete-confirm-overlay"
          role="presentation"
          onClick={closeDeleteOrganization}
        >
          <div
            className="delete-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-organization-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-content">
              <h2 id="delete-organization-title">
                Delete organization?
              </h2>

              <p className="delete-confirm-document">
                {pendingDeleteOrganization.organization_name}
              </p>

              <p className="delete-confirm-message">
                This permanently removes this organization and its
                memberships, invitations, access grants, and access
                requests. Your account will not be deleted, and your
                current session will remain active.
              </p>

              <div className="change-password-field">
                <label htmlFor="delete-organization-password">
                  Password for the account that administers this organization
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    id="delete-organization-password"
                    type={
                      deleteOrganizationPasswordVisible
                        ? 'text'
                        : 'password'
                    }
                    value={deleteOrganizationPassword}
                    onChange={(event) => {
                      setDeleteOrganizationPassword(event.target.value)
                      setDeleteOrganizationError('')
                    }}
                    autoComplete="current-password"
                    placeholder="Enter administrator account password"
                    disabled={Boolean(deletingOrganizationId)}
                    autoFocus
                    style={{
                      paddingRight: '92px',
                      width: '100%',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteOrganizationPasswordVisible(
                        (current) => !current
                      )
                    }
                    disabled={Boolean(deletingOrganizationId)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: '0',
                      background: 'transparent',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {deleteOrganizationPasswordVisible
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>
              </div>

              {deleteOrganizationError && (
                <div className="delete-confirm-error">
                  {deleteOrganizationError}
                </div>
              )}
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={closeDeleteOrganization}
                disabled={Boolean(deletingOrganizationId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-delete"
                onClick={deleteOrganization}
                disabled={
                  Boolean(deletingOrganizationId) ||
                  !deleteOrganizationPassword
                }
              >
                {deletingOrganizationId
                  ? 'Deleting...'
                  : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
