'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mammoth from 'mammoth'
import { parsePPTXToSlides } from 'pptx-json-parser'
import LoginPage from '../components/LoginPage'
import ChartRenderer from '../components/ChartRenderer'
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

function formatCategoryName(str) {
  if (!str || typeof str !== 'string') return 'Processing'

  const trimmed = str
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return trimmed || 'Processing'
}


function getContentFieldBadgeInfo(field) {
  const name = String(field || '').trim()

  if (!name) {
    return {
      label: 'Processing',
      icon: '📁',
    }
  }

  const icons = [
    '📚',
    '📰',
    '💻',
    '📊',
    '🔬',
    '🎨',
    '⚖️',
    '🌐',
    '🧪',
    '📖',
    '🗂️',
    '🧭',
  ]

  let hash = 0

  for (let i = 0; i < name.length; i += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }

  const icon = icons[Math.abs(hash) % icons.length]

  return {
    label: name,
    icon,
  }
}

function getDocumentFormatLabel(doc) {
  const name = doc?.file_name || doc?.title || ''
  const parts = name.split('.')
  if (parts.length > 1) {
    const ext = parts.pop()?.toUpperCase() || ''
    if (ext.length >= 1 && ext.length <= 5 && ext !== name.toUpperCase()) {
      return ext
    }
  }
  const mime = (doc?.mime_type || doc?.detected_mime_type || '').toLowerCase()
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word') || mime.includes('docx')) return 'DOCX'
  if (mime.includes('excel') || mime.includes('xlsx') || mime.includes('spreadsheet')) return 'XLSX'
  if (mime.includes('powerpoint') || mime.includes('pptx') || mime.includes('presentation')) return 'PPTX'
  if (mime.includes('csv')) return 'CSV'
  if (mime.includes('html')) return 'HTML'
  if (mime.includes('image')) return 'IMG'
  if (mime.includes('text/plain')) return 'TXT'
  return 'FILE'
}

function getDocumentContentField(doc) {
  const meta = doc?.metadata || {}

  const candidates = [
    meta.category,
    meta.domain,
    meta.field,
    meta.topic,
    ...(Array.isArray(meta.tags) ? meta.tags : []),
  ]

  const value = candidates.find(
    (item) =>
      typeof item === 'string' &&
      item.trim()
  )

  if (value) {
    return formatCategoryName(value)
  }

  return 'Processing'
}

function sortCategories(entries) {
  if (!Array.isArray(entries)) return []

  return [...entries].sort(([aKey = ''], [bKey = '']) =>
    String(aKey || '').localeCompare(String(bKey || ''))
  )
}

function extractDocumentContentTopics(doc) {
  const meta = doc?.metadata || {}
  const topics = []

  if (Array.isArray(meta.tags)) {
    meta.tags.forEach((t) => topics.push(String(t)))
  }
  if (Array.isArray(meta.topics)) {
    meta.topics.forEach((t) => topics.push(String(t)))
  }
  if (meta.subject) topics.push(String(meta.subject))

  if (Array.isArray(meta.columns) && meta.columns.length > 0) {
    meta.columns.slice(0, 4).forEach((c) => topics.push(`Field: ${c}`))
  } else if (Array.isArray(meta.fields) && meta.fields.length > 0) {
    meta.fields.slice(0, 4).forEach((f) => topics.push(`Field: ${f}`))
  }

  if (topics.length === 0) {
    const rawName = (doc?.title || doc?.file_name || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
    const words = rawName
      .split(/\s+/)
      .filter(
        (w) =>
          w.length >= 2 &&
          !['document', 'file', 'untitled', 'sheet', 'data', 'test', 'pdf', 'docx', 'xlsx', 'txt'].includes(w.toLowerCase())
      )

    if (words.length > 0) {
      words.forEach((w) => topics.push(formatCategoryName(w)))
    } else {
      topics.push('Content Summary', 'Key Insights')
    }
  }

  return Array.from(new Set(topics))
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

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return {}
  }
}

function App() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [accountType, setAccountType] = useState(null)

  const [authReady, setAuthReady] = useState(false)
  const [theme, setTheme] = useState('dark')

  const handleLogin = (accessToken, loggedInUsername) => {
    const claims = decodeJwtPayload(accessToken)
    const nextUsername = claims.username || loggedInUsername || null
    const nextRole = claims.role || null
    const nextTenantId = claims.tenant_id || null
    const nextAccountType = claims.account_type || null

    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("username", nextUsername || "")
    localStorage.setItem("role", nextRole || "")
    localStorage.setItem("tenant_id", nextTenantId || "")
    localStorage.setItem("account_type", nextAccountType || "")

    setToken(accessToken)
    setUsername(nextUsername)
    setRole(nextRole)
    setTenantId(nextTenantId)
    setAccountType(nextAccountType)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('tenant_id')
    localStorage.removeItem('account_type')
    setRole(null)
    setTenantId(null)
    setAccountType(null)
    setAccessRequestDocument(null)
    setAccessRequestStatus({})
    setAccessRequests([])
    setAccessRequestError('')
    setShowLogoutConfirm(false)
    setShowProfileMenu(false)
    setToken(null)
    setUsername(null)
  }

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('access_token')
      const storedUsername = localStorage.getItem('username')

      setToken(storedToken)
      setUsername(storedUsername)

      if (storedToken) {
        const claims = decodeJwtPayload(storedToken)
        setRole(claims.role || localStorage.getItem('role') || null)
        setTenantId(claims.tenant_id || localStorage.getItem('tenant_id') || null)
        setAccountType(claims.account_type || localStorage.getItem('account_type') || null)
      }
    } catch (err) {
      console.error('Error loading stored auth:', err)
    }

    setAuthReady(true)
  }, [])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [documents, setDocuments] = useState([])




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

    const seenKeys = new Set()
    const unique = []

    for (const document of sorted) {
      const versions = Array.isArray(document?.versions)
        ? document.versions
        : []

      const currentVersion =
        versions.find((version) => version?.is_current) ||
        versions[0] ||
        null

      const fileHash =
        document?.content_hash ||
        document?.file_hash ||
        currentVersion?.file_hash ||
        null

      const fileName = String(
        document?.file_name ||
        document?.filename ||
        document?.title ||
        ''
      )
        .trim()
        .toLowerCase()

      const fileSize = Number(document?.file_size || 0)
      const mimeType = String(document?.mime_type || '').toLowerCase()

      const duplicateKey = fileHash
        ? `hash:${fileHash}`
        : `file:${fileName}:${fileSize}:${mimeType}`

      if (seenKeys.has(duplicateKey)) {
        continue
      }

      seenKeys.add(duplicateKey)
      unique.push(document)
    }

    return unique
  }

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [documentSearch, setDocumentSearch] = useState('')
  const [showDocumentFilters, setShowDocumentFilters] = useState(false)

  const [expandedDocFields, setExpandedDocFields] = useState({})
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
  const [showOrganizationSection, setShowOrganizationSection] = useState(false)

  useEffect(() => {
    if (!showProfileMenu) {
      return
    }

    const handleOutsideProfileClick = (event) => {
      const profileArea = event.target.closest('.sidebar-profile')

      if (!profileArea) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('click', handleOutsideProfileClick)

    return () => {
      document.removeEventListener('click', handleOutsideProfileClick)
    }
  }, [showProfileMenu])

  const [showSettings, setShowSettings] = useState(false)
  const [showChangeOrganization, setShowChangeOrganization] = useState(false)
  const [settingsSection, setSettingsSection] = useState('account')
  const [organizationName, setOrganizationName] = useState('')
  const [newOrganizationName, setNewOrganizationName] = useState('')
  const [organizationCurrentPassword, setOrganizationCurrentPassword] = useState('')

  const [myOrganizations, setMyOrganizations] = useState([])
  const [loadingMyOrganizations, setLoadingMyOrganizations] = useState(false)
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState(null)
  const [organizationSwitchError, setOrganizationSwitchError] = useState('')

  const [adminOrganizations, setAdminOrganizations] = useState([])
  const [loadingAdminOrganizations, setLoadingAdminOrganizations] = useState(false)
  const [pendingDeleteOrganization, setPendingDeleteOrganization] = useState(null)
  const [deleteOrganizationPassword, setDeleteOrganizationPassword] = useState('')
  const [deleteOrganizationPasswordVisible, setDeleteOrganizationPasswordVisible] = useState(false)
  const [deletingOrganizationId, setDeletingOrganizationId] = useState(null)
  const [deleteOrganizationError, setDeleteOrganizationError] = useState('')
  const [organizationNameSaving, setOrganizationNameSaving] = useState(false)
  const [organizationNameMessage, setOrganizationNameMessage] = useState('')
  const [organizationNameError, setOrganizationNameError] = useState('')
const [pendingDeleteDocument, setPendingDeleteDocument] = useState(null)
const [deletingDocument, setDeletingDocument] = useState(false)
const [deleteError, setDeleteError] = useState('')

  const [accessRequestDocument, setAccessRequestDocument] = useState(null)
  const [requestingAccess, setRequestingAccess] = useState(false)
  const [accessRequestStatus, setAccessRequestStatus] = useState({})
  const [accessRequests, setAccessRequests] = useState([])
  const [loadingAccessRequests, setLoadingAccessRequests] = useState(false)
  const [accessRequestError, setAccessRequestError] = useState('')
  const [organizationMembers, setOrganizationMembers] = useState([])
  const [loadingOrganizationMembers, setLoadingOrganizationMembers] = useState(false)

  const organizationAdminMember =
    organizationMembers.find((member) => member?.role === 'admin') || null

  const organizationAdminName =
    organizationAdminMember?.username ||
    organizationAdminMember?.email ||
    'Organization Admin'

  const organizationSidebarMembers =
    role === 'admin'
      ? organizationMembers.map((member) => ({
          key:
            member?.user_id ||
            member?.email ||
            member?.username,
          name:
            member?.username ||
            member?.email ||
            'Organization Member',
          role: member?.role === 'admin' ? 'ADMIN' : 'MEMBER',
        }))
      : [
          {
            key:
              organizationAdminMember?.user_id ||
              'organization-admin',
            name: organizationAdminName,
            role: 'ADMIN',
          },
          {
            key: 'current-member',
            name: username || 'Current Member',
            role: 'MEMBER',
          },
        ]
  const [showOrganizationMembers, setShowOrganizationMembers] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [invitingMember, setInvitingMember] = useState(false)
  const [memberInviteError, setMemberInviteError] = useState('')
  const [memberInviteMessage, setMemberInviteMessage] = useState('')
  const [deletingOrganizationMemberId, setDeletingOrganizationMemberId] = useState(null)
  const [organizationMemberDeleteError, setOrganizationMemberDeleteError] = useState('')
  const [pendingOrganizationInvitations, setPendingOrganizationInvitations] = useState([])
  const [loadingOrganizationInvitations, setLoadingOrganizationInvitations] = useState(false)
  const [invitationActionId, setInvitationActionId] = useState(null)
  const [invitationActionError, setInvitationActionError] = useState('')





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

  const fetchMyOrganizations = async () => {
    if (!token || accountType !== 'organization') {
      setMyOrganizations([])
      return []
    }

    setLoadingMyOrganizations(true)
    setOrganizationSwitchError('')

    try {
      const res = await fetch(
        '/api/v1/organization-members/my-organizations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await res.json().catch(() => [])

      if (res.status === 401) {
        handleLogout()
        return []
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          `Failed to load organizations (${res.status})`
        )
      }

      const organizations = Array.isArray(data) ? data : []

      setMyOrganizations(organizations)

      return organizations
    } catch (error) {
      console.error('Failed to load organizations:', error)
      setOrganizationSwitchError(
        error?.message || 'Failed to load organizations.'
      )
      return []
    } finally {
      setLoadingMyOrganizations(false)
    }
  }

  const fetchAdminOrganizations = async () => {
    if (!token) {
      setAdminOrganizations([])
      return []
    }

    setLoadingAdminOrganizations(true)
    setDeleteOrganizationError('')

    try {
      const res = await fetch('/api/v1/account-management/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => [])

      if (res.status === 401) {
        handleLogout()
        return []
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          `Failed to load organizations you administer (${res.status})`
        )
      }

      const organizations = Array.isArray(data) ? data : []
      setAdminOrganizations(organizations)
      return organizations
    } catch (error) {
      console.error('Failed to load admin organizations:', error)
      setDeleteOrganizationError(
        error?.message || 'Failed to load organizations you administer.'
      )
      return []
    } finally {
      setLoadingAdminOrganizations(false)
    }
  }

  const openDeleteOrganization = (organization) => {
    if (!organization?.organization_id) {
      return
    }

    if (organization.organization_id === tenantId) {
      setDeleteOrganizationError(
        'Switch to another organization before deleting this organization.'
      )
      return
    }

    setPendingDeleteOrganization(organization)
    setDeleteOrganizationPassword('')
    setDeleteOrganizationPasswordVisible(false)
    setDeleteOrganizationError('')
  }

  const closeDeleteOrganization = () => {
    if (deletingOrganizationId) {
      return
    }

    setPendingDeleteOrganization(null)
    setDeleteOrganizationPassword('')
    setDeleteOrganizationPasswordVisible(false)
    setDeleteOrganizationError('')
  }

  const deleteOrganization = async () => {
    const organization = pendingDeleteOrganization

    if (!token || !organization?.organization_id) {
      return
    }

    if (organization.organization_id === tenantId) {
      setDeleteOrganizationError(
        'Switch to another organization before deleting this organization.'
      )
      return
    }

    if (!deleteOrganizationPassword) {
      setDeleteOrganizationError(
        'Enter the password for the account that administers this organization.'
      )
      return
    }

    setDeletingOrganizationId(organization.organization_id)
    setDeleteOrganizationError('')

    try {
      const res = await fetch(
        `/api/v1/account-management/organizations/${encodeURIComponent(
          organization.organization_id
        )}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: deleteOrganizationPassword,
          }),
        }
      )

      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          `Failed to delete organization (${res.status})`
        )
      }

      const deletedId = organization.organization_id

      setAdminOrganizations((current) =>
        current.filter((item) => item.organization_id !== deletedId)
      )
      setMyOrganizations((current) =>
        current.filter((item) => item.organization_id !== deletedId)
      )

      setPendingDeleteOrganization(null)
      setDeleteOrganizationPassword('')
      setDeleteOrganizationPasswordVisible(false)
      setDeleteOrganizationError('')

      await fetchAdminOrganizations()
      await fetchMyOrganizations()
    } catch (error) {
      console.error('Failed to delete organization:', error)
      setDeleteOrganizationError(
        error?.message || 'Failed to delete organization.'
      )
    } finally {
      setDeletingOrganizationId(null)
    }
  }

  const switchOrganization = async (organizationId) => {
    if (
      !token ||
      accountType !== 'organization' ||
      !organizationId ||
      organizationId === tenantId
    ) {
      return
    }

    setSwitchingOrganizationId(organizationId)
    setOrganizationSwitchError('')

    try {
      const res = await fetch(
        '/api/v1/organization-members/switch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            organization_id: organizationId,
          }),
        }
      )

      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          `Failed to switch organization (${res.status})`
        )
      }

      const accessToken = data?.access_token

      if (!accessToken) {
        throw new Error('Organization switch did not return an access token.')
      }

      const claims = decodeJwtPayload(accessToken)

      const nextRole = claims.role || data?.role || null
      const nextTenantId =
        claims.tenant_id || data?.organization_id || null
      const nextAccountType =
        claims.account_type || 'organization'

      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('role', nextRole || '')
      localStorage.setItem('tenant_id', nextTenantId || '')
      localStorage.setItem('account_type', nextAccountType || '')

      setToken(accessToken)
      setRole(nextRole)
      setTenantId(nextTenantId)
      setAccountType(nextAccountType)

      const switchedName =
        data?.organization_name ||
        myOrganizations.find(
          (organization) =>
            String(organization.organization_id) ===
            String(organizationId)
        )?.organization_name ||
        ''

      setOrganizationName(switchedName)
      setNewOrganizationName(switchedName)
      setOrganizationCurrentPassword('')
      setOrganizationNameError('')
      setOrganizationNameMessage('')

      setSelectedDocument(null)
      setDocuments([])
      setAccessRequests([])
      setAccessRequestStatus({})
      setOrganizationMembers([])
      setPendingOrganizationInvitations([])

      setShowSettings(false)
    } catch (error) {
      console.error('Failed to switch organization:', error)
      setOrganizationSwitchError(
        error?.message || 'Failed to switch organization.'
      )
    } finally {
      setSwitchingOrganizationId(null)
    }
  }

  const fetchOrganizationSettings = async () => {
    if (!token || accountType !== 'organization') {
      setOrganizationName('')
      setNewOrganizationName('')
      return
    }

    try {
      const res = await fetch('/api/v1/organization-members/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        return
      }

      const data = await res.json()
      const name = data?.organization_name || ''

      setOrganizationName(name)
      setNewOrganizationName(name)
    } catch (error) {
      console.error('Failed to load organization settings:', error)
    }
  }

  useEffect(() => {
    if (!token || accountType !== 'organization') {
      setMyOrganizations([])
      return
    }

    fetchMyOrganizations()
  }, [token, accountType, tenantId])

  useEffect(() => {
    if (!token) {
      setPendingOrganizationInvitations([])
      return undefined
    }

    fetchOrganizationInvitations()
    const intervalId = setInterval(fetchOrganizationInvitations, 10000)
    return () => clearInterval(intervalId)
  }, [token])

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
          data?.detail ||
          rawBody ||
          `Failed to load documents (${res.status})`
        )
      }

      const uniqueDocuments = deduplicateDocuments(
        Array.isArray(data) ? data : []
      )

      setDocuments(uniqueDocuments)
      return uniqueDocuments
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      return []
    }
  }

  const fetchOrganizationInvitations = async () => {
    if (!token) {
      setPendingOrganizationInvitations([])
      return []
    }

    setLoadingOrganizationInvitations(true)
    try {
      const res = await fetch('/api/v1/organization-members/invitations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => [])
      if (!res.ok) {
        throw new Error(data?.detail || 'Failed to load organization invitations')
      }
      const invitations = Array.isArray(data) ? data : []
      setPendingOrganizationInvitations(invitations)
      return invitations
    } catch (error) {
      console.error('Failed to fetch organization invitations:', error)
      setPendingOrganizationInvitations([])
      return []
    } finally {
      setLoadingOrganizationInvitations(false)
    }
  }

  const respondToOrganizationInvitation = async (invitationId, action) => {
    if (!token) return
    setInvitationActionId(invitationId)
    setInvitationActionError('')
    try {
      const res = await fetch(`/api/v1/organization-members/invitations/${invitationId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.detail || `Failed to ${action} organization invitation`)
      }

      await fetchOrganizationInvitations()
      if (action === 'accept') {
        setSelectedDocument(null)
        setAccountType('organization')
        localStorage.setItem('account_type', 'organization')

        if (data?.organization_id) {
          localStorage.setItem('tenant_id', data.organization_id)
          setTenantId(data.organization_id)
        }

        await fetchMyOrganizations()
        await fetchDocuments()
      }
    } catch (error) {
      setInvitationActionError(error?.message || 'Unable to process invitation')
    } finally {
      setInvitationActionId(null)
    }
  }

  const updateOrganizationName = async (event) => {
    event.preventDefault()

    if (!token || accountType !== 'organization' || role !== 'admin') {
      return
    }

    const name = newOrganizationName.trim()

    if (!name) {
      setOrganizationNameError('Organization name is required.')
      setOrganizationNameMessage('')
      return
    }

    if (!organizationCurrentPassword) {
      setOrganizationNameError('Current password is required.')
      setOrganizationNameMessage('')
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
          organization_name: name,
          current_password: organizationCurrentPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            `Failed to update organization name (${res.status})`
        )
      }

      const updatedName = data?.organization_name || name

      setOrganizationName(updatedName)
      setNewOrganizationName(updatedName)
      setOrganizationCurrentPassword('')
      setOrganizationNameMessage('Organization name updated successfully.')
      setShowChangeOrganization(false)
    } catch (error) {
      console.error('Failed to update organization name:', error)
      setOrganizationNameError(
        error?.message || 'Failed to update organization name.'
      )
    } finally {
      setOrganizationNameSaving(false)
    }
  }

  const fetchOrganizationMembers = async () => {
    if (!token || accountType !== 'organization' || role !== 'admin') {
      return []
    }

    setLoadingOrganizationMembers(true)
    setMemberInviteError('')

    try {
      const res = await fetch('/api/v1/organization-members', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const rawBody = await res.text()
      let data = []

      try {
        data = rawBody ? JSON.parse(rawBody) : []
      } catch {
        data = []
      }

      if (res.status === 401) {
        handleLogout()
        return []
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to load organization members (${res.status})`
        )
      }

      const members = Array.isArray(data) ? data : []
      setOrganizationMembers(members)
      return members
    } catch (err) {
      console.error('Failed to load organization members:', err)
      setMemberInviteError(
        err.message || 'Failed to load organization members.'
      )
      return []
    } finally {
      setLoadingOrganizationMembers(false)
    }
  }

  const deleteOrganizationMember = async (member) => {
    if (!token || role !== 'admin' || accountType !== 'organization') {
      return
    }

    if (!member?.user_id) {
      return
    }

    const confirmed = window.confirm(
      `Remove ${member.username || member.email || 'this member'} from the organization?`
    )

    if (!confirmed) {
      return
    }

    setDeletingOrganizationMemberId(member.user_id)
    setOrganizationMemberDeleteError('')

    try {
      const res = await fetch(
        `/api/v1/organization-members/${encodeURIComponent(member.user_id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const rawBody = await res.text()
        let data = null

        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch {
          // Ignore non-JSON error responses.
        }

        throw new Error(
          data?.detail ||
            rawBody ||
            `Failed to remove member (${res.status})`
        )
      }

      await fetchOrganizationMembers()
    } catch (err) {
      console.error('Failed to delete organization member:', err)
      setOrganizationMemberDeleteError(
        err.message || 'Failed to remove organization member.'
      )
    } finally {
      setDeletingOrganizationMemberId(null)
    }
  }

  const inviteOrganizationMember = async (event) => {
    event.preventDefault()

    if (!token || role !== 'admin' || accountType !== 'organization') {
      return
    }

    const email = memberEmail.trim()

    if (!email) {
      setMemberInviteError('Enter the member email address.')
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

      const rawBody = await res.text()
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to invite member (${res.status})`
        )
      }

      setMemberEmail('')
      setMemberInviteMessage(
        `${data?.username || email} has been added to the organization.`
      )

      await fetchOrganizationMembers()
    } catch (err) {
      console.error('Failed to invite organization member:', err)
      setMemberInviteError(
        err.message || 'Failed to invite organization member.'
      )
    } finally {
      setInvitingMember(false)
    }
  }

  const fetchAccessRequests = async () => {
    if (!token || accountType !== 'organization') return []

    try {
      const res = await fetch('/api/v1/access-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const rawBody = await res.text()
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }

      if (res.status === 401) {
        handleLogout()
        return []
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to load access requests (${res.status})`
        )
      }

      const requests = Array.isArray(data) ? data : []
      setAccessRequests(requests)

      setAccessRequestStatus((current) => {
        const next = { ...current }

        for (const request of requests) {
          const documentId =
            request?.document_id ||
            request?.document?.id ||
            request?.documentId

          if (documentId && request?.status) {
            next[documentId] = request.status
          }
        }

        return next
      })

      const latestByDocument = {}
      for (const request of requests) {
        const documentId =
          request?.document_id ||
          request?.document?.id ||
          request?.documentId

        if (!documentId) continue

        const current = latestByDocument[documentId]
        const currentTime = current?.created_at
          ? new Date(current.created_at).getTime()
          : 0
        const requestTime = request?.created_at
          ? new Date(request.created_at).getTime()
          : 0

        if (!current || requestTime >= currentTime) {
          latestByDocument[documentId] = request?.status || 'pending'
        }
      }

      setAccessRequestStatus((current) => ({
        ...current,
        ...latestByDocument,
      }))

      return requests
    } catch (err) {
      console.error('Failed to fetch access requests:', err)
      setAccessRequestError(
        err.message || 'Failed to load access requests.'
      )
      return []
    }
  }

  const requestDocumentAccess = async () => {
    if (!token || !accessRequestDocument || requestingAccess) return

    const documentId = accessRequestDocument.id
    setRequestingAccess(true)
    setAccessRequestError('')

    try {
      const res = await fetch('/api/v1/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
        }),
      })

      const rawBody = await res.text()
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        if (res.status === 409) {
          setAccessRequestStatus((current) => ({
            ...current,
            [documentId]: 'pending',
          }))

          const detail =
            data?.detail ||
            rawBody ||
            'An access request is already pending.'

          setAccessRequestError(detail)
          return
        }

        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to request access (${res.status})`
        )
      }

      const request = data || {
        document_id: documentId,
        status: 'pending',
      }

      setAccessRequestStatus((current) => ({
        ...current,
        [documentId]: request.status || 'pending',
      }))

      setAccessRequests((current) => [
        request,
        ...current.filter(
          (item) =>
            (item?.id || item?.request_id) !==
            (request?.id || request?.request_id)
        ),
      ])

      setAccessRequestDocument(null)
      setAccessRequestError('')
    } catch (err) {
      console.error('Failed to request document access:', err)
      setAccessRequestError(
        err.message || 'Failed to request document access.'
      )
    } finally {
      setRequestingAccess(false)
    }
  }

  const resolveAccessRequest = async (requestId, action) => {
    if (!token || !requestId || role !== 'admin') return

    setLoadingAccessRequests(true)
    setAccessRequestError('')

    try {
      const res = await fetch(
        `/api/v1/access-requests/${requestId}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const rawBody = await res.text()
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to ${action} access request (${res.status})`
        )
      }

      setAccessRequests((current) =>
        current.filter(
          (request) =>
            (request?.id || request?.request_id) !== requestId
        )
      )

      await fetchAccessRequests()
    } catch (err) {
      console.error(`Failed to ${action} access request:`, err)
      setAccessRequestError(
        err.message || `Failed to ${action} access request.`
      )
    } finally {
      setLoadingAccessRequests(false)
    }
  }

  useEffect(() => {
    if (!token || accountType !== 'organization') {
      setAccessRequests([])
      setAccessRequestStatus({})
      setOrganizationMembers([])
      return
    }

    fetchAccessRequests()

    if (role === 'admin') {
      fetchOrganizationMembers()
    } else {
      setOrganizationMembers([])
    }
  }, [token, accountType, role])

  useEffect(() => {
    if (token && accountType === 'organization') {
      const handleWindowFocus = () => {
        fetchAccessRequests()
      }

      window.addEventListener('focus', handleWindowFocus)

      return () => {
        window.removeEventListener('focus', handleWindowFocus)
      }
    }
  }, [token, accountType])

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

      const documentId = data.document_id || data.id
      let processedDocument = data
      let classificationReady = false

      setStatus('Processing document content...')

      // Wait for the asynchronous worker to finish parsing and semantic
      // classification. We only look for the presence of backend metadata;
      // we do not inspect filenames or predefined categories.
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        try {
          const detailRes = await fetch(
            `/api/v1/documents/${documentId}`,
            {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : {},
            }
          )

          if (detailRes.status === 401) {
            handleLogout()
            setStatus('Session expired. Please sign in again.')
            return null
          }

          if (!detailRes.ok) {
            continue
          }

          const refreshedDocument = await detailRes.json()

          if (refreshedDocument) {
            processedDocument = refreshedDocument
          }

          const metadata = processedDocument?.metadata || {}

          if (
            typeof metadata.category === 'string' &&
            metadata.category.trim()
          ) {
            classificationReady = true
            break
          }
        } catch (pollError) {
          console.debug(
            'Waiting for document classification:',
            pollError
          )
        }
      }

      setSelectedDocument(processedDocument)

      setDocuments((prev) => {
        const filtered = Array.isArray(prev)
          ? prev.filter(
              (d) =>
                (d.document_id || d.id) !== documentId
            )
          : []

        return deduplicateDocuments([
          processedDocument,
          ...filtered,
        ])
      })

      setStatus(
        classificationReady
          ? 'Document uploaded and classified successfully.'
          : 'Document uploaded. Classification is still processing.'
      )

      setTitle('')
      setQueryError('')

      await fetchDocuments()

      return processedDocument
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

    // Reuse the already uploaded/selected document.
    // Only upload when the attachment is actually a new document.
    if (file) {
      const selectedFileName =
        selectedDocument?.file_name ||
        selectedDocument?.filename ||
        selectedDocument?.title ||
        ''

      const selectedFileSize = Number(selectedDocument?.file_size || 0)

      const sameAsSelectedDocument =
        selectedDocument &&
        file.name === selectedFileName &&
        Number(file.size || 0) === selectedFileSize

      if (!sameAsSelectedDocument) {
        try {
          targetDoc = await performUpload(file)
        } catch (err) {
          setQueryError(
            err.message || 'Failed to upload attached document.'
          )
          return
        }
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
        if (targetDoc) {
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
      .slice(-6)
      .map((message) => {
        let content = String(message.content)

        // Preserve the exact previous chart specification so follow-ups
        // such as "change it to a line chart" remain tied to the
        // previous chart instead of expanding to the whole document.
        if (
          message.role === 'assistant' &&
          message.metadata?.chart
        ) {
          const chart = message.metadata.chart

          const chartContext = {
            chart_type: chart.chart_type ?? null,
            title: chart.title ?? null,
            x_key: chart.x_key ?? null,
            name_key: chart.name_key ?? null,
            value_key: chart.value_key ?? null,
            series: chart.series ?? [],
            data: chart.data ?? [],
          }

          content +=
            `\n[CHART_CONTEXT]\n${JSON.stringify(chartContext)}`
        }

        return {
          role: message.role,
          content,
        }
      })

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
          chart: data.chart || null,
        },
      ])
    } catch (err) {
      console.error(err)
      setQueryError(err.message || 'Query failed.')
    } finally {
      setQueryLoading(false)
    }
  }

  const approveAccessRequest = async () => {
    if (!token || !accessRequestDocument || requestingAccess) return

    setRequestingAccess(true)
    setAccessRequestError('')

    try {
      const currentRequests = await fetchAccessRequests()

      const matchingRequest = (Array.isArray(currentRequests) ? currentRequests : []).find(
        (item) => {
          const requestDocumentId =
            item?.document_id ||
            item?.document?.id ||
            item?.documentId

          return String(requestDocumentId) === String(accessRequestDocument.id)
        }
      )

      const requestId =
        matchingRequest?.id ||
        matchingRequest?.request_id

      if (!requestId) {
        throw new Error(
          'No pending access request found for this document.'
        )
      }

      const res = await fetch(
        `/api/v1/access-requests/${requestId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const rawBody = await res.text()
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }

      if (res.status === 401) {
        handleLogout()
        return
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          rawBody ||
          `Failed to grant access (${res.status})`
        )
      }

      setAccessRequestStatus((current) => ({
        ...current,
        [accessRequestDocument.id]: 'approved',
      }))

      setAccessRequestDocument(null)
      setAccessRequestError('')

      await fetchAccessRequests()
    } catch (err) {
      console.error('Failed to grant access:', err)
      setAccessRequestError(
        err.message || 'Failed to grant access.'
      )
    } finally {
      setRequestingAccess(false)
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

      if (res.status === 403 &&
          typeof data?.detail === 'string' &&
          data.detail.toLowerCase().includes('access required')
      ) {
        setPendingDeleteDocument(null)
        setAccessRequestDocument(pendingDeleteDocument)
        setAccessRequestError('')
        return
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

        {accountType === 'organization' && (
          <div className="sidebar-organization">
            <button
              type="button"
              className="sidebar-organization-toggle"
              onClick={() =>
                setShowOrganizationSection((open) => !open)
              }
              aria-expanded={showOrganizationSection}
              aria-label="Organization"
            >
              <span
                className="sidebar-organization-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 21V5.5C4 4.67 4.67 4 5.5 4H14.5C15.33 4 16 4.67 16 5.5V21"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 9H18.5C19.33 9 20 9.67 20 10.5V21"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 8H12M8 12H12M8 16H12M18 13H20M18 17H20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span className="sidebar-organization-text">
                {organizationName || 'Organization'}
              </span>

              <span
                className={`sidebar-organization-chevron ${
                  showOrganizationSection ? 'is-open' : ''
                }`}
                aria-hidden="true"
              >
                ›
              </span>
            </button>

            {showOrganizationSection && (
              <div className="sidebar-organization-members">
                {organizationSidebarMembers.map((member) => (
                  <div
                    key={member.key}
                    className="sidebar-organization-member"
                  >
                    <span className="sidebar-organization-member-name">
                      {member.name}
                    </span>

                    <span
                      className={`sidebar-organization-member-role ${
                        member.role === 'ADMIN'
                          ? 'is-admin'
                          : 'is-member'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                style={{ position: 'relative' }}
                onClick={() => {
                  setShowProfileMenu(false)
                  window.location.href = '/settings'
                }}
              >
                <span className="sidebar-profile-settings-icon">⚙</span>
                <span>Settings</span>
                {pendingOrganizationInvitations.length > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 'auto',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '999px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      lineHeight: 1,
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                    }}
                    aria-label={`${pendingOrganizationInvitations.length} pending invitation(s)`}
                  >
                    {pendingOrganizationInvitations.length}
                  </span>
                )}
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
            style={{ position: 'relative' }}
            onClick={() => setShowProfileMenu((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <span>{username ? username.charAt(0).toUpperCase() : 'U'}</span>
            {pendingOrganizationInvitations.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '2px solid var(--sidebar-bg, #09090b)',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.9)',
                }}
                title={`${pendingOrganizationInvitations.length} pending organization invitation(s)`}
              />
            )}
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

{accessRequestDocument && (
  <div
    className="delete-confirm-overlay"
    onClick={() => {
      if (!requestingAccess) {
        setAccessRequestDocument(null)
        setAccessRequestError('')
      }
    }}
  >
    <div
      className="delete-confirm-panel"
      onClick={(event) => event.stopPropagation()}
    >
      {(() => {
        const isAdmin = role === 'admin'

        const matchingAccessRequest = isAdmin
          ? accessRequests.find((item) => {
              const requestDocumentId =
                item?.document_id ||
                item?.document?.id ||
                item?.documentId

              return (
                String(requestDocumentId) ===
                String(accessRequestDocument.id)
              )
            })
          : null

        const requester =
          matchingAccessRequest?.requester_username ||
          matchingAccessRequest?.requester_name ||
          matchingAccessRequest?.requester_id ||
          'Organization member'

        const accessStatus =
          accessRequestStatus[accessRequestDocument.id]

        const isPending =
          !isAdmin && accessStatus === 'pending'

        const isApproved =
          !isAdmin && accessStatus === 'approved'

        return (
          <>
            <div className="delete-confirm-title">
              {isAdmin ? 'Access Request' : 'Access Required'}
            </div>

            <div className="delete-confirm-document">
              {accessRequestDocument.name}
            </div>

            <div className="delete-confirm-message">
              {isAdmin
                ? `Grant delete access to ${requester} for this document?`
                : 'You do not currently have permission to delete this document. Request delete access from an organization administrator.'}
            </div>

            {!isAdmin && isPending && (
              <div className="delete-confirm-error">
                Access request already pending.
              </div>
            )}

            {isAdmin && !matchingAccessRequest && (
              <div className="delete-confirm-error">
                No pending access request was found for this document.
              </div>
            )}

            {accessRequestError && (
              <div className="delete-confirm-error">
                {accessRequestError}
              </div>
            )}

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={() => {
                  if (!requestingAccess) {
                    setAccessRequestDocument(null)
                    setAccessRequestError('')
                  }
                }}
                disabled={requestingAccess}
              >
                Close
              </button>

              <button
                type="button"
                className="delete-confirm-delete"
                onClick={
                  isAdmin
                    ? approveAccessRequest
                    : requestDocumentAccess
                }
                disabled={
                  requestingAccess ||
                  (isAdmin
                    ? !matchingAccessRequest
                    : isPending || isApproved)
                }
              >
                {isAdmin
                  ? requestingAccess
                    ? 'Granting...'
                    : 'Grant Access'
                  : requestingAccess
                    ? 'Requesting...'
                    : isApproved
                      ? 'Request Granted'
                      : isPending
                        ? 'Access Requested'
                        : 'Request Access'}
              </button>
            </div>
          </>
        )
      })()}
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
                <h2>
                  {settingsSection === 'organization'
                    ? 'Organization'
                    : 'Account'}
                </h2>
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

            <div className="settings-body">
              <nav
                className="settings-sidebar"
                aria-label="Settings sections"
              >
                {accountType === 'organization' && role === 'admin' && (
                  <button
                    type="button"
                    className={`settings-sidebar-item${settingsSection === 'organization' ? ' is-active' : ''}`}
                    onClick={() => setSettingsSection('organization')}
                    aria-current={
                      settingsSection === 'organization'
                        ? 'page'
                        : undefined
                    }
                  >
                    <span
                      className="settings-sidebar-icon"
                      aria-hidden="true"
                    >
                      ⌘
                    </span>
                    <span>Organization</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`settings-sidebar-item${settingsSection === 'account' ? ' is-active' : ''}`}
                  onClick={() => setSettingsSection('account')}
                  aria-current={
                    settingsSection === 'account'
                      ? 'page'
                      : undefined
                  }
                >
                  <span
                    className="settings-sidebar-icon"
                    aria-hidden="true"
                  >
                    ○
                  </span>
                  <span>Account</span>
                </button>

              </nav>

              <div
                className="settings-content"
                data-settings-section={settingsSection}
              >
        {accountType === 'organization' && myOrganizations.length > 1 && (
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




              {accountType === 'organization' && role === 'admin' && (
                <div className="settings-section settings-section-organization">
                  <h3>Organization</h3>

                  {!showChangeOrganization ? (
                    <div className="settings-row">
                      <div>
                        <div className="settings-row-title">
                          Organization Name
                        </div>

                        <div className="settings-row-description">
                          Change the name of your organization.
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
                        Change Organization
                      </button>
                    </div>
                  ) : (
                    <form
                      className="change-password-form"
                      onSubmit={updateOrganizationName}
                    >
                      <div className="change-password-title">
                        Change Organization Name
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
                            : 'Change Organization'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="settings-section settings-section-account">
                <h3>Account</h3>

                {pendingOrganizationInvitations.length > 0 && (
                  <div className="organization-invitations-list" style={{ marginBottom: '20px', display: 'grid', gap: '12px' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{invitation.organization_name}</strong>
                            <p className="settings-description" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
                              You were invited by <strong>{invitation.invited_by_username}</strong>
                              {invitation.invited_by_email ? ` (${invitation.invited_by_email})` : ''}.
                              Accept the invitation to access this organization's shared documents.
                            </p>
                          </div>
                          <div className="organization-invitation-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button
                              type="button"
                              className="settings-save-button"
                              disabled={invitationActionId === invitation.id}
                              onClick={() => respondToOrganizationInvitation(invitation.id, 'accept')}
                            >
                              {invitationActionId === invitation.id ? 'Accepting...' : 'Accept Invitation'}
                            </button>
                            <button
                              type="button"
                              className="settings-secondary-button"
                              disabled={invitationActionId === invitation.id}
                              onClick={() => respondToOrganizationInvitation(invitation.id, 'decline')}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {invitationActionError && (
                      <p className="settings-error-message">{invitationActionError}</p>
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
              {role === 'admin' && accountType === 'organization' && (
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
                        disabled={invitingMember || !memberEmail.trim()}
                      >
                        {invitingMember ? 'Inviting...' : 'Invite Member'}
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
                            {organizationMembers.map((member) => {
                              const isAdmin = member.role === 'admin'
                              const hasAccess =
                                member.access_status === 'active'
                              const isDeleting =
                                deletingOrganizationMemberId === member.user_id

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

                                  <div className="organization-member-delete">
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
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
              )}

              {role === 'admin' && accountType === 'organization' && (
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
                      {loadingAccessRequests ? 'Refreshing...' : 'Refresh'}
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
                    <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                      {accessRequests.map((request) => {
                        const requestId = request?.id || request?.request_id
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
                            key={requestId || `${requestDocumentId}-${request?.created_at || 'request'}`}
                            style={{
                              padding: '12px',
                              border: '1px solid var(--border-color, rgba(148, 163, 184, 0.2))',
                              borderRadius: '10px',
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>
                              {request?.document_name ||
                                request?.document_title ||
                                `Document ${requestDocumentId || 'unknown'}`}
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
                                onClick={() => resolveAccessRequest(requestId, 'approve')}
                                disabled={loadingAccessRequests || !requestId}
                              >
                                Grant Access
                              </button>

                              <button
                                type="button"
                                className="settings-secondary-button"
                                onClick={() => resolveAccessRequest(requestId, 'reject')}
                                disabled={loadingAccessRequests || !requestId}
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
              )}
            </div>
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
                This permanently removes this organization and its memberships,
                invitations, access grants, and access requests. Your account
                will not be deleted, and your current session will remain active.
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
                    style={{ paddingRight: '92px', width: '100%' }}
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
                This permanently removes this organization and its memberships,
                invitations, access grants, and access requests. Your account
                will not be deleted, and your current session will remain active.
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
                    style={{ paddingRight: '92px', width: '100%' }}
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
                    {deleteOrganizationPasswordVisible ? 'Hide' : 'Show'}
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
            <p className="eyebrow">Content Knowledge Domains</p>
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

        {/* Document Search + Filters */}
        <div className="documents-search-filter">
          <div className="documents-search-box">
            <svg
              className="documents-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="search"
              value={documentSearch}
              onChange={(event) => setDocumentSearch(event.target.value)}
              placeholder="Search documents..."
              aria-label="Search documents"
            />

            <button
              type="button"
              className={`documents-filter-button${
                documentTypeFilter !== 'all' ? ' is-active' : ''
              }`}
              onClick={() =>
                setShowDocumentFilters((current) => !current)
              }
              aria-label="Filter documents"
              aria-expanded={showDocumentFilters}
              title="Filter documents"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
            </button>
          </div>

          {showDocumentFilters && (
            <div className="documents-filter-menu">
              {(() => {
                /*
                 * Complete set of document categories supported
                 * by the application's classifier.
                 *
                 * These filters are intentionally independent of
                 * the currently uploaded documents.
                 */
                const availableContentFields = [
                  'Education',
                  'Sports',
                  'News',
                  'Entertainment',
                  'Finance & Business',
                  'Technology & Data',
                  'Legal & Policy',
                  'Healthcare & Science',
                  'Others',
                ]

                const safeDocs = Array.isArray(documents)
                  ? documents
                  : []

                return (
                  <>
                    <button
                      type="button"
                      className={`documents-filter-option${
                        documentTypeFilter === 'all'
                          ? ' is-selected'
                          : ''
                      }`}
                      onClick={() => {
                        setDocumentTypeFilter('all')
                        setShowDocumentFilters(false)
                      }}
                    >
                      <span className="documents-filter-option-name">
                        <span>📚</span>
                        <span>All Documents</span>
                      </span>

                    </button>

                    {availableContentFields.map((fieldName) => {
                      const badge = getContentFieldBadgeInfo(fieldName)

                      return (
                        <button
                          key={fieldName}
                          type="button"
                          className={`documents-filter-option${
                            documentTypeFilter === fieldName
                              ? ' is-selected'
                              : ''
                          }`}
                          onClick={() => {
                            setDocumentTypeFilter(fieldName)
                            setShowDocumentFilters(false)
                          }}
                        >
                          <span className="documents-filter-option-name">
                            <span>{badge.icon}</span>
                            <span>{fieldName}</span>
                          </span>

                        </button>
                      )
                    })}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        <div className="documents-drawer-list">
          {(Array.isArray(documents) ? documents : []).length > 0 ? (
            (() => {
              const safeDocs = Array.isArray(documents) ? documents : []
              const normalizedSearch = documentSearch.trim().toLowerCase()

              const filteredDocs = safeDocs.filter((doc) => {
                const matchesFilter =
                  documentTypeFilter === 'all' ||
                  getDocumentContentField(doc) === documentTypeFilter

                if (!matchesFilter) {
                  return false
                }

                if (!normalizedSearch) {
                  return true
                }

                const searchableText = [
                  doc?.title,
                  doc?.file_name,
                  doc?.filename,
                  doc?.name,
                  getDocumentContentField(doc),
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()

                return searchableText.includes(normalizedSearch)
              })

              if (filteredDocs.length === 0) {
                return (
                  <div className="documents-empty">
                    <span className="documents-empty-icon">🏷️</span>
                    <p>No documents found for this content field.</p>
                  </div>
                )
              }

              // Group filtered documents by Content Field
              const groupedDocs = {}
              filteredDocs.forEach((doc) => {
                const fieldName = getDocumentContentField(doc)
                if (!groupedDocs[fieldName]) {
                  groupedDocs[fieldName] = []
                }
                groupedDocs[fieldName].push(doc)
              })

              return sortCategories(Object.entries(groupedDocs))
                .map(([fieldName, categoryDocs]) => {
                  const badgeInfo = getContentFieldBadgeInfo(fieldName)

                  return (
                    <div key={fieldName} className="doc-field-group-container">
                      <div className="doc-group-header">
                        <span className="doc-group-header-title">
                          <span>{badgeInfo.icon}</span>
                          <span>{fieldName}</span>
                        </span>
                        <span className="doc-group-header-badge">
                          {categoryDocs.length} {categoryDocs.length === 1 ? 'doc' : 'docs'}
                        </span>
                      </div>

                      {categoryDocs.map((document) => {
                        const docId = document.document_id || document.id

                        return (
                          <div className="document-list-item-card" key={docId}>
                            <div className="document-card-top">
                              <button
                                type="button"
                                className="document-list-select"
                                onClick={async () => {
                                  setShowDocuments(false)
                                  setQueryError('')
                                  setSelectedDocument(document)

                                  setDocuments((prev) => {
                                    const filtered = Array.isArray(prev)
                                      ? prev.filter((d) => (d.document_id || d.id) !== docId)
                                      : []
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
                                      `/api/v1/documents/${docId}/content`,
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
                                <span
                                  className="document-list-icon"
                                  style={{
                                    color: badgeInfo.color,
                                    backgroundColor: badgeInfo.bg,
                                  }}
                                >
                                  {badgeInfo.icon}
                                </span>

                                <span className="document-list-content">
                                  <span className="document-list-title">
                                    {document.title || document.file_name || 'Untitled document'}
                                  </span>

                                  <span className="document-list-filename">
                                    {document.file_name || 'Unknown file'}
                                  </span>
                                </span>
                              </button>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                <button
                                  type="button"
                                  className="document-list-delete"
                                  aria-label={`Delete ${document.file_name || 'document'}`}
                                  title="Delete document"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteError('')
                                    setPendingDeleteDocument({
                                      id: docId,
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
                            </div>



                            {['pending', 'approved'].includes(
                              accessRequestStatus[docId]
                            ) && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  width: 'fit-content',
                                  marginTop: '8px',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  lineHeight: 1.3,
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  color: 'var(--accent, #f59e0b)',
                                }}
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setAccessRequestDocument(document)
                                  setAccessRequestError('')
                                }}
                                role="button"
                                tabIndex={0}
                                title="View access request"
                              >
                                {accessRequestStatus[docId] === 'approved'
                                  ? 'Request granted'
                                  : 'Access requested'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              )
            })()
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
                          {result.chart && (
                            <ChartRenderer chart={result.chart} />
                          )}
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