function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function expectedOrigin(req) {
  const host = req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  return host ? `${protocol}://${host}` : null
}

function requireSameOrigin(req) {
  const origin = req.headers.origin
  const expected = expectedOrigin(req)
  return Boolean(origin && expected && origin === expected)
}

export function setApiHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Content-Type-Options', 'nosniff')
}

export function rejectIfUnsafeRequest(req, res) {
  if (!requireSameOrigin(req)) {
    res.status(403).json({ error: 'This request must come from the website.' })
    return true
  }
  return false
}

export function requireDiagnosticConfiguration() {
  if (isProduction() && !process.env.OPENAI_API_KEY) {
    const error = new Error('The diagnostic is not configured yet.')
    error.statusCode = 503
    throw error
  }
}
