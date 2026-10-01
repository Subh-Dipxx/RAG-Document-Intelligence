'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OrganizationAccessNotification from '../../components/OrganizationAccessNotification'

export default function SettingsPage() {
  const router = useRouter()
  const [settingsSection, setSettingsSection] = useState('organization')

  const [accountType, setAccountType] = useState('individual')
  const [role, setRole] = useState(null)
  const [username, setUsername] = useState('')
  const [tenantId, setTenantId] = useState(null)

  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [profilePictureUploading, setProfilePictureUploading] = useState(false)
  const [profilePictureDeleting, setProfilePictureDeleting] = useState(false)
  const [profilePictureError, setProfilePictureError] = useState('')

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
  const [accessGrantedMessage, setAccessGrantedMessage] = useState('')
  const [accessGrantedLeaving, setAccessGrantedLeaving] = useState(false)

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

    const searchSection = new URLSearchParams(window.location.search).get('section')
    if (searchSection) {
      setSettingsSection(searchSection)
    } else {
      setSettingsSection('organization')
    }

    fetchMyOrganizations()
    fetchOrganizationInvitations()
    fetchAdminOrganizations()
    fetchProfilePicture()
  }, [])

  useEffect(() => {
    if (accountType === 'organization' && role === 'admin') {
      if (settingsSection === 'organization') {
        fetchOrganizationMembers()
        fetchAccessRequests()
      }
    }
  }, [settingsSection, accountType, role, tenantId])

  useEffect(() => {
    if (
      accountType !== 'organization' ||
      role !== 'admin' ||
      settingsSection !== 'organization'
    ) {
      return undefined
    }

    const intervalId = setInterval(() => {
      fetchOrganizationMembers()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [accountType, role, settingsSection, tenantId])

  const fetchProfilePicture = async () => {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch('/api/v1/profile/picture', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 404) {
        setProfilePictureUrl('')
        return
      }

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error('Unable to load profile picture.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      setProfilePictureUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }
        return url
      })
    } catch (error) {
      console.error('Failed to load profile picture:', error)
      setProfilePictureUrl('')
    }
  }

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setProfilePictureError('')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setProfilePictureError('Please select a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfilePictureError('Profile picture must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const token = getToken()
    if (!token) return

    const formData = new FormData()
    formData.append('file', file)

    setProfilePictureUploading(true)

    try {
      const res = await fetch('/api/v1/profile/picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to update profile picture.'
        )
      }

      await fetchProfilePicture()
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      setProfilePictureError(
        error.message || 'Unable to update profile picture.'
      )
    } finally {
      setProfilePictureUploading(false)
      event.target.value = ''
    }
  }

  const handleProfilePictureDelete = async () => {
    const token = getToken()
    if (!token) return

    setProfilePictureError('')
    setProfilePictureDeleting(true)

    try {
      const res = await fetch('/api/v1/profile/picture', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.detail || 'Unable to remove profile picture.'
        )
      }

      setProfilePictureUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }
        return ''
      })
    } catch (error) {
      console.error('Failed to delete profile picture:', error)
      setProfilePictureError(
        error.message || 'Unable to remove profile picture.'
      )
    } finally {
      setProfilePictureDeleting(false)
    }
  }

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

      const current =
        organizations.find(
          (organization) =>
            String(organization.organization_id) === String(currentTenantId)
        ) || (organizations.length === 1 ? organizations[0] : null)

      if (current) {
        setTenantId(current.organization_id)
        setOrganizationName(current.organization_name || '')
        localStorage.setItem('tenant_id', current.organization_id)
      } else {
        // The previously active organization is no longer available
        // (for example, the member was deleted from that organization).
        setTenantId(null)
        setOrganizationName('')
        setNewOrganizationName('')
        localStorage.removeItem('tenant_id')
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

  useEffect(() => {
    if (!accessGrantedMessage) {
      setAccessGrantedLeaving(false)
      return undefined
    }

    setAccessGrantedLeaving(false)

    const leaveTimer = window.setTimeout(() => {
      setAccessGrantedLeaving(true)

      const removeTimer = window.setTimeout(() => {
        setAccessGrantedMessage('')
        setAccessGrantedLeaving(false)
      }, 450)

      return () => clearTimeout(removeTimer)
    }, 3000)

    return () => clearTimeout(leaveTimer)
  }, [accessGrantedMessage])

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
        setAccessGrantedMessage('Access granted by admin')
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
          current_password: usernamePassword,
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
      <OrganizationAccessNotification />

      {accessGrantedMessage && (
        <div
          className={accessGrantedLeaving ? 'access-granted-notification leaving' : 'access-granted-notification'}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 18px',
            borderRadius: '14px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderLeft: '4px solid #22c55e',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
            color: '#166534',
            animation: 'accessGrantedSlideIn 0.35s ease-out',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              flexShrink: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: '#22c55e',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            ✓
          </div>

          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#14532d',
              }}
            >
              Access granted by admin
            </div>

            <div
              style={{
                marginTop: '3px',
                fontSize: '13px',
                lineHeight: '1.45',
                color: '#166534',
              }}
            >
              You now have access to the organization's shared documents.
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .access-granted-notification {
          animation: accessGrantedSlideIn 0.45s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .access-granted-notification.leaving {
          animation: accessGrantedSlideOut 0.45s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes accessGrantedSlideIn {
          from {
            opacity: 0;
            transform: translateX(calc(100% + 40px));
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes accessGrantedSlideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }

          to {
            opacity: 0;
            transform: translateX(calc(100% + 40px));
          }
        }
      `}</style>

      <div className="settings-page-wrapper">
      {/* Main Settings Container */}
      <main className="settings-container">
        {/* Page Hero Header */}
        <div className="settings-hero-header">
          <div className="settings-hero-left">
            <button
              type="button"
              className="settings-back-btn"
              onClick={() => router.push('/')}
              title="Back to DocGPT"
              aria-label="Back to DocGPT"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <div>
              {settingsSection === 'organization' && (
                <div className="settings-eyebrow">SETTINGS</div>
              )}
              <h1 className="settings-title">
                {settingsSection === 'organization' ? 'Organization' : 'Profile'}
              </h1>
              <p className="settings-subtitle">
                {settingsSection === 'organization'
                  ? 'Manage your organization details, members, and access permissions.'
                  : 'Manage your account details and profile.'}
              </p>

              <div className="settings-org-badge" style={{ marginBottom: '12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <path d="M3 21h18M5 21V7l8-4 6 4v14M9 10h2M9 14h2M13 10h2M13 14h2"/>
                </svg>
                <span>Organization: <strong className="settings-org-name">{organizationName || 'No organization'}</strong></span>
              </div>


            </div>
          </div>

          {/* Decorative 3D Banner Graphic */}
          <div className="settings-hero-illustration" aria-hidden="true">
            <div className="illustration-dots-grid" />
            <div className="illustration-blob" />
            <div className="illustration-card-mockup">
              <div className="illustration-avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="illustration-lines">
                <div className="illustration-line line-long" />
                <div className="illustration-line line-short" />
              </div>
              <div className="illustration-gear">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Cards Rendering */}
        {settingsSection === 'organization' ? (
          <div className="settings-organization-redesign">
            {/* Organization Card 1: Organization Name */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M5 21V7l8-4 6 4v14M9 10h2M9 14h2M13 10h2M13 14h2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="settings-card-title">Organization Name</h3>
                  <p className="settings-card-subtitle">Change your current organization name.</p>
                </div>
              </div>

              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-sub-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="settings-row-label">Organization Name</div>
                    <div className="settings-row-desc">{organizationName || 'No organization name set'}</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="settings-btn-outline"
                  onClick={() => {
                    setShowChangeOrganization(!showChangeOrganization)
                    setNewOrganizationName(organizationName)
                    setOrganizationCurrentPassword('')
                    setOrganizationNameError('')
                    setOrganizationNameMessage('')
                  }}
                >
                  Change Name
                </button>
              </div>

              {showChangeOrganization && (
                <form className="change-password-form" onSubmit={updateOrganizationName} style={{ marginTop: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="change-password-field">
                    <label htmlFor="org-new-name" style={{ color: '#0f172a', fontWeight: 600 }}>New Organization Name</label>
                    <input
                      id="org-new-name"
                      type="text"
                      value={newOrganizationName}
                      onChange={(e) => setNewOrganizationName(e.target.value)}
                      placeholder="Enter new organization name"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                    />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label htmlFor="org-pwd" style={{ color: '#0f172a', fontWeight: 600 }}>Current Password</label>
                    <input
                      id="org-pwd"
                      type="password"
                      value={organizationCurrentPassword}
                      onChange={(e) => setOrganizationCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                    />
                  </div>
                  {organizationNameError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{organizationNameError}</div>}
                  {organizationNameMessage && <div style={{ color: '#22c55e', fontSize: '13px', marginTop: '8px' }}>{organizationNameMessage}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="settings-btn-primary" disabled={organizationNameSaving}>
                      {organizationNameSaving ? 'Saving...' : 'Save Organization Name'}
                    </button>
                    <button type="button" className="settings-btn-outline" onClick={() => setShowChangeOrganization(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Organization Card 2: Members & Invitations */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h3 className="settings-card-title">Organization Members</h3>
                  <p className="settings-card-subtitle">Invite new members and manage document delete permissions.</p>
                </div>
              </div>

              {/* Invite Form */}
              <form onSubmit={inviteOrganizationMember} style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <label style={{ fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Invite a member by email</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                  />
                  <button type="submit" className="settings-btn-primary" disabled={invitingMember}>
                    {invitingMember ? 'Inviting...' : 'Invite Member'}
                  </button>
                </div>
                {memberInviteError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{memberInviteError}</div>}
                {memberInviteMessage && <div style={{ color: '#22c55e', fontSize: '13px', marginTop: '8px' }}>{memberInviteMessage}</div>}
              </form>

              {/* Member Search & List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>Current Members ({organizationMembers.length})</h4>
                  <input
                    type="text"
                    value={organizationMemberSearchInput}
                    onChange={(e) => {
                      setOrganizationMemberSearchInput(e.target.value)
                      setOrganizationMemberSearch(e.target.value)
                    }}
                    placeholder="Search members..."
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                {loadingOrganizationMembers && organizationMembers.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Loading members...</p>
                ) : filteredOrganizationMembers.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No members found.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {filteredOrganizationMembers.map((member) => {
                      const isAdmin = member.role === 'admin'
                      const isDeleting = deletingOrganizationMemberId === member.user_id
                      const accessStatus = String(member.access_status || '').toLowerCase()

                      return (
                        <div
                          key={member.user_id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#0f172a' }}>{member.username}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{member.email || 'No email'} · {member.role}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!isAdmin && (
                              accessStatus === 'active' ? (
                                <>
                                  <span className="organization-member-access is-granted">
                                    <span className="organization-member-access-dot" />
                                    Access Granted
                                  </span>

                                  <button
                                    type="button"
                                    className="organization-member-revoke-button"
                                    onClick={() => revokeOrganizationMemberAccess(member)}
                                    disabled={isDeleting}
                                  >
                                    Revoke Access
                                  </button>
                                </>
                              ) : accessStatus === 'pending' ? (
                                <span className="organization-member-access is-requested">
                                  <span className="organization-member-access-dot" />
                                  Pending
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="organization-member-grant-button"
                                  onClick={() => grantOrganizationMemberAccess(member)}
                                  disabled={grantingOrganizationMemberId === member.user_id || isDeleting}
                                >
                                  {grantingOrganizationMemberId === member.user_id ? 'Granting...' : 'Grant Access'}
                                </button>
                              )
                            )}

                            {!isAdmin && (
                              <button
                                type="button"
                                className="organization-member-delete-button"
                                onClick={() => deleteOrganizationMember(member)}
                                disabled={isDeleting}
                                title="Remove member"
                                aria-label={`Remove ${member.username}`}
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Organization Card 3: Access Requests */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <h3 className="settings-card-title">Document Access Requests</h3>
                    <p className="settings-card-subtitle">Review member requests to grant or reject delete permissions.</p>
                  </div>
                  <button type="button" className="settings-btn-outline" onClick={fetchAccessRequests} disabled={loadingAccessRequests}>
                    {loadingAccessRequests ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {accessRequestError && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{accessRequestError}</div>}

              {loadingAccessRequests && accessRequests.length === 0 ? (
                <p style={{ color: '#64748b' }}>Loading access requests...</p>
              ) : accessRequests.length === 0 ? (
                <p style={{ color: '#64748b' }}>No pending access requests.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {accessRequests.map((request) => {
                    const requestId = request?.id || request?.request_id
                    const requestDocumentId = request?.document_id || request?.document?.id || request?.documentId
                    const requester = request?.requester_username || request?.requester_name || request?.requester_id || 'Unknown member'

                    return (
                      <div key={requestId || `${requestDocumentId}-${request?.created_at}`} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{request?.document_name || request?.document_title || `Document ${requestDocumentId}`}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Requested by {requester} · Permission: delete</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" className="settings-btn-primary" onClick={() => resolveAccessRequest(requestId, 'approve')} disabled={loadingAccessRequests || !requestId}>
                            Grant
                          </button>
                          <button type="button" className="settings-btn-outline" onClick={() => resolveAccessRequest(requestId, 'reject')} disabled={loadingAccessRequests || !requestId}>
                            Reject
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Organization Card 4: Administered Organizations */}
            {adminOrganizations.length > 0 && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="settings-card-title">Organizations You Administer</h3>
                    <p className="settings-card-subtitle">Manage organizations administered by your accounts.</p>
                  </div>
                </div>

                {deleteOrganizationError && !pendingDeleteOrganization && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{deleteOrganizationError}</div>
                )}

                {loadingAdminOrganizations ? (
                  <p style={{ color: '#64748b' }}>Loading organizations...</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {adminOrganizations.map((organization) => {
                      const isCurrent = organization.organization_id === (localStorage.getItem('tenant_id') || tenantId)

                      return (
                        <div key={organization.organization_id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{organization.organization_name}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{isCurrent ? 'Currently active organization' : 'Administered by your account'}</div>
                          </div>
                          <button
                            type="button"
                            className="settings-btn-outline"
                            style={{ color: isCurrent ? '#94a3b8' : '#ef4444', borderColor: isCurrent ? '#cbd5e1' : '#fca5a5' }}
                            disabled={isCurrent}
                            onClick={() => openDeleteOrganization(organization)}
                          >
                            Delete Organization
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Organization Access Invitation - display existing invitation state */}
            {pendingOrganizationInvitations.length > 0 && (
              <div
                className="settings-card"
                style={{
                  marginBottom: '20px',
                  overflow: 'hidden'
                }}
              >
                <div className="settings-card-header">
                  <div className="settings-card-icon-box">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M17 11l2 2 4-4" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="settings-card-title">
                      Organization Access Invitation
                    </h3>
                    <p className="settings-card-subtitle">
                      You have been invited to access an organization.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: 'rgba(124, 58, 237, 0.06)',
                    border: '1px solid rgba(124, 58, 237, 0.16)'
                  }}
                >
                  {pendingOrganizationInvitations.map((invitation) => (
                    <div key={invitation.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e9d5ff, #c4b5fd)',
                            color: '#6b21a8',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '24px',
                            fontWeight: '700'
                          }}
                        >
                          {(invitation.invited_by_username || 'A')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: '700',
                              color: 'var(--text-primary)'
                            }}
                          >
                            You were given access by{' '}
                            <span style={{ color: '#7c3aed' }}>
                              {invitation.invited_by_username}
                            </span>
                            {invitation.invited_by_email
                              ? ` (${invitation.invited_by_email})`
                              : ''}
                            {' '}to{' '}
                            <span style={{ color: '#7c3aed' }}>
                              {invitation.organization_name}
                            </span>
                            .
                          </div>

                          <div
                            style={{
                              marginTop: '6px',
                              fontSize: '13px',
                              lineHeight: '1.5',
                              color: 'var(--text-secondary, #64748b)'
                            }}
                          >
                            Accept the invitation to access the
                            organization's shared documents.
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '18px',
                          padding: '13px 16px',
                          borderRadius: '12px',
                          background: 'rgba(124, 58, 237, 0.07)',
                          border: '1px solid rgba(124, 58, 237, 0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            flexShrink: 0,
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.10)',
                            color: '#7c3aed',
                            display: 'grid',
                            placeItems: 'center'
                          }}
                        >
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 21h18M5 21V7l8-4 6 4v14" />
                            <path d="M9 10h2M9 14h2M13 10h2M13 14h2" />
                          </svg>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--text-secondary, #64748b)'
                            }}
                          >
                            Organization
                          </div>
                          <div
                            style={{
                              marginTop: '2px',
                              fontSize: '15px',
                              fontWeight: '700',
                              color: '#7c3aed'
                            }}
                          >
                            {invitation.organization_name}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '10px',
                          marginTop: '18px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <button
                          type="button"
                          className="settings-btn-outline"
                          disabled={invitationActionId === invitation.id}
                          onClick={() =>
                            respondToOrganizationInvitation(
                              invitation.id,
                              'decline'
                            )
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="settings-btn-primary"
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
                            : '✓  Accept Invitation'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {invitationActionError && (
                    <div
                      style={{
                        color: '#ef4444',
                        fontSize: '13px',
                        marginTop: '12px'
                      }}
                    >
                      {invitationActionError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card 1: Account Information */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="settings-card-title">Account Information</h3>
                  <p className="settings-card-subtitle">Update your profile picture, username and password.</p>
                </div>
              </div>

              {/* Profile Picture Row */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                    <label
                      htmlFor="profile-picture-upload"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e9d5ff, #c4b5fd)',
                        color: '#6b21a8',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '24px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        overflow: 'hidden'
                      }}
                      title="Upload profile picture"
                    >
                      {profilePictureUrl ? (
                        <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (username || 'A').charAt(0).toUpperCase()
                      )}
                    </label>

                    <label
                      htmlFor="profile-picture-upload"
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#7c3aed',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                      title="Change photo"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </label>

                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfilePictureChange}
                      hidden
                    />
                  </div>

                  <div>
                    <div className="settings-row-label">Profile picture</div>
                    <div className="settings-row-desc">Add a profile picture to personalize your account.</div>
                    <div className="settings-row-hint">JPG, PNG or GIF. Max size 5MB.</div>
                  </div>
                </div>
              </div>

              {/* Username Row */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-sub-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="settings-row-label">Username</div>
                    <div className="settings-row-desc">Change your current username.</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="settings-btn-outline"
                  onClick={() => {
                    setShowChangePassword(false)
                    setShowChangeUsername(!showChangeUsername)
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Change Username
                </button>
              </div>

              {showChangeUsername && (
                <form className="change-password-form" onSubmit={handleChangeUsername} style={{ marginTop: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="change-password-field">
                    <label htmlFor="new-username" style={{ color: '#0f172a', fontWeight: 600 }}>New Username</label>
                    <input
                      id="new-username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                    />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label htmlFor="user-pwd" style={{ color: '#0f172a', fontWeight: 600 }}>Current Password</label>
                    <input
                      id="user-pwd"
                      type="password"
                      value={usernamePassword}
                      onChange={(e) => setUsernamePassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                    />
                  </div>
                  {usernameError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{usernameError}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="settings-btn-primary" disabled={usernameChanging}>
                      {usernameChanging ? 'Saving...' : 'Save Username'}
                    </button>
                    <button type="button" className="settings-btn-outline" onClick={() => setShowChangeUsername(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Password Row */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-sub-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="settings-row-label">Password</div>
                    <div className="settings-row-desc">Change your account password securely.</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="settings-btn-outline"
                  onClick={() => {
                    setShowChangeUsername(false)
                    setShowChangePassword(!showChangePassword)
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Change Password
                </button>
              </div>

              {showChangePassword && (
                <form className="change-password-form" onSubmit={handleChangePassword} style={{ marginTop: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="change-password-field">
                    <label htmlFor="curr-pwd" style={{ color: '#0f172a', fontWeight: 600 }}>Current Password</label>
                    <input id="curr-pwd" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label htmlFor="new-pwd" style={{ color: '#0f172a', fontWeight: 600 }}>New Password</label>
                    <input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label htmlFor="conf-pwd" style={{ color: '#0f172a', fontWeight: 600 }}>Confirm New Password</label>
                    <input id="conf-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  {passwordError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{passwordError}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="settings-btn-primary" disabled={passwordChanging}>
                      {passwordChanging ? 'Changing...' : 'Update Password'}
                    </button>
                    <button type="button" className="settings-btn-outline" onClick={() => setShowChangePassword(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Card 2: Add Account */}
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div className="settings-row-left">
                  <div className="settings-card-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="17" y1="11" x2="23" y2="11"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="settings-card-title">Add Account</h3>
                    <p className="settings-card-subtitle">Create another independent account while keeping your current account and session active.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="settings-btn-primary"
                  onClick={() => setShowAddAccount(!showAddAccount)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Account
                </button>
              </div>

              {showAddAccount && (
                <form className="change-password-form" onSubmit={addAccount} style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="change-password-field">
                    <label style={{ color: '#0f172a', fontWeight: 600 }}>Username</label>
                    <input type="text" value={addAccountUsername} onChange={(e) => setAddAccountUsername(e.target.value)} placeholder="Username" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label style={{ color: '#0f172a', fontWeight: 600 }}>Email</label>
                    <input type="email" value={addAccountEmail} onChange={(e) => setAddAccountEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label style={{ color: '#0f172a', fontWeight: 600 }}>Organization Name</label>
                    <input type="text" value={addAccountOrganizationName} onChange={(e) => setAddAccountOrganizationName(e.target.value)} placeholder="Organization name" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label style={{ color: '#0f172a', fontWeight: 600 }}>Password</label>
                    <input type="password" value={addAccountPassword} onChange={(e) => setAddAccountPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  <div className="change-password-field" style={{ marginTop: '12px' }}>
                    <label style={{ color: '#0f172a', fontWeight: 600 }}>Confirm Password</label>
                    <input type="password" value={addAccountConfirmPassword} onChange={(e) => setAddAccountConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }} />
                  </div>
                  {addAccountError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{addAccountError}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="settings-btn-primary" disabled={addingAccount}>
                      {addingAccount ? 'Creating...' : 'Create Account'}
                    </button>
                    <button type="button" className="settings-btn-outline" onClick={() => setShowAddAccount(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Card 3: Switch Accounts */}
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div className="settings-row-left">
                  <div className="settings-card-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 3 21 3 21 8"/>
                      <line x1="4" y1="20" x2="21" y2="3"/>
                      <polyline points="8 21 3 21 3 16"/>
                      <line x1="20" y1="4" x2="3" y2="21"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="settings-card-title">Switch Accounts</h3>
                    <p className="settings-card-subtitle">Switch between organization accounts registered with your email without signing out.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="settings-btn-outline"
                  onClick={() => {
                    if (showSwitchAccounts) {
                      setShowSwitchAccounts(false)
                    } else {
                      openSwitchAccounts()
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="8 21 3 21 3 16"/>
                    <line x1="20" y1="4" x2="3" y2="21"/>
                  </svg>
                  Switch Accounts
                </button>
              </div>

              {showSwitchAccounts && (
                <div style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#0f172a' }}>Available Organization Accounts</h4>
                  {loadingSwitchAccounts ? (
                    <p style={{ color: '#64748b' }}>Loading available accounts...</p>
                  ) : switchAccounts.length === 0 ? (
                    <p style={{ color: '#64748b' }}>No other organization accounts available for your email.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {switchAccounts.map((acc) => (
                        <div
                          key={`${acc.user_id}-${acc.organization_id}`}
                          onClick={() => !acc.current && switchAccount(acc.organization_id)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: acc.current ? '#f3e8ff' : '#ffffff',
                            border: acc.current ? '1px solid #c4b5fd' : '1px solid #cbd5e1',
                            cursor: acc.current ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#0f172a' }}>{acc.organization_name}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Username: {acc.username}</div>
                          </div>
                          {acc.current && <span style={{ fontSize: '12px', background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>Current</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>

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
                Are you sure you want to delete the organization? This action
                cannot be undone.
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
