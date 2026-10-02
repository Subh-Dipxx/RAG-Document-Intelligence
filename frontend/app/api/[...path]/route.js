import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://api:8000'

async function proxy(request, { params }) {
  const resolvedParams = await params
  const pathSegments = resolvedParams?.path || []
  const path = pathSegments.join('/')
  const search = new URL(request.url).search
  const targetUrl = `${BACKEND_URL}/api/${path}${search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  let body = null
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      duplex: 'half',
    })

    const responseHeaders = new Headers(backendResponse.headers)

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('API Proxy error:', error)
    return NextResponse.json(
      { detail: 'Failed to communicate with backend API' },
      { status: 502 }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
