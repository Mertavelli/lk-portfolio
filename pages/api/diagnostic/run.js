import { runDiagnosticIntake } from 'lib/diagnostic/agent'
import { diagnosticRunRequestSchema } from 'lib/diagnostic/schemas'
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

  const parsed = diagnosticRunRequestSchema.safeParse(req.body)
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: 'Please provide a valid workflow response.' })

  try {
    requireDiagnosticConfiguration()

    const { output } = await runDiagnosticIntake({
      workflowDescription: parsed.data.workflowDescription,
      state: parsed.data.state,
      answer: parsed.data.answer,
    })

    const canAskAnotherQuestion = (parsed.data.state?.questionCount || 0) < 2
    const nextQuestion = canAskAnotherQuestion ? output.nextQuestion : null
    const questionCount = parsed.data.state
      ? parsed.data.state.questionCount + (nextQuestion ? 1 : 0)
      : nextQuestion
        ? 1
        : 0
    const state = {
      ...output.state,
      phase: nextQuestion ? 'question' : 'review',
      questionCount,
    }

    return res.status(200).json({ state, nextQuestion })
  } catch (error) {
    console.error('Diagnostic intake failed', error?.name || 'unknown')
    return res.status(error?.statusCode || 500).json({
      error:
        error?.statusCode === 429 ||
        error?.statusCode === 403 ||
        error?.statusCode === 503
          ? error.message
          : 'The diagnostic could not complete. Please try again shortly.',
    })
  }
}
