import './globals.css'

export const metadata = {
  title: 'RAG Document Intelligence',
  description: 'PDF-focused RAG document intelligence platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
