'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
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
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')

  useEffect(() => {
    const stored = readStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

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

        if (!res.ok) {
          throw new Error(`Failed to load conversations (${res.status})`)
        }

        const data = await res.json()
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
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        console.error('Failed to fetch health:', err)
        setHealth(null)
      }
    }

    fetchHealth()
  }, [])

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
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

      formData.append('file', file)

      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Upload failed')
      }

      setDocuments([data])
      setStatus('Document uploaded successfully.')
      setFile(null)
      setTitle('')
      setAnswer(null)
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
          question: question.trim(),
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

      setAnswer(data)
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

      const answerResults = assistantMessages.map((message) => ({
        conversation_id: data.id,
        answer: message.content,
        citations: message.citations || [],
        abstained: message.metadata?.abstained || false,
        confidence: message.metadata?.confidence ?? null,
        retrieved_chunks: message.metadata?.retrieved_chunks ?? 0,
        model: message.metadata?.model || null,
      }))

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
          <a href="#library" title="Library">
            <IconFile />
          </a>
          <a href="#query" title="Ask">
            <IconAsk />
          </a>
          <a href="#sources" title="Sources">
            <IconSources />
          </a>
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
            <p className="eyebrow">Document intelligence</p>
            <h1>Knowledge workspace</h1>
          </div>
          <div className="topbar-actions">
            <div className={`health-pill ${health?.ok ? 'healthy' : ''}`}>
              <span className="dot" />
              {health?.ok ? 'Systems online' : 'Checking services'}
            </div>
            <span className="stack-chip">BGE · pgvector · Gemini</span>
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
                <p className="hero-kicker">Grounded retrieval</p>
                <h2>Ask the corpus.<br />Keep every answer cited.</h2>
              </div>
            </div>

            {(answerHistory.length > 0 || answer) && (
              <div className="conversation-viewport">
                {[...answerHistory, ...(answer ? [answer] : [])].map((result, resultIndex) => (
                  <div className="answer-section" key={resultIndex}>
                  <div className="answer-header">
                    <div>
                      <p className="eyebrow">Result</p>
                      <h3>Answer</h3>
                    </div>
                    <span className={`answer-badge ${result.abstained ? 'abstained' : ''}`}>
                      <i /> {result.abstained ? 'Abstained' : 'Grounded answer'}
                    </span>
                  </div>

                <div className="answer-box">{result.answer}</div>

                <div className="answer-meta">
                  <div className="metric">
                    <span>Confidence</span>
                    <strong>
                      {result.confidence !== null && result.confidence !== undefined
                        ? result.confidence.toFixed(3)
                        : '—'}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Retrieved chunks</span>
                    <strong>{result.retrieved_chunks}</strong>
                  </div>
                  <div className="metric">
                    <span>Model</span>
                    <strong>{result.model || '—'}</strong>
                  </div>
                </div>

                <div id={resultIndex === answerHistory.length ? "sources" : undefined} className="sources-heading">
                  <div>
                    <p className="eyebrow">Provenance</p>
                    <h3>Source citations</h3>
                  </div>                  <span>{result.citations?.length ?? 0} source{result.citations?.length === 1 ? '' : 's'}</span>
                </div>

                {result.citations?.length > 0 ? (
                  <div className="citation-list">
                    {result.citations.map((citation, index) => (
                      <div className="citation-card" key={citation.chunk_id || `${citation.source}-${index}`}>
                        <div className="citation-number">{index + 1}</div>
                        <div className="citation-content">
                          <div className="citation-header">
                            <strong>{citation.source || `SOURCE ${index + 1}`}</strong>
                            {citation.page && <span>Page {citation.page}</span>}
                          </div>
                          {citation.excerpt && <p className="citation-excerpt">{citation.excerpt}</p>}
                          <div className="citation-meta">
                            {citation.document_id && <span>Document {citation.document_id}</span>}
                            {citation.version_id && <span>Version {citation.version_id}</span>}
                            {citation.chunk_id && <span>Chunk {citation.chunk_id}</span>}
                            <span className="source-type">{citation.is_generated ? 'Generated' : 'Retrieved source'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-citations">No citations returned for this response.</div>
                )}
                  </div>
                ))}
              </div>
            )}

            <form id="query" className="ask-bar" onSubmit={handleQuery}>
              <label className="ask-field">
                <span>Question</span>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this document?"
                  rows="2"
                />
              </label>
              <div className="ask-meta">
                <span className="query-hint">
                  {documents.length ? 'Searching the active File' : 'Upload a File to enable document-grounded queries'}
                </span>
                <button className="primary-button" type="submit" disabled={queryLoading}>
                  {queryLoading ? (
                    <>
                      <span className="spinner" />
                      Searching...
                    </>
                  ) : (
                    'Ask question'
                  )}
                </button>
              </div>
            </form>

            {queryError && (
              <div className="query-error">
                <span>!</span>
                {queryError}
              </div>
            )}
          </section>

          <aside className="rail">
            <section id="library" className="panel library-panel">
              <div className="panel-heading">
                <p className="eyebrow">Library</p>
                <h2>Active File</h2>
              </div>

              {!currentDocument ? (
                <div className="empty-state">
                  <strong>No File uploaded yet</strong>
                  <span>Ingest a document to ground later answers.</span>
                </div>
              ) : (
                <div className="document-info">
                  <div className="document-file-icon">{(currentDocument.mime_type || "").split("/")[1]?.toUpperCase() || "FILE"}</div>
                  <div className="document-main">
                    <strong>{currentDocument.title || 'Untitled document'}</strong>
                    <span>{currentDocument.filename || currentDocument.file_name || '—'}</span>
                  </div>
                  <div className="document-meta-row">
                    <div className="document-detail">
                      <small>Type</small>
                      <strong>{currentDocument.mime_type || 'application/pdf'}</strong>
                    </div>
                    <div className="document-detail">
                      <small>Versions</small>
                      <strong>{currentDocument.versions?.length ?? 0}</strong>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="upload-form">
                <label className="field upload-field">
                  <span>Document title <small>Optional</small></span>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product specification" />
                </label>

                <label className={`upload-zone${file ? ' has-file' : ''}${loading ? ' is-loading' : ''}`}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                  />
                  <span className="upload-icon"><IconUpload /></span>
                  <strong>{file ? file.name : 'Choose a file'}</strong>
                  <span>{file ? 'Ready to ingest' : 'Click to browse files'}</span>
                </label>

                {file && (
                  <div className="selected-file">
                    <span className="file-badge">{file?.name?.split(".").pop()?.toUpperCase() || "FILE"}</span>
                    <div className="selected-file-meta">
                      <strong>{file.name}</strong>
                      <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                    <span className="file-ready-pill">Ready</span>
                  </div>
                )}

                <button className="primary-button full-width upload-submit" type="submit" disabled={loading}>
                  {loading ? (<><span className="spinner" />Uploading...</>) : 'Upload document'}
                </button>
              </form>

              {status && (
                <div
                  className={`status${
                    status.toLowerCase().includes('success')
                      ? ' success'
                      : loading || status.toLowerCase().includes('uploading')
                        ? ' pending'
                        : ' error'
                  }`}
                >
                  <span>
                    {status.toLowerCase().includes('success')
                      ? '✓'
                      : loading || status.toLowerCase().includes('uploading')
                        ? '…'
                        : '!'}
                  </span>
                  {status}
                </div>
              )}
            </section>

  
            <section className="panel system-card">
              <div className="panel-heading">
                <p className="eyebrow">System</p>
                <h2>Service status</h2>
              </div>
              <div className="system-summary">
                <span className={`status-orb ${health?.ok ? 'online' : ''}`} />
                <div>
                  <strong>{health?.ok ? 'System ready' : 'Checking system'}</strong>
                  <span>{health?.ok ? 'Ready to process your file' : 'Connecting to backend services'}</span>
                </div>
              </div>
              <div className="service-list">
                {health?.services ? (
                  Object.entries(health.services).map(([name, value]) => (
                    <div key={name} className="service-row">
                      <span>{name}</span>
                      <span className={value.ok ? 'ok' : 'bad'}><i /> {value.ok ? 'Operational' : 'Unavailable'}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Loading service status...</p>
                )}
              </div>
              <a className="docs-link" href="/docs" target="_blank" rel="noreferrer">
                Open API documentation <span>↗</span>
              </a>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App