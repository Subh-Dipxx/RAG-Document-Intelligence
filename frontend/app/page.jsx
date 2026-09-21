'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mammoth from 'mammoth'
import { parsePPTXToSlides } from 'pptx-json-parser'
import LoginPage from '../components/LoginPage'
import * as XLSX from 'xlsx'

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

function parseCsvContent(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i++
      }
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((currentRow) =>
    currentRow.some((value) => value.trim() !== '')
  )
}

function formatJsonKey(key) {
  if (key === null || key === undefined) return ''

  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderJsonValue(value, key = null, level = 0) {
  if (value === null || typeof value !== 'object') {
    return (
      <div className="document-json-row" key={key ?? level}>
        {key !== null && <span className="document-json-key">{formatJsonKey(key)}</span>}
        <span className="document-json-value">
          {value === null ? '—' : String(value)}
        </span>
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="document-json-group" key={key ?? level}>
        {key !== null && (
          <div className="document-json-section-title">{formatJsonKey(key)}</div>
        )}
        <div className="document-json-array">
          {value.map((item, index) => (
            <div className="document-json-item" key={index}>
              {renderJsonValue(item, null, level + 1)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="document-json-group" key={key ?? level}>
      {key !== null && (
        <div className="document-json-section-title">{key}</div>
      )}
      <div className="document-json-fields">
        {Object.entries(value).map(([childKey, childValue]) =>
          renderJsonValue(childValue, childKey, level + 1)
        )}
      </div>
    </div>
  )
}

function renderPptxElement(element) {
  if (!element) return null

  const style = {
    position: 'absolute',
    left: element.left,
    top: element.top,
    width: element.width,
    height: element.height,
    transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
  }

  if (element.type === 'text') {
    return (
      <div
        key={element.id}
        className="pptx-element pptx-text-element"
        style={{
          ...style,
          color: element.defaultColor,
          fontFamily: element.defaultFontName,
          fontSize: element.fontSize,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          textAlign: element.textAlign,
          lineHeight: element.lineHeight,
        }}
        dangerouslySetInnerHTML={{ __html: element.content || '' }}
      />
    )
  }

  if (element.type === 'image') {
    return (
      <img
        key={element.id}
        className="pptx-element pptx-image-element"
        src={element.src}
        alt={element.alt || 'Presentation image'}
        style={{
          ...style,
          objectFit: element.objectFit || 'cover',
        }}
      />
    )
  }

  if (element.type === 'shape') {
    return (
      <div
        key={element.id}
        className="pptx-element pptx-shape-element"
        style={{
          ...style,
          background: element.fill || 'transparent',
          border:
            element.outline?.width
              ? `${element.outline.width}px ${element.outline.style || 'solid'} ${element.outline.color || '#000'}`
              : 'none',
        }}
      >
        {element.text?.content ? (
          <div
            className="pptx-shape-text"
            style={{
              color: element.text.defaultColor,
              fontFamily: element.text.defaultFontName,
              textAlign: element.text.align || 'center',
            }}
            dangerouslySetInnerHTML={{ __html: element.text.content }}
          />
        ) : null}
      </div>
    )
  }

  if (element.type === 'table') {
    return (
      <div
        key={element.id}
        className="pptx-element pptx-table-element"
        style={style}
      >
        <table>
          <tbody>
            {(element.data || []).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {(row || []).map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {typeof cell === 'string'
                      ? cell
                      : cell?.text || cell?.content || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}

function renderPptxSlide(slide) {
  if (!slide) return null

  const background =
    slide.background?.type === 'solid'
      ? slide.background.color
      : '#ffffff'

  return (
    <div
      className="pptx-slide"
      style={{ background }}
    >
      {(slide.elements || []).map(renderPptxElement)}
    </div>
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
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [theme, setTheme] = useState('dark')

  const handleLogin = (accessToken, loggedInUsername) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('username', loggedInUsername)
    setToken(accessToken)
    setUsername(loggedInUsername)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    setShowLogoutConfirm(false)
    setShowProfileMenu(false)
    setToken(null)
    setUsername(null)
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUsername = localStorage.getItem('username')

    setToken(storedToken)
    setUsername(storedUsername)
    setAuthReady(true)
  }, [])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    setDocuments((current) => {
      const unique = deduplicateDocuments(current)

      if (unique.length === current.length) {
        return current
      }

      return unique
    })
  }, [documents])


  const deduplicateDocuments = (items) => {
    const sorted = [...(Array.isArray(items) ? items : [])].sort((a, b) => {
      const aTime = new Date(
        a?.updated_at || a?.created_at || 0
      ).getTime()

      const bTime = new Date(
        b?.updated_at || b?.created_at || 0
      ).getTime()

      return bTime - aTime
    })

    const seenHashes = new Set()
    const seenNames = new Set()
    const unique = []

    for (const document of sorted) {
      const versions = Array.isArray(document?.versions)
        ? document.versions
        : []

      const hashes = versions
        .map((version) => version?.file_hash)
        .filter(Boolean)

      const fileName = String(
        document?.file_name ||
        document?.filename ||
        document?.title ||
        ''
      )
        .trim()
        .toLowerCase()

      const hasDuplicateHash = hashes.some((hash) =>
        seenHashes.has(hash)
      )

      const hasDuplicateName =
        fileName && seenNames.has(fileName)

      if (hasDuplicateHash || hasDuplicateName) {
        continue
      }

      hashes.forEach((hash) => seenHashes.add(hash))

      if (fileName) {
        seenNames.add(fileName)
      }

      unique.push(document)
    }

    return unique
  }

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historySort, setHistorySort] = useState('recent')

  const [question, setQuestion] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [answerHistory, setAnswerHistory] = useState([])
  const [conversationMessages, setConversationMessages] = useState([])
  const conversationViewportRef = useRef(null)
  const latestQuestionRef = useRef(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')
  const [expandedSources, setExpandedSources] = useState({})
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
const [pendingDeleteDocument, setPendingDeleteDocument] = useState(null)
const [deletingDocument, setDeletingDocument] = useState(false)
const [deleteError, setDeleteError] = useState('')


  const [showChangePassword, setShowChangePassword] = useState(false)
const [showChangeUsername, setShowChangeUsername] = useState(false)
const [newUsername, setNewUsername] = useState('')
const [usernamePassword, setUsernamePassword] = useState('')
const [usernameChanging, setUsernameChanging] = useState(false)
const [usernameMessage, setUsernameMessage] = useState('')
const [usernameError, setUsernameError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
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
          throw new Error(
            data?.detail ||
            rawBody ||
            `Failed to load conversations (${res.status})`
          )
        }

        const conversationList = Array.isArray(data) ? data : []

        const conversationsWithCounts = await Promise.all(
          conversationList.map(async (conversation) => {
            if (typeof conversation.message_count === 'number') {
              return conversation
            }

            try {
              const detailRes = await fetch(
                `/api/v1/chat/${conversation.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )

              if (!detailRes.ok) {
                return {
                  ...conversation,
                  message_count: 0,
                }
              }

              const detail = await detailRes.json()

              return {
                ...conversation,
                message_count: Array.isArray(detail.messages)
                  ? detail.messages.length
                  : 0,
              }
            } catch (error) {
              console.error(
                `Failed to load message count for conversation ${conversation.id}:`,
                error
              )

              return {
                ...conversation,
                message_count: 0,
              }
            }
          })
        )

        setConversations(conversationsWithCounts)
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      }
    }

    fetchConversations()
  }, [token])

  const fetchDocuments = async () => {
    if (!token) return []

    try {
      const res = await fetch('/api/v1/documents?skip=0&limit=100', {
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
        return []
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || rawBody || `Failed to load documents (${res.status})`
        )
      }

      const uniqueDocuments = []
      const seenIds = new Set()

      for (const document of Array.isArray(data) ? data : []) {
        const docId = document?.document_id || document?.id
        if (docId) {
          if (seenIds.has(docId)) {
            continue
          }
          seenIds.add(docId)
        }
        uniqueDocuments.push(document)
      }

      uniqueDocuments.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })

      setDocuments(uniqueDocuments)
      return uniqueDocuments
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      return []
    }
  }

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
    setSelectedDocument(null)
    setDocumentPreview(null)
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

  if (extension === 'html' || extension === 'htm') {
    objectUrl = URL.createObjectURL(
      new Blob([await file.arrayBuffer()], { type: 'text/html' })
    )

    setDocumentPreview({
      kind: 'html',
      url: objectUrl,
      name,
      type: 'text/html',
    })

    return
  }

  if (
    extension === 'pptx' ||
    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    const arrayBuffer = await file.arrayBuffer()
    const slides = await parsePPTXToSlides(arrayBuffer)

    setDocumentPreview({
      kind: 'pptx',
      slides,
      slideIndex: 0,
      name,
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })

    return
  }

  if (
  extension === 'docx' ||
  type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })

  setDocumentPreview({
    kind: 'docx',
    content: result.value,
    name,
    type: 'text/html',
  })

  return
}

if (
  extension === 'xlsx' ||
  extension === 'xls' ||
  type ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
  type === 'application/vnd.ms-excel'
) {
  const arrayBuffer = await file.arrayBuffer()

  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
  })

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]

    return {
      name: sheetName,
      rows: XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      }),
    }
  })

  setDocumentPreview({
    kind: 'xlsx',
    sheets,
    sheetIndex: 0,
    name,
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
  const performUpload = async (fileToUpload = file) => {
    if (!fileToUpload) {
      setStatus('Please select a file.')
      return null
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
        return null
      }

      if (!res.ok) {
        throw new Error(data?.detail || rawBody || `Upload failed (${res.status})`)
      }

      if (!data) {
        throw new Error('The server returned an invalid response.')
      }

      setSelectedDocument(data)
      setDocuments((prev) => {
        const docId = data.document_id || data.id
        const filtered = Array.isArray(prev) ? prev.filter((d) => (d.document_id || d.id) !== docId) : []
        return [data, ...filtered]
      })
      setStatus('Document uploaded successfully.')
      setTitle('')
      setQueryError('')
      await fetchDocuments()
      return data
    } catch (err) {
      console.error(err)
      setStatus(err.message || 'Upload failed.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e, fileToUpload = file) => {
    e?.preventDefault()
    try {
      await performUpload(fileToUpload)
      setQuestion('')
    } catch {
      /* Status updated in performUpload */
    }
  }

  const handleQuery = async (e) => {
    e.preventDefault()

    if (!question.trim()) {
      setQueryError('Please enter a question.')
      return
    }

    let targetDoc = selectedDocument

    if (!targetDoc && file) {
      try {
        targetDoc = await performUpload(file)
      } catch (err) {
        setQueryError(err.message || 'Failed to upload attached document.')
        return
      }
    }


       setQueryLoading(true)
    setQueryError('')

    if (answer) {
      setAnswerHistory((history) => [...history, answer])
    }

    setAnswer(null)

    const history = conversationMessages
  .filter((message) => {
    // Without an active document, do not leak previous
    // document-grounded assistant responses into normal chat.
    if (selectedDocument) {
      return true
    }

    if (message.role !== 'assistant') {
      return true
    }

    const hasCitations =
      Array.isArray(message.citations) && message.citations.length > 0

    const hasRetrievedChunks =
      Number(message.metadata?.retrieved_chunks || 0) > 0

    return !hasCitations && !hasRetrievedChunks
  })
  .filter((message) => message?.role && message?.content)
  .map((message) => ({
    role: message.role,
    content: String(message.content),
  }))

    const filters = {}

    if (targetDoc) {
      const targetDocId = targetDoc.document_id || targetDoc.id

      if (targetDocId) {
        filters.document_id = targetDocId
      }
    }

    const submittedQuestion = question.trim()

    setPendingQuestion(submittedQuestion)
    setQuestion('')
    setQueryLoading(true)
    setQueryError('')
    setAnswer(null)

    // Allow React to paint the submitted question and thinking indicator
    // before starting the API request.
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))

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
          top_k: 10,
          filters,
          history,
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
      setPendingQuestion('')
      setConversationId(data.conversation_id || null)

      // Refresh Chat History with the real number of stored messages.
      try {
        const historyRes = await fetch('/api/v1/chat', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (historyRes.ok) {
          const historyData = await historyRes.json()
          const conversationList = Array.isArray(historyData)
            ? historyData
            : []

          const refreshedConversations = await Promise.all(
            conversationList.map(async (conversation) => {
              try {
                const detailRes = await fetch(
                  `/api/v1/chat/${conversation.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                )

                if (!detailRes.ok) {
                  return conversation
                }

                const detail = await detailRes.json()

                return {
                  ...conversation,
                  message_count: Array.isArray(detail.messages)
                    ? detail.messages.length
                    : 0,
                }
              } catch {
                return conversation
              }
            })
          )

          setConversations(refreshedConversations)
        }
      } catch (historyError) {
        console.error(
          'Failed to refresh chat history:',
          historyError
        )
      }

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

    const normalizedValue =
      typeof value === 'string' && !/[zZ]|[+-]\\d{2}:\\d{2}$/.test(value)
        ? `${value.replace(' ', 'T')}Z`
        : value

    const date = new Date(normalizedValue)
    if (Number.isNaN(date.getTime())) return ''

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    )

    if (seconds < 60) {
      return 'just now'
    }

    const minutes = Math.floor(seconds / 60)

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }

    const hours = Math.floor(minutes / 60)

    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }

    const days = Math.floor(hours / 24)

    if (days < 7) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }

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

  
  const handleDeleteDocument = async () => {
  if (!pendingDeleteDocument || deletingDocument) {
    return
  }

  const documentId = pendingDeleteDocument.id

  setDeleteError('')
  setDeletingDocument(true)

  try {
    const res = await fetch(
      `/api/v1/documents/${documentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (res.status === 401) {
      handleLogout()
      return
    }

    if (!res.ok) {
      const rawBody = await res.text()
      let data = null

      try {
        data = JSON.parse(rawBody)
      } catch {
        data = null
      }

      throw new Error(
        data?.detail ||
        rawBody ||
        `Failed to delete document (${res.status})`
      )
    }

    if (
      (selectedDocument?.document_id || selectedDocument?.id) === documentId ||
      (file && (
        file.name === pendingDeleteDocument.name
      )) ||
      (documentPreview && (
        documentPreview.name === pendingDeleteDocument.name
      ))
    ) {
      handleRemoveDocument()
    }

    await fetchDocuments()

    setPendingDeleteDocument(null)
    setDeleteError('')
  } catch (err) {
    console.error('Failed to delete document:', err)
    setDeleteError(
      err.message || 'Failed to delete the document.'
    )
  } finally {
    setDeletingDocument(false)
  }
}

const handleChangeUsername = async (event) => {
  event.preventDefault()

  setUsernameError('')
  setUsernameMessage('')

  const trimmedUsername = newUsername.trim()

  if (!trimmedUsername) {
    setUsernameError('Please enter a new username.')
    return
  }

  if (trimmedUsername === username) {
    setUsernameError(
      'New username must be different from the current username.'
    )
    return
  }

  if (!usernamePassword) {
    setUsernameError('Please enter your current password.')
    return
  }

  setUsernameChanging(true)

  try {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('auth_token')

    if (!token) {
      throw new Error('Your session has expired. Please log in again.')
    }

    const response = await fetch('/api/v1/auth/change-username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        new_username: trimmedUsername,
        current_password: usernamePassword,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data?.detail || 'Unable to change username.'
      )
    }

    const updatedUsername =
      data?.username || trimmedUsername

    localStorage.setItem('username', updatedUsername)
    setUsername(updatedUsername)

    setNewUsername('')
    setUsernamePassword('')
    setUsernameMessage(
      data?.message || 'Username changed successfully.'
    )

    setTimeout(() => {
      setShowChangeUsername(false)
      setUsernameMessage('')
    }, 1500)
  } catch (error) {
    setUsernameError(
      error?.message || 'Unable to change username.'
    )
  } finally {
    setUsernameChanging(false)
  }
}

const handleChangePassword = async (event) => {
    event.preventDefault()

    setPasswordError('')
    setPasswordMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        'New password must be different from the current password.'
      )
      return
    }

    setPasswordChanging(true)

    try {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('auth_token')

      if (!token) {
        throw new Error('Your session has expired. Please log in again.')
      }

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

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Unable to change password.'
        )
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage(
        data?.message || 'Password changed successfully.'
      )

      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordMessage('')
      }, 1500)
    } catch (error) {
      setPasswordError(
        error?.message || 'Unable to change password.'
      )
    } finally {
      setPasswordChanging(false)
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

  const currentDocument = file
    ? {
        ...selectedDocument,
        file_name: file.name,
        title: selectedDocument?.title || file.name,
        mime_type: file.type || selectedDocument?.mime_type || 'application/octet-stream',
      }
    : selectedDocument
      ? {
          ...selectedDocument,
          file_name:
            selectedDocument.file_name ||
            selectedDocument.filename ||
            selectedDocument.title ||
            'Unknown file',
        }
      : null

  const activeDocument = currentDocument
    ? {
        name:
          currentDocument.file_name ||
          currentDocument.title ||
          'Selected document',
        type: currentDocument.mime_type || 'Document',
      }
    : null

  if (!authReady) {
    return <div className="auth-loading-screen" />
  }

  if (!token) {
    return (
      <LoginPage
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  const isLight = theme === 'light'

  return (
    <div
      className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      data-theme={theme}
    >
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
          opacity: 1;
          cursor: not-allowed;
          color: var(--muted);
          border-color: var(--border-strong);
          background: rgba(255, 255, 255, 0.04);
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
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <span>☰</span>
        </button>
        <button
          type="button"
          className="sidebar-new-chat"
          onClick={handleNewConversation}
        >
          <span className="sidebar-new-chat-icon">+</span>
          <span className="sidebar-new-chat-text">New Chat</span>
        </button>
        
        <button
          type="button"
          className="sidebar-history"
          aria-label="Open Chat History"
          onClick={() => setShowChatHistory(true)}
        >
          <IconChatHistory />
          <span className="sidebar-history-text">Chat History</span>
        </button>
<button
          type="button"
          className="sidebar-documents"
          aria-label="Open Documents"
          onClick={() => {
            setShowDocuments(true)
            fetchDocuments()
          }}
        >
          <span className="sidebar-documents-icon">▣</span>
          <span className="sidebar-documents-text">Documents</span>
        </button>

        <div className="sidebar-profile">
          {showProfileMenu && (
            <div className="sidebar-profile-menu">
              <div className="sidebar-profile-menu-user">
                <div className="sidebar-profile-menu-avatar">
                  <span>{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                </div>
                <span>{username || 'User'}</span>
              </div>

              <div className="sidebar-profile-menu-divider" />

              <button
                type="button"
                className="sidebar-profile-settings"
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowSettings(true)
                }}
              >
                <span className="sidebar-profile-settings-icon">⚙</span>
                <span>Settings</span>
              </button>

              <button
                type="button"
                className="sidebar-profile-logout"
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowLogoutConfirm(true)
                }}
              >
                <IconLogout />
                <span>Logout</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="sidebar-profile-avatar"
            onClick={() => setShowProfileMenu((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <span>{username ? username.charAt(0).toUpperCase() : 'U'}</span>
          </button>

          <span className="sidebar-profile-name">
            {username || 'User'}
          </span>

          <button
            type="button"
            className="sidebar-profile-theme"
            onClick={toggleTheme}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? <IconMoon /> : <IconSun />}
          </button>
        </div>
      </aside>


      {pendingDeleteDocument && (
  <div
    className="delete-confirm-overlay"
    onClick={() => {
      if (!deletingDocument) {
        setPendingDeleteDocument(null)
        setDeleteError('')
      }
    }}
  >
    <div
      className="delete-confirm-panel"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="delete-confirm-title">
        Delete document?
      </div>

      <div className="delete-confirm-document">
        {pendingDeleteDocument.name}
      </div>

      <div className="delete-confirm-message">
        Are you sure you want to delete this document?
      </div>

      {deleteError && (
        <div className="delete-confirm-error">
          {deleteError}
        </div>
      )}

      <div className="delete-confirm-actions">
        <button
          type="button"
          className="delete-confirm-cancel"
          onClick={() => {
            if (!deletingDocument) {
              setPendingDeleteDocument(null)
              setDeleteError('')
            }
          }}
          disabled={deletingDocument}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-confirm-delete"
          onClick={handleDeleteDocument}
          disabled={deletingDocument}
        >
          {deletingDocument ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)}

{showSettings && (
        <div
          className="settings-overlay"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="settings-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-header">
              <div>
                <h2>Settings</h2>
                <p>Manage your application preferences</p>
              </div>

              <button
                type="button"
                className="settings-close"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="settings-content">
              <div className="settings-section">
                <h3>Appearance</h3>

                <div className="settings-row">
                  <div>
                    <div className="settings-row-title">Theme</div>
                    <div className="settings-row-description">
                      Switch between light and dark mode.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="settings-theme-button"
                    onClick={toggleTheme}
                  >
                    {isLight ? 'Dark mode' : 'Light mode'}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3>Account</h3>

                {!showChangeUsername ? (
  <div className="settings-row settings-account-action">
    <div>
      <div className="settings-row-title">Username</div>
      <div className="settings-row-description">
        Your current account name.
      </div>
    </div>

    <div className="settings-action-group">
      <span className="settings-value">
        {username || 'User'}
      </span>

      <button
        type="button"
        className="settings-theme-button"
        onClick={() => {
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
        {usernameChanging ? 'Changing...' : 'Change Username'}
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
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          className="logout-confirm-backdrop"
          role="presentation"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-confirm-content">
              <h2 id="logout-confirm-title">Log out of DocGPT?</h2>

              <p className="logout-confirm-user">
                {username || 'User'}
              </p>

              <p className="logout-confirm-message">
                Are you sure you want to logout?
              </p>
            </div>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-primary logout-confirm-button"
                onClick={handleLogout}
              >
                Log out
              </button>

              <button
                type="button"
                className="logout-confirm-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDocuments && (
        <button
          type="button"
          className="documents-backdrop"
          aria-label="Close Documents"
          onClick={() => setShowDocuments(false)}
        />
      )}

      <aside
        className={`documents-drawer${showDocuments ? ' is-open' : ''}`}
        aria-label="Documents"
      >
        <div className="documents-drawer-header">
          <div>
            <p className="eyebrow">Documents</p>
            <h2>Your documents</h2>
          </div>

          <button
            type="button"
            className="documents-drawer-close"
            onClick={() => setShowDocuments(false)}
            aria-label="Close Documents"
          >
            ×
          </button>
        </div>

        <div className="documents-drawer-list">
          {documents.length > 0 ? (
            documents.map((document) => (
              <div
                className="document-list-item"
                key={document.document_id || document.id}
              >
                <button
                  type="button"
                  className="document-list-select"
                  onClick={async () => {
                    const documentId = document.document_id || document.id

                    setShowDocuments(false)
                    setQueryError('')
                    setSelectedDocument(document)

                    setDocuments((prev) => {
                      const filtered = Array.isArray(prev) ? prev.filter((d) => (d.document_id || d.id) !== documentId) : []
                      return [document, ...filtered]
                    })

                    requestAnimationFrame(() => {
                      document
                        .getElementById('query')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        })
                    })

                    try {
                      const res = await fetch(
                        `/api/v1/documents/${documentId}/content`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      )

                      if (res.ok) {
                        const blob = await res.blob()
                        const selectedFile = new File(
                          [blob],
                          document.file_name || document.title || 'document',
                          {
                            type:
                              document.mime_type ||
                              blob.type ||
                              'application/octet-stream',
                          }
                        )

                        setFile(selectedFile)
                        setShowDocumentViewer(false)
                      }
                    } catch (err) {
                      console.error('Failed to load document content:', err)
                    }
                  }}
                >
                  <span className="document-list-icon">▤</span>
                  <span className="document-list-content">
                    <span className="document-list-title">
                      {document.title || document.file_name || 'Untitled document'}
                    </span>
                    <span className="document-list-filename">
                      {document.file_name || 'Unknown file'}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="document-list-delete"
                  aria-label={`Delete ${document.file_name || 'document'}`}
                  title="Delete document"
                  onClick={(e) => {
                    e.stopPropagation()

                    const documentId =
                      document.document_id || document.id

                    setDeleteError('')

                    setPendingDeleteDocument({
                      id: documentId,
                      name:
                        document.file_name ||
                        document.title ||
                        'this document',
                    })
                  }}
                >
                  <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="documents-empty">
              <span className="documents-empty-icon">▤</span>
              <p>No documents uploaded yet.</p>
            </div>
          )}
        </div>
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

      </aside>

      <div className="stage">
        <header className="topbar">
          <div className="brand">
            <h1>DocGPT</h1>
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

            {(answerHistory.length > 0 || answer || pendingQuestion) && (
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

                      {result.citations?.length > 0 && (
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
                                {result.citations.length} reference
                                {result.citations.length === 1 ? '' : 's'}
                              </span>

                              {result.citations.length > 0 && (
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
                      )}
                    </div>
                  ))}

                  {pendingQuestion && (
                    <div className="conversation-exchange pending-exchange">
                      <div
                        ref={latestQuestionRef}
                        className="conversation-message conversation-message-user"
                      >
                        <div className="conversation-message-label">You</div>
                        <div className="conversation-message-content">
                          {pendingQuestion}
                        </div>
                      </div>

                      {queryLoading && (
                        <div className="conversation-message conversation-message-assistant conversation-thinking">
                          <div className="conversation-message-label">Assistant</div>
                          <div className="conversation-message-content">
                            <div className="thinking-indicator" aria-label="Thinking">
                              <span />
                              <span />
                              <span />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="composer-area">
              <form id="query" className="ask-bar" onSubmit={handleQuery}>
                {activeDocument && (
                  <div className="query-selected-file">
                    <span className="query-selected-file-name">{activeDocument.name}</span>
                    <span className="query-selected-file-type">
                      {activeDocument.type || 'File'}
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

                {documentPreview?.kind === 'pptx' && (
                  <div className="document-pptx-preview">
                    {documentPreview.slides?.length > 0 ? (
                      <>
                        <div className="pptx-slide-stage">
                          {renderPptxSlide(
                            documentPreview.slides[documentPreview.slideIndex || 0]
                          )}
                        </div>

                        <div className="pptx-controls">
                          <button
                            type="button"
                            onClick={() =>
                              setDocumentPreview((preview) => ({
                                ...preview,
                                slideIndex: Math.max(
                                  0,
                                  (preview.slideIndex || 0) - 1
                                ),
                              }))
                            }
                            disabled={(documentPreview.slideIndex || 0) === 0}
                          >
                            Previous
                          </button>

                          <span>
                            Slide {(documentPreview.slideIndex || 0) + 1} of{' '}
                            {documentPreview.slides.length}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setDocumentPreview((preview) => ({
                                ...preview,
                                slideIndex: Math.min(
                                  preview.slides.length - 1,
                                  (preview.slideIndex || 0) + 1
                                ),
                              }))
                            }
                            disabled={
                              (documentPreview.slideIndex || 0) ===
                              documentPreview.slides.length - 1
                            }
                          >
                            Next
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="document-viewer-empty">
                        <strong>Preview unavailable</strong>
                        <span>No readable slides were found in this presentation.</span>
                      </div>
                    )}
                  </div>
                )}
                {documentPreview?.kind === 'xlsx' && (
  <div className="document-xlsx-preview">
    <div className="xlsx-sheet-tabs">
      {documentPreview.sheets.map((sheet, index) => (
        <button
          key={sheet.name}
          type="button"
          className={
            index === (documentPreview.sheetIndex || 0)
              ? 'xlsx-sheet-tab active'
              : 'xlsx-sheet-tab'
          }
          onClick={() =>
            setDocumentPreview((preview) => ({
              ...preview,
              sheetIndex: index,
            }))
          }
        >
          {sheet.name}
        </button>
      ))}
    </div>

    <div className="document-csv-preview">
      <table className="document-csv-table document-xlsx-table">
        <tbody>
          {(
            documentPreview.sheets[
              documentPreview.sheetIndex || 0
            ]?.rows || []
          ).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <td key={columnIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

                {documentPreview?.kind === 'docx' && (
                  <div
                    className="document-text-preview document-docx-preview"
                    dangerouslySetInnerHTML={{
                      __html: documentPreview.content,
                    }}
                  />
                )}

                {documentPreview?.kind === 'html' && (
                  <div className="document-text-preview document-html-preview">
                    <iframe
                      className="document-html-frame"
                      src={documentPreview.url}
                      title={documentPreview.name}
                    />
                  </div>
                )}    
                {documentPreview?.kind === 'csv' && (
                  <div className="document-csv-preview">
                    <table className="document-csv-table">
                      <thead>
                        <tr>
                          {(parseCsvContent(documentPreview.content)[0] || []).map(
                            (header, index) => (
                              <th key={index}>{header}</th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {parseCsvContent(documentPreview.content)
                          .slice(1)
                          .map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {(parseCsvContent(documentPreview.content)[0] || []).map(
                                (_, columnIndex) => (
                                  <td key={columnIndex}>
                                    {row[columnIndex] ?? ''}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {documentPreview?.kind === 'json' && (
                  <div className="document-json-preview">
                    {(() => {
                      try {
                        const parsed = JSON.parse(documentPreview.content)
                        return renderJsonValue(parsed)
                      } catch {
                        return (
                          <pre className="document-text-preview">
                            {documentPreview.content}
                          </pre>
                        )
                      }
                    })()}
                  </div>
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