'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import LoginPage from '../components/LoginPage'

const THEME_KEY = 'rag-theme'

const KnowledgeSphere = dynamic(() => import('../components/KnowledgeSphere'), {
  ssr: false,
  loading: () => <div className="knowledge-sphere" aria-hidden="true"><div className="knowledge-sphere-glow" /><div className="knowledge-sphere-css" /></div>,
})

function IconMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" strokeWidth="1.35" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" strokeWidth="1.35" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" strokeWidth="1.35" transform="rotate(-60 12 12)" />
    </svg>
  )
}

function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h7.2L18.5 8v12.2A1.3 1.3 0 0 1 17.2 21.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.2 3.6V8h4.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function IconAsk() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12a7 7 0 1 1 3.2 5.9L5.5 19.5 6.4 16A7 7 0 0 1 5 12z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconChatHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4.5 3v-3.5A2.5 2.5 0 0 1 5 13V6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.5h7M8.5 11.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15.2 15.2 4.1 4.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7h14M8 12h8M10.5 17h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  )
}

function IconSources() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 5.5h10M7 10h10M7 14.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12h10M11 8.5 14.5 12 11 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 9l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

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

function renderMarkdown(text) {
  if (!text) return null

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {String(text).trim()}
    </ReactMarkdown>
  )
}

function formatHumanReadableExcerpt(text) {
  if (!text) return ''

  let cleaned = String(text)
    .replace(/\[SOURCE\s+\d+\]/gi, '')
    .replace(/\[source\s*:\s*[^\]]+\]/gi, '')
    .replace(/\b(?:document|version|chunk|file)\s*id\s*:\s*[a-f0-9-]{8,}/gi, '')
    .replace(/\bpage\s*id\s*:\s*[a-f0-9-]{8,}/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  if (!cleaned) return ''

  // Structured JSON
  if (
    (cleaned.startsWith('{') && cleaned.endsWith('}')) ||
    (cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    try {
      return formatParsedJson(JSON.parse(cleaned))
    } catch {
      // Continue with text-based cleaning if the JSON is incomplete.
    }
  }

  // Keep citation formatting deterministic and document-agnostic.
  // Do not infer field boundaries or document-specific schemas.
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const output = []
  let tableRows = []

  const flushTable = () => {
    if (!tableRows.length) return

    const rows = tableRows.filter(Boolean)

    if (rows.length === 1) {
      output.push(rows[0])
    } else {
      const first = rows[0]
      const isHeader =
        /^(field|key|name|column|property|item|title|category|type|value)$/i.test(first)

      if (isHeader) {
        output.push(rows.slice(1).join('; '))
      } else {
        output.push(rows.join('; '))
      }
    }

    tableRows = []
  }

  const cleanCell = (value) =>
    value
      .replace(/^[\s|:—\-]+|[\s|:—\-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  for (const rawLine of lines) {
    let line = rawLine
      .replace(/^[•●▪◦‣►▶]\s*/, '')
      .replace(/^\s*[-*]\s+/, '')
      .trim()

    if (!line) continue

    // Markdown/table separators are extraction artifacts.
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line)) {
      continue
    }

    // Pipe-separated tables.
    if (line.includes('|')) {
      const cells = line
        .split('|')
        .map(cleanCell)
        .filter(Boolean)

      if (cells.length >= 2) {
        tableRows.push(
          cells.length === 2
            ? `${cells[0]} is ${cells[1]}`
            : `${cells[0]} (${cells.slice(1).join(', ')})`
        )
        continue
      }
    }

    // Common extracted table/key-value delimiters.
    const delimiterMatch = line.match(/^(.+?)\s+(?:—|–|-|:)\s+(.+)$/)

    if (delimiterMatch) {
      const key = cleanCell(delimiterMatch[1])
      const value = cleanCell(delimiterMatch[2])

      if (key && value) {
        tableRows.push(`${key} is ${value}`)
        continue
      }
    }

    flushTable()

    // Worksheet/sheet metadata is useful context, but present it naturally.
    const worksheetMatch = line.match(/^worksheet\s*:\s*(.+)$/i)
    if (worksheetMatch) {
      output.push(`Worksheet: ${cleanCell(worksheetMatch[1])}.`)
      continue
    }

    // Preserve headings while removing markdown decoration.
    line = line
      .replace(/^#{1,6}\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .trim()

    // Normalize whitespace without changing the actual information.
    line = line
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;!?])/g, '$1')
      .replace(/([,.;!?])([A-Za-z])/g, '$1 $2')
      .trim()

    if (line) output.push(line)
  }

  flushTable()

  return output
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim()
}

function formatParsedJson(obj, indent = 0) {
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
  if (!obj) return ''

  if (Array.isArray(obj)) {
    return obj
      .map((item) => formatParsedJson(item, indent))
      .filter(Boolean)
      .join('\n')
  }

  if (typeof obj === 'object') {
    const prefix = '  '.repeat(indent)
    return Object.entries(obj)
      .map(([key, val]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\b\w/g, (c) => c.toUpperCase())

        if (typeof val === 'object' && val !== null) {
          return `${prefix}${formattedKey}:\n${formatParsedJson(val, indent + 1)}`
        }
        return `${prefix}${formattedKey}: ${val}`
      })
      .join('\n')
  }

  return String(obj)
}

function applyTheme(next) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', next)
}

function readStoredTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function App() {
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  const [theme, setTheme] = useState('dark')

  const handleLogin = (accessToken) => {
    localStorage.setItem('access_token', accessToken)
    setToken(accessToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
  }
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [documents, setDocuments] = useState([])
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historySort, setHistorySort] = useState('recent')

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [answerHistory, setAnswerHistory] = useState([])
  const [conversationMessages, setConversationMessages] = useState([])
  const conversationViewportRef = useRef(null)
  const latestQuestionRef = useRef(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')
  const [expandedSources, setExpandedSources] = useState({})
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [documentPreview, setDocumentPreview] = useState(null)

  useEffect(() => {
    const stored = readStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  useEffect(() => {
    if (!answer && answerHistory.length === 0) return

    requestAnimationFrame(() => {
      const viewport = conversationViewportRef.current
      const questionElement = latestQuestionRef.current

      if (!viewport || !questionElement) return

      const viewportRect = viewport.getBoundingClientRect()
      const questionRect = questionElement.getBoundingClientRect()

      const targetTop =
        viewport.scrollTop +
        (questionRect.top - viewportRect.top) -
        18

      viewport.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      })
    })
  }, [answer, answerHistory.length])

  useEffect(() => {
    if (!token) {
      setConversations([])
      setConversationId(null)
      return
    }

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/v1/chat', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const contentType = res.headers.get('content-type') || ''
        const rawBody = await res.text()

        let data = null
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(rawBody)
          } catch {
            data = null
          }
        }

        if (res.status === 401) {
          handleLogout()
          return
        }

        if (!res.ok) {
          throw new Error(data?.detail || rawBody || `Failed to load conversations (${res.status})`)
        }

        setConversations(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      }
    }

    fetchConversations()
  }, [token])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* ignore quota / private mode */
    }
  }

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/health')
        const contentType = res.headers.get('content-type') || ''
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json()
          setHealth(data)
        } else {
          setHealth(null)
        }
      } catch (err) {
        console.error('Failed to fetch health:', err)
        setHealth(null)
      }
    }

    fetchHealth()
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)

    if (selectedFile) {
      handleSubmit(null, selectedFile)
    }
  }

  const handleRemoveDocument = () => {
    setFile(null)
    setDocuments([])
    setStatus('')
    setAnswer(null)
    setAnswerHistory([])
    setQuestion('')
    setQueryError('')
    setConversationId(null)
    setConversationMessages([])
    setShowDocumentViewer(false)
  }

  useEffect(() => {
    if (!file) {
      setDocumentPreview(null)
      return
    }

    let objectUrl = null

    const loadPreview = async () => {
      const type = file.type || ''
      const name = file.name || ''
      const extension = name.split('.').pop()?.toLowerCase() || ''

      if (type === 'application/pdf' || extension === 'pdf') {
        objectUrl = URL.createObjectURL(file)
        setDocumentPreview({
          kind: 'pdf',
          url: objectUrl,
          name,
          type: type || 'application/pdf',
        })
        return
      }

      if (type.startsWith('image/')) {
        objectUrl = URL.createObjectURL(file)
        setDocumentPreview({
          kind: 'image',
          url: objectUrl,
          name,
          type,
        })
        return
      }

      if (
        type.startsWith('text/') ||
        ['md', 'markdown', 'txt', 'csv', 'json'].includes(extension)
      ) {
        const content = await file.text()

        setDocumentPreview({
          kind:
            extension === 'json'
              ? 'json'
              : extension === 'csv'
                ? 'csv'
                : extension === 'md' || extension === 'markdown'
                  ? 'markdown'
                  : 'text',
          content,
          name,
          type: type || 'text/plain',
        })
        return
      }

      setDocumentPreview({
        kind: 'unsupported',
        name,
        type: type || 'Unknown file type',
      })
    }

    loadPreview()

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file])

  const handleSubmit = async (e, fileToUpload = file) => {
    e?.preventDefault()

    if (!fileToUpload) {
      setStatus('Please select a file.')
      return
    }

    setLoading(true)
    setStatus('Uploading document...')

    try {
      const formData = new FormData()

      if (title.trim()) {
        formData.append('title', title.trim())
      }

      formData.append('file', fileToUpload)

      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const contentType = res.headers.get('content-type') || ''
      const rawBody = await res.text()

      let data = null
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(rawBody)
        } catch {
          data = null
        }
      }

      if (res.status === 401) {
        handleLogout()
        setStatus('Session expired. Please sign in again.')
        return
      }

      if (!res.ok) {
        throw new Error(data?.detail || rawBody || `Upload failed (${res.status})`)
      }

      if (!data) {
        throw new Error('The server returned an invalid response.')
      }

      setDocuments([data])
      setStatus('Document uploaded successfully.')
      setTitle('')
      setAnswer(null)
      setAnswerHistory([])
      setQuestion('')
      setQueryError('')
    } catch (err) {
      console.error(err)
      setStatus(err.message || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async (e) => {
    e.preventDefault()

    if (!question.trim()) {
      setQueryError('Please enter a question.')
      return
    }

    if (!documents.length || !(documents[0]?.document_id || documents[0]?.id)) {
      setQueryError('Please upload a document before asking a question.')
      return
    }

    const submittedQuestion = question.trim()

    setQueryLoading(true)
    setQueryError('')
    if (answer) {
      setAnswerHistory((history) => [...history, answer])
    }
    setAnswer(null)

    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: submittedQuestion,
          conversation_id: conversationId,
          top_k: 5,
          filters: documents.length > 0
            ? {
                document_id: documents[0].document_id || documents[0].id,
              }
            : {},
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      const rawBody = await res.text()

      let data = null

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(rawBody)
        } catch {
          data = null
        }
      }

      if (res.status === 401) {
        handleLogout()
        setQueryError('Session expired. Please sign in again.')
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Query failed with status ${res.status}`
        )
      }

      if (!data) {
        throw new Error('The server returned an invalid response.')
      }

      setAnswer({
        ...data,
        question: submittedQuestion,
      })
      setQuestion('')
      setConversationId(data.conversation_id || null)

      setConversationMessages((messages) => [
        ...messages,
        {
          role: 'user',
          content: question.trim(),
        },
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          metadata: {
            abstained: data.abstained || false,
            confidence: data.confidence ?? null,
            retrieved_chunks: data.retrieved_chunks ?? 0,
            model: data.model || null,
          },
        },
      ])
    } catch (err) {
      console.error(err)
      setQueryError(err.message || 'Query failed.')
    } finally {
      setQueryLoading(false)
    }
  }

  const filteredConversations = [...conversations]
    .filter((conversation) =>
      (conversation.title || 'Untitled conversation')
        .toLowerCase()
        .includes(historySearch.toLowerCase())
    )
    .sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return historySort === 'oldest' ? aTime - bTime : bTime - aTime
    })

  const formatConversationTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    )

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const getMessageCount = (conversation) =>
    conversation.message_count ??
    conversation.messages?.length ??
    0

  const handleSelectConversation = async (id) => {
    if (!token || !id) return

    try {
      setQueryError('')
      const res = await fetch(`/api/v1/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const rawBody = await res.text()
        throw new Error(rawBody || `Failed to load conversation (${res.status})`)
      }

      const data = await res.json()
      setConversationId(data.id)
      setQuestion('')
      setConversationMessages(Array.isArray(data.messages) ? data.messages : [])

      const assistantMessages = (data.messages || []).filter(
        (message) => message.role === 'assistant'
      )

      const answerResults = assistantMessages.map((message) => {
        const messageIndex = (data.messages || []).indexOf(message)
        const precedingUser = (data.messages || [])
          .slice(0, messageIndex)
          .reverse()
          .find((item) => item.role === 'user')

        return {
          conversation_id: data.id,
          question: precedingUser?.content || '',
          answer: message.content,
          citations: message.citations || [],
          abstained: message.metadata?.abstained || false,
          confidence: message.metadata?.confidence ?? null,
          retrieved_chunks: message.metadata?.retrieved_chunks ?? 0,
          model: message.metadata?.model || null,
        }
      })

      const latestAssistant = answerResults[answerResults.length - 1]

      if (latestAssistant) {
        setAnswerHistory(answerResults.slice(0, -1))
        setAnswer(latestAssistant)
      } else {
        setAnswerHistory([])
        setAnswer(null)
      }

      setShowChatHistory(false)

      requestAnimationFrame(() => {
        document.getElementById('query')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setQueryError(err.message || 'Failed to load conversation.')
    }
  }

  const handleNewConversation = () => {
    setConversationId(null)
    setAnswer(null)
    setAnswerHistory([])
    setConversationMessages([])
    setQuestion('')
    setQueryError('')
    setShowChatHistory(false)

    requestAnimationFrame(() => {
      document.getElementById('query')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  const currentDocument = documents[0]

  if (!token) {
    return <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
  }

  const isLight = theme === 'light'

  return (
    <div className="app-shell" data-theme={theme}>
      <style jsx global>{`
        .workspace {
          grid-template-columns: minmax(0, 1fr);
        }

        .workspace:has(.document-viewer) {
          grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
        }

        .document-viewer-toggle {
          height: 36px;
          padding: 0 14px;
          border: 1px solid var(--border-strong);
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.06);
          color: var(--text);
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease;
        }

        .document-viewer-toggle:hover:not(:disabled) {
          background: rgba(124, 58, 237, 0.12);
        }

        .document-viewer-toggle.is-active {
          border-color: rgba(124, 58, 237, 0.35);
          background: rgba(124, 58, 237, 0.14);
          color: var(--accent);
        }

        .document-viewer-toggle:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .document-viewer {
          min-width: 0;
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--panel);
          box-shadow: var(--shadow);
        }

        .document-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .document-viewer-header h2 {
          max-width: 300px;
          margin: 3px 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
        }

        .document-viewer-close {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: transparent;
          color: var(--text);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .document-viewer-close:hover {
          background: rgba(124, 58, 237, 0.08);
        }

        .document-viewer-body {
          flex: 1 1 auto;
          min-height: 0;
          overflow: auto;
          padding: 16px;
          box-sizing: border-box;
        }

        .document-viewer-empty {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px;
          border: 1px dashed var(--border);
          border-radius: 14px;
          color: var(--muted);
          text-align: center;
          font-size: 12px;
        }

        .document-viewer-empty strong {
          color: var(--text);
          font-size: 13px;
        }

        .document-preview-frame {
          width: 100%;
          height: 100%;
          min-height: 600px;
          border: 0;
          border-radius: 12px;
          background: #ffffff;
        }

        .document-image-preview {
          width: 100%;
          min-height: 100%;
          display: grid;
          place-items: center;
        }

        .document-image-preview img {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 10px;
        }

        .document-text-preview {
          margin: 0;
          padding: 16px;
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(124, 58, 237, 0.025);
          color: var(--text);
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .document-markdown-preview {
          padding: 18px;
        }

        .document-markdown-preview h1,
        .document-markdown-preview h2,
        .document-markdown-preview h3,
        .document-markdown-preview h4 {
          color: var(--text);
        }

        .document-markdown-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          font-size: 12px;
        }

        .document-markdown-preview th,
        .document-markdown-preview td {
          padding: 8px;
          border: 1px solid var(--border);
          text-align: left;
          vertical-align: top;
        }

        .document-markdown-preview th {
          background: rgba(124, 58, 237, 0.07);
        }

        @media (max-width: 900px) {
          .workspace:has(.document-viewer) {
            grid-template-columns: minmax(0, 1fr);
          }

          .document-viewer {
            position: absolute;
            z-index: 20;
            inset: 16px;
          }
        }
      `}</style>

      <aside className="sidebar">
        <a className="sidebar-logo" href="#workspace" aria-label="Workspace">
          <span>R</span>
        </a>
        <nav className="sidebar-nav">
          <a href="#workspace" className="is-active" title="Workspace">
            <IconMark />
          </a>
          <button
            type="button"
            className={`sidebar-history${showChatHistory ? ' is-active' : ''}`}
            title="Chat History"
            aria-label="Chat History"
            aria-expanded={showChatHistory}
            onClick={() => setShowChatHistory((open) => !open)}
          >
            <IconChatHistory />
          </button>
        </nav>
        <button
          type="button"
          className="sidebar-theme"
          onClick={toggleTheme}
          title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {isLight ? <IconMoon /> : <IconSun />}
        </button>
        <button type="button" className="sidebar-logout" onClick={handleLogout} title="Logout">
          <IconLogout />
        </button>
      </aside>

      {showChatHistory && (
        <button
          type="button"
          className="history-backdrop"
          aria-label="Close Chat History"
          onClick={() => setShowChatHistory(false)}
        />
      )}

      <aside
        className={`chat-history-drawer${showChatHistory ? ' is-open' : ''}`}
        aria-label="Chat History"
      >
        <div className="history-drawer-header">
          <div className="history-title-wrap">
            <span className="history-title-icon">
              <IconChatHistory />
            </span>
            <div>
              <h2>Chat History</h2>
              <p>Your past conversations</p>
            </div>
          </div>

          <button
            type="button"
            className="history-close"
            aria-label="Close Chat History"
            onClick={() => setShowChatHistory(false)}
          >
            <IconClose />
          </button>
        </div>

        <div className="history-search-row">
          <label className="history-search">
            <IconSearch />
            <input
              type="search"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
            />
          </label>

          <button
            type="button"
            className={`history-filter${historySort === 'oldest' ? ' is-active' : ''}`}
            title={historySort === 'recent' ? 'Sort oldest first' : 'Sort recent first'}
            aria-label={historySort === 'recent' ? 'Sort oldest first' : 'Sort recent first'}
            onClick={() =>
              setHistorySort((sort) => (sort === 'recent' ? 'oldest' : 'recent'))
            }
          >
            <IconFilter />
          </button>
        </div>

        <div className="history-conversation-list">
          {filteredConversations.length === 0 ? (
            <div className="history-empty">
              <span className="history-empty-icon">
                <IconChatHistory />
              </span>
              <strong>
                {historySearch ? 'No matching conversations' : 'No conversations yet'}
              </strong>
              <span>
                {historySearch
                  ? 'Try a different search.'
                  : 'Your questions and answers will appear here.'}
              </span>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`history-conversation${
                  conversation.id === conversationId ? ' is-active' : ''
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <span className="history-conversation-content">
                  <span className="history-conversation-title">
                    {conversation.title || 'Untitled conversation'}
                  </span>
                  <span className="history-conversation-meta">
                    {getMessageCount(conversation)}{' '}
                    {getMessageCount(conversation) === 1 ? 'message' : 'messages'}
                    {' • '}
                    {formatConversationTime(conversation.updated_at)}
                  </span>
                </span>

                <span className="history-conversation-more" aria-hidden="true">
                  <IconMore />
                </span>
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          className="history-new-chat"
          onClick={handleNewConversation}
        >
          <span>+</span>
          New chat
        </button>
      </aside>

      <div className="stage">
        <header className="topbar">
          <div className="brand">
            <h1>Knowledge workspace</h1>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className={`document-viewer-toggle${showDocumentViewer ? ' is-active' : ''}`}
              onClick={() => setShowDocumentViewer((open) => !open)}
              disabled={!file}
              aria-pressed={showDocumentViewer}
            >
              {showDocumentViewer ? 'Hide document' : 'View document'}
            </button>

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-pressed={isLight}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span className={`theme-toggle-knob ${isLight ? 'is-light' : ''}`}>
                {isLight ? <IconSun /> : <IconMoon />}
              </span>
              <span className="theme-toggle-label">{isLight ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        <div className="workspace">
          <section id="workspace" className="hero-panel">
            <div className="hero-stage">
              <KnowledgeSphere theme={theme} />
              <div className="hero-copy">
                <h2>Ask the corpus.<br />Keep every answer cited.</h2>
              </div>
            </div>

            {(answerHistory.length > 0 || answer) && (
              <div ref={conversationViewportRef} className="conversation-viewport">
                <div className="conversation-thread">
                  {[...answerHistory, ...(answer ? [answer] : [])].map((result, resultIndex) => (
                    <div className="conversation-exchange" key={resultIndex}>
                      {result.question && (
                        <div
                          ref={resultIndex === answerHistory.length ? latestQuestionRef : null}
                          className="conversation-message conversation-message-user"
                        >
                          <div className="conversation-message-label">You</div>
                          <div className="conversation-message-content">
                            {result.question}
                          </div>
                        </div>
                      )}

                      <div className="conversation-message conversation-message-assistant">
                        <div className="conversation-message-label">Assistant</div>
                        <div className="conversation-message-content">
                          {renderMarkdown(result.answer)}
                        </div>
                      </div>

                      <div className="answer-section">
                        <div
                          id={resultIndex === answerHistory.length ? "sources" : undefined}
                          className="sources-heading"
                        >
                          <div>
                            <p className="eyebrow">Sources</p>
                          </div>

                          <div className="sources-heading-right">
                            <span>
                              {result.citations?.length ?? 0} reference
                              {result.citations?.length === 1 ? '' : 's'}
                            </span>

                            {result.citations?.length > 0 && (
                              <button
                                type="button"
                                className="sources-toggle"
                                aria-label={
                                  expandedSources[resultIndex]
                                    ? 'Collapse sources'
                                    : 'Expand sources'
                                }
                                aria-expanded={Boolean(expandedSources[resultIndex])}
                                onClick={() =>
                                  setExpandedSources((current) => ({
                                    ...current,
                                    [resultIndex]: !current[resultIndex],
                                  }))
                                }
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d={
                                      expandedSources[resultIndex]
                                        ? 'm6 14 6-6 6 6'
                                        : 'm6 10 6 6 6-6'
                                    }
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {expandedSources[resultIndex] && (
                          <>
                            {result.citations?.length > 0 ? (
                              <div className="citation-list">
                                {result.citations.map((citation, index) => (
                                  <div
                                    className="citation-card"
                                    key={citation.chunk_id || `${citation.source}-${index}`}
                                  >
                                    <div className="citation-bullet" />
                                    <div className="citation-content">
                                      {citation.excerpt && (
                                        <p className="citation-excerpt">
                                          {formatHumanReadableExcerpt(citation.excerpt)}
                                        </p>
                                      )}

                                      <div className="citation-meta">
                                        {currentDocument?.file_name ? (
                                          <span>Document: {currentDocument.file_name}</span>
                                        ) : null}
                                        <span>Page {citation.page || index + 1}</span>
                                        <span className="source-type">Verified reference</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-citations">
                                No reference sources returned for this response.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="composer-area">
              <form id="query" className="ask-bar" onSubmit={handleQuery}>
                {file && (
                  <div className="query-selected-file">
                    <span className="query-selected-file-name">{file.name}</span>
                    <span className="query-selected-file-type">
                      {file.type || 'File'}
                    </span>
                    <button
                      type="button"
                      className="query-selected-file-remove"
                      aria-label="Remove document"
                      data-tooltip="Remove document"
                      onClick={handleRemoveDocument}
                    >
                      ×
                    </button>
                  </div>
                )}

                <label className="query-attach" title="Attach document">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    hidden
                  />
                  <span>+</span>
                </label>

                <textarea
                  className="query-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder="What would you like to know about this document?"
                  rows="2"
                />

                {queryError && (
                  <div className="query-inline-error">
                    {queryError}
                  </div>
                )}

                <div className="ask-meta">
                  <button
                    className="query-submit"
                    type="submit"
                    disabled={queryLoading}
                    aria-label={queryLoading ? 'Searching' : 'Send question'}
                  >
                    {queryLoading ? (
                      <span className="spinner" />
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 19V5M6.5 10.5 12 5l5.5 5.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </section>

          {showDocumentViewer && (
            <aside className="document-viewer" aria-label="Document viewer">
              <div className="document-viewer-header">
                <div>
                  <p className="eyebrow">Document viewer</p>
                  <h2>{documentPreview?.name || 'No document'}</h2>
                </div>

                <button
                  type="button"
                  className="document-viewer-close"
                  onClick={() => setShowDocumentViewer(false)}
                  aria-label="Close document viewer"
                >
                  ×
                </button>
              </div>

              <div className="document-viewer-body">
                {!documentPreview && (
                  <div className="document-viewer-empty">
                    Upload a document to preview it here.
                  </div>
                )}

                {documentPreview?.kind === 'pdf' && (
                  <iframe
                    className="document-preview-frame"
                    src={documentPreview.url}
                    title={documentPreview.name}
                  />
                )}

                {documentPreview?.kind === 'image' && (
                  <div className="document-image-preview">
                    <img
                      src={documentPreview.url}
                      alt={documentPreview.name}
                    />
                  </div>
                )}

                {documentPreview?.kind === 'markdown' && (
                  <div className="document-text-preview document-markdown-preview">
                    {renderMarkdown(documentPreview.content)}
                  </div>
                )}

                {documentPreview?.kind === 'csv' && (
                  <pre className="document-text-preview">
                    {documentPreview.content}
                  </pre>
                )}

                {documentPreview?.kind === 'json' && (
                  <pre className="document-text-preview">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(documentPreview.content),
                          null,
                          2
                        )
                      } catch {
                        return documentPreview.content
                      }
                    })()}
                  </pre>
                )}

                {documentPreview?.kind === 'text' && (
                  <pre className="document-text-preview">
                    {documentPreview.content}
                  </pre>
                )}

                {documentPreview?.kind === 'unsupported' && (
                  <div className="document-viewer-empty">
                    <strong>Preview unavailable</strong>
                    <span>
                      {documentPreview.type} files cannot be previewed directly
                      in the browser.
                    </span>
                  </div>
                )}
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  )
}

export default App