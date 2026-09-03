import { finalizeDiagnostic } from 'lib/diagnostic/agent'
import { diagnosticFinalizeRequestSchema } from 'lib/diagnostic/schemas'
import {
  rejectIfUnsafeRequest,
  requireDiagnosticConfiguration,
  setApiHeaders,
} from 'lib/diagnostic/security'

export const config = {
  api: { bodyParser: { sizeLimit: '10kb' } },
}

export default async function handler(req, res) {
  setApiHeaders(res)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (rejectIfUnsafeRequest(req, res)) return

  const parsed = diagnosticFinalizeRequestSchema.safeParse(req.body)
  if (!parsed.success || parsed.data.state.phase !== 'review') {
    return res
      .status(422)
      .json({ error: 'Please review the workflow before continuing.' })
  }

  try {
    requireDiagnosticConfiguration()
    const { output } = await finalizeDiagnostic(parsed.data.state)
    return res.status(200).json({ brief: output.brief })
  } catch (error) {
    console.error('Diagnostic finalisation failed', error?.name || 'unknown')
    return res.status(error?.statusCode || 500).json({
      error:
        error?.statusCode === 429 ||
        error?.statusCode === 403 ||
        error?.statusCode === 503
          ? error.message
          : 'The brief could not be completed. Please try again shortly.',
    })
  }
}
