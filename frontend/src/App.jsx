import { useState, useEffect } from 'react'
import './styles.css'

function App() {
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DOCUMENT INTELLIGENCE</p>
          <h1>RAG Platform</h1>
          <p className="subtitle">
            Upload, process, and query your document corpus.
          </p>
        </div>

        <div className={`health-pill ${health?.ok ? 'healthy' : ''}`}>
          <span className="dot" />
          {health?.ok ? 'Services healthy' : 'Checking services'}
        </div>
      </header>

      <main className="content">
        <div className="grid">
          <div className="card upload-card">
            <p className="eyebrow">INGESTION</p>
            <h2>Upload document</h2>

            <form onSubmit={handleSubmit}>
              <label>
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional title"
                />
              </label>

              <label>
                Document
                <input
                  type="file"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <p className="file-selected">
                  Selected: {file.name}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload document'}
              </button>
            </form>

            {status && (
              <div className="status">
                {status}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-heading">
              <p className="eyebrow">API</p>

              <a
                className="docs-link"
                href="/docs"
                target="_blank"
                rel="noreferrer"
              >
                Swagger UI ↗
              </a>
            </div>

            <h2>Backend status</h2>

            <div className="service-list">
              {health?.services ? (
                Object.entries(health.services).map(([name, value]) => (
                  <div key={name} className="service-row">
                    <span>{name}</span>
                    <span className={value.ok ? 'ok' : 'bad'}>
                      {value.ok ? 'OK' : 'Unavailable'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">
                  Loading service status...
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card documents-card">
          <p className="eyebrow">CURRENT UPLOAD</p>
          <h2>Document</h2>

          {documents.length === 0 ? (
            <p className="muted">
              No document uploaded in this session.
            </p>
          ) : (
            <div className="table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>File</th>
                    <th>Type</th>
                    <th>Versions</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.document_id || doc.id}>
                      <td>{doc.title || '—'}</td>
                      <td>{doc.filename || doc.file_name || '—'}</td>
                      <td>{doc.mime_type || '—'}</td>
                      <td>{doc.versions?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card query-card">
          <p className="eyebrow">RAG QUERY</p>
          <h2>Ask your documents</h2>

          <form onSubmit={handleQuery}>
            <label>
              Question
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the uploaded documents..."
                rows="4"
              />
            </label>

            <button type="submit" disabled={queryLoading}>
              {queryLoading ? 'Searching...' : 'Ask question'}
            </button>
          </form>

          {queryError && (
            <div className="query-error">
              {queryError}
            </div>
          )}

          {answer && (
            <div className="answer-section">
              <div className="answer-header">
                <h3>Answer</h3>

                {answer.abstained ? (
                  <span className="answer-badge abstained">
                    Abstained
                  </span>
                ) : (
                  <span className="answer-badge">
                    Answered
                  </span>
                )}
              </div>

              <div className="answer-box">
                {answer.answer}
              </div>

              <div className="answer-meta">
                <span>
                  Confidence:{' '}
                  {answer.confidence !== null &&
                  answer.confidence !== undefined
                    ? answer.confidence.toFixed(3)
                    : '—'}
                </span>

                <span>
                  Retrieved chunks: {answer.retrieved_chunks}
                </span>

                <span>
                  Model: {answer.model || '—'}
                </span>
              </div>

              <h3 className="sources-title">
                Citations
              </h3>

              {answer.citations?.length > 0 ? (
                <div className="citation-list">
                  {answer.citations.map((citation, index) => (
                    <div
                      className="citation-card"
                      key={
                        citation.chunk_id ||
                        `${citation.source}-${index}`
                      }
                    >
                      <div className="citation-header">
                        <strong>
                          {citation.source || `SOURCE ${index + 1}`}
                        </strong>

                        {citation.page && (
                          <span>
                            Page {citation.page}
                          </span>
                        )}
                      </div>

                      {citation.excerpt && (
                        <p className="citation-excerpt">
                          {citation.excerpt}
                        </p>
                      )}

                      <div className="citation-meta">
                        {citation.document_id && (
                          <span>
                            Document: {citation.document_id}
                          </span>
                        )}

                        {citation.version_id && (
                          <span>
                            Version: {citation.version_id}
                          </span>
                        )}

                        {citation.chunk_id && (
                          <span>
                            Chunk: {citation.chunk_id}
                          </span>
                        )}

                        <span>
                          {citation.is_generated
                            ? 'Generated'
                            : 'Retrieved source'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No citations returned.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App