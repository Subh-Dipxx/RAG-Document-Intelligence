'use client'

import { useState, useEffect } from 'react'
import LoginPage from '../components/LoginPage'

function App() {
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)

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

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')

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
    setAnswer(null)

    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          top_k: 5,
          filters: documents.length > 0
            ? {
                document_id: documents[0].document_id || documents[0].id,
              }
            : {},
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Query failed')
      }

      setAnswer(data)
    } catch (err) {
      console.error(err)
      setQueryError(err.message || 'Query failed.')
    } finally {
      setQueryLoading(false)
    }
  }

  const currentDocument = documents[0]

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <p className="eyebrow">DOCUMENT INTELLIGENCE</p>
            <h1>RAG Platform</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <div className={`health-pill ${health?.ok ? 'healthy' : ''}`}>
            <span className="dot" />
            {health?.ok ? 'All systems operational' : 'Checking services'}
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <section className="hero">
          <div>
            <p className="hero-kicker">PDF-FOCUSED RAG</p>
            <h2>Ask questions.<br /><span>Get grounded answers.</span></h2>
            <p className="hero-copy">
              Upload a PDF and query its content with answers grounded in
              retrieved document context and source citations.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{documents.length}</strong>
              <span>Active document</span>
            </div>
            <div>
              <strong>{answer?.retrieved_chunks ?? 0}</strong>
              <span>Retrieved chunks</span>
            </div>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="card upload-card">
            <div className="section-heading">
              <div className="section-icon">↑</div>
              <div>
                <p className="eyebrow">INGESTION</p>
                <h2>Upload PDF</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field">
                <span>Title <small>Optional</small></span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product specification"
                />
              </label>

              <label className="upload-zone">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                />
                <span className="upload-icon">PDF</span>
                <strong>{file ? file.name : 'Choose a PDF document'}</strong>
                <span>{file ? 'Ready to upload' : 'Click to browse your files'}</span>
              </label>

              {file && (
                <div className="selected-file">
                  <span className="file-badge">PDF</span>
                  <div>
                    <strong>{file.name}</strong>
                    <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                </div>
              )}

              <button className="primary-button full-width" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Uploading...
                  </>
                ) : (
                  <>Upload document <span>→</span></>
                )}
              </button>
            </form>

            {status && (
              <div className={`status ${status.toLowerCase().includes('success') ? 'success' : ''}`}>
                <span>{status.toLowerCase().includes('success') ? '✓' : '!'}</span>
                {status}
              </div>
            )}
          </section>

          <section className="card system-card">
            <div className="section-heading">
              <div className="section-icon">◉</div>
              <div>
                <p className="eyebrow">SYSTEM</p>
                <h2>Service status</h2>
              </div>
            </div>

            <div className="system-summary">
              <span className={`status-orb ${health?.ok ? 'online' : ''}`} />
              <div>
                <strong>{health?.ok ? 'System ready' : 'Checking system'}</strong>
                <span>{health?.ok ? 'Ready to process your PDF' : 'Connecting to backend services'}</span>
              </div>
            </div>

            <div className="service-list">
              {health?.services ? (
                Object.entries(health.services).map(([name, value]) => (
                  <div key={name} className="service-row">
                    <span>{name}</span>
                    <span className={value.ok ? 'ok' : 'bad'}>
                      <i /> {value.ok ? 'Operational' : 'Unavailable'}
                    </span>
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
        </div>

        <section className="card document-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CURRENT DOCUMENT</p>
              <h2>Active PDF</h2>
            </div>
            {currentDocument && <span className="ready-badge">Ready</span>}
          </div>

          {!currentDocument ? (
            <div className="empty-state">
              <div className="empty-icon">PDF</div>
              <strong>No PDF uploaded yet</strong>
              <span>Upload a document above to start asking questions.</span>
            </div>
          ) : (
            <div className="document-info">
              <div className="document-file-icon">PDF</div>
              <div className="document-main">
                <strong>{currentDocument.title || 'Untitled document'}</strong>
                <span>{currentDocument.filename || currentDocument.file_name || '—'}</span>
              </div>
              <div className="document-detail">
                <small>TYPE</small>
                <strong>{currentDocument.mime_type || 'application/pdf'}</strong>
              </div>
              <div className="document-detail">
                <small>VERSIONS</small>
                <strong>{currentDocument.versions?.length ?? 0}</strong>
              </div>
            </div>
          )}
        </section>

        <section className="card query-card">
          <div className="query-intro">
            <div>
              <p className="eyebrow">RAG QUERY</p>
              <h2>Ask your document</h2>
              <p>Questions are answered using retrieved content from the active PDF.</p>
            </div>
            <div className="query-badge">BGE + pgvector + Gemini</div>
          </div>

          <form onSubmit={handleQuery}>
            <label className="field">
              <span>Question</span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about this document?"
                rows="4"
              />
            </label>

            <div className="query-actions">
              <span className="query-hint">
                {documents.length ? 'Searching the active PDF' : 'Upload a PDF to enable document-grounded queries'}
              </span>
              <button className="primary-button" type="submit" disabled={queryLoading}>
                {queryLoading ? (
                  <>
                    <span className="spinner" />
                    Searching...
                  </>
                ) : (
                  <>Ask question <span>→</span></>
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

          {answer && (
            <div className="answer-section">
              <div className="answer-header">
                <div>
                  <p className="eyebrow">RESULT</p>
                  <h3>Answer</h3>
                </div>
                <span className={`answer-badge ${answer.abstained ? 'abstained' : ''}`}>
                  <i /> {answer.abstained ? 'Abstained' : 'Grounded answer'}
                </span>
              </div>

              <div className="answer-box">
                {answer.answer}
              </div>

              <div className="answer-meta">
                <div className="metric">
                  <span>CONFIDENCE</span>
                  <strong>
                    {answer.confidence !== null && answer.confidence !== undefined
                      ? answer.confidence.toFixed(3)
                      : '—'}
                  </strong>
                </div>
                <div className="metric">
                  <span>RETRIEVED CHUNKS</span>
                  <strong>{answer.retrieved_chunks}</strong>
                </div>
                <div className="metric">
                  <span>MODEL</span>
                  <strong>{answer.model || '—'}</strong>
                </div>
              </div>

              <div className="sources-heading">
                <div>
                  <p className="eyebrow">PROVENANCE</p>
                  <h3>Source citations</h3>
                </div>
                <span>{answer.citations?.length ?? 0} source{answer.citations?.length === 1 ? '' : 's'}</span>
              </div>

              {answer.citations?.length > 0 ? (
                <div className="citation-list">
                  {answer.citations.map((citation, index) => (
                    <div
                      className="citation-card"
                      key={citation.chunk_id || `${citation.source}-${index}`}
                    >
                      <div className="citation-number">{index + 1}</div>
                      <div className="citation-content">
                        <div className="citation-header">
                          <strong>{citation.source || `SOURCE ${index + 1}`}</strong>
                          {citation.page && <span>Page {citation.page}</span>}
                        </div>

                        {citation.excerpt && (
                          <p className="citation-excerpt">{citation.excerpt}</p>
                        )}

                        <div className="citation-meta">
                          {citation.document_id && <span>Document {citation.document_id}</span>}
                          {citation.version_id && <span>Version {citation.version_id}</span>}
                          {citation.chunk_id && <span>Chunk {citation.chunk_id}</span>}
                          <span className="source-type">
                            {citation.is_generated ? 'Generated' : 'Retrieved source'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-citations">
                  No citations returned for this response.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>RAG Document Intelligence</span>
        <span>PDF ingestion • Retrieval • Grounded generation</span>
      </footer>
    </div>
  )
}

export default App
