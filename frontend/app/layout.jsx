import { Manrope, Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: 'RAG Document Intelligence',
  description: 'PDF-focused RAG document intelligence platform',
}

const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('rag-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${syne.variable} ${manrope.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
