import { useEffect, useState } from 'react'

async function readJson(response) {
  const text = await response.text()

  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { detail: text }
  }

  if (!response.ok) {
    throw new Error(data?.detail || `Request failed (${response.status})`)
  }

  return data
}

function App() {
  // Frontend-only state.
  // This starts empty on every page load/refresh.
  const [documents, setDocuments] = useState([])

  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)

  const loadHealth = async () => {
    try {
      const data = await readJson(await fetch('/health'))
      setHealth(data)
    } catch (error) {
      setHealth({
        ok: false,
        error: error.message,
      })
    }
  }

  // Only load backend health.
  // IMPORTANT: Do NOT load /api/v1/documents here.
  useEffect(() => {
    loadHealth()
  }, [])

  const upload = async (event) => {
    event.preventDefault()

    if (!file) {
      setStatus('Select a document first.')
      return
    }

    setLoading(true)
    setStatus('Uploading and queueing document…')

    try {
      const body = new FormData()

      body.append('file', file)

      if (title.trim()) {
        body.append('title', title.trim())
      }

      body.append('permissions', '[]')
      body.append('metadata_json', '{}')

      // Upload using the existing backend endpoint.
      const uploadedDocument = await readJson(
        await fetch('/api/v1/documents', {
          method: 'POST',
          body,
        })
      )

      // IMPORTANT:
      // Display ONLY the document returned by this upload.
      //
      // If another document was previously displayed,
      // it is replaced rather than appended.
      setDocuments([uploadedDocument])

      setStatus('Document uploaded successfully.')

      setFile(null)
      setTitle('')

      event.target.reset()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DOCUMENT INTELLIGENCE</p>

          <h1>RAG Platform</h1>

          <p className="subtitle">
            Upload, process, and inspect your document corpus.
          </p>
        </div>

        <div
          className={`health-pill ${
            health?.ok ? 'healthy' : ''
          }`}
        >
          <span className="dot" />

          {health?.ok
            ? 'Services healthy'
            : 'Checking services'}
        </div>
      </header>

      <main className="content">
        <section className="grid">
          {/* Upload */}
          <div className="card upload-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">INGESTION</p>

                <h2>Upload document</h2>
              </div>
            </div>

            <form onSubmit={upload}>
              <label>
                Title

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional title"
                />
              </label>

              <label>
                Document

                <input
                  type="file"
                  onChange={(e) =>
                    setFile(e.target.files?.[0] || null)
                  }
                />
              </label>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Uploading…'
                  : 'Upload document'}
              </button>
            </form>

            {status && (
              <p className="status">
                {status}
              </p>
            )}
          </div>

          {/* Backend status */}
          <div className="card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">API</p>

                <h2>Backend status</h2>
              </div>

              <a
                className="docs-link"
                href="/docs"
                target="_blank"
                rel="noreferrer"
              >
                Swagger UI ↗
              </a>
            </div>

            <div className="service-list">
              {health?.services ? (
                Object.entries(health.services).map(
                  ([name, value]) => (
                    <div
                      className="service-row"
                      key={name}
                    >
                      <span>{name}</span>

                      <span
                        className={
                          value.ok ? 'ok' : 'bad'
                        }
                      >
                        {value.ok
                          ? 'OK'
                          : 'Unavailable'}
                      </span>
                    </div>
                  )
                )
              ) : (
                <p className="muted">
                  Loading service status…
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Current uploaded document only */}
        <section className="card documents-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CURRENT UPLOAD</p>

              <h2>Document</h2>
            </div>
          </div>

          {documents.length === 0 ? (
            <p className="muted">
              No document uploaded in this session.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
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
                    <tr key={doc.id}>
                      <td>
                        {doc.title || 'Untitled'}
                      </td>

                      <td>
                        {doc.file_name || '—'}
                      </td>

                      <td>
                        {doc.mime_type || '—'}
                      </td>

                      <td>
                        {doc.versions?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App