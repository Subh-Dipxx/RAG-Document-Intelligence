import './globals.css'

export const metadata = {
  title: 'DocGPT',
  description: 'PDF-focused RAG document intelligence platform',
}

const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('rag-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
