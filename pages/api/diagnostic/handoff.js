import { diagnosticHandoffRequestSchema } from 'lib/diagnostic/schemas'
import { rejectIfUnsafeRequest, setApiHeaders } from 'lib/diagnostic/security'

const recipient = 'hello@louiskarakas.com'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function list(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function briefHtml(brief) {
  const sections = [
    ['Current workflow', [brief.summary]],
    ['Friction', brief.friction.map((item) => `${item.title}: ${item.body}`)],
    [
      'AI leverage',
      brief.leverage.map(
        (item) =>
          `${item.step} — ${item.mode}: ${item.rationale} Review: ${item.reviewGate}`,
      ),
    ],
    [
      'Human judgment',
      brief.humanJudgment.map((item) => `${item.title}: ${item.body}`),
    ],
    [
      'Target workflow',
      brief.targetWorkflow.map((item) => `${item.title}: ${item.body}`),
    ],
    ['Unknowns', brief.unknowns.map((item) => `${item.title}: ${item.body}`)],
    ['Validate next', brief.validateNext],
  ]

  return sections
    .map(
      ([heading, items]) =>
        `<h2>${escapeHtml(heading)}</h2><ul>${list(items)}</ul>`,
    )
    .join('')
}

export const config = {
  api: { bodyParser: { sizeLimit: '16kb' } },
}

export default async function handler(req, res) {
  setApiHeaders(res)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (rejectIfUnsafeRequest(req, res)) return

  const parsed = diagnosticHandoffRequestSchema.safeParse(req.body)
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: 'Please complete the required fields.' })
  if (parsed.data.website) return res.status(200).json({ ok: true })

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res
      .status(503)
      .json({ error: 'Email delivery is not configured yet.' })
  }

  try {
    const { fullName, company, email, note, brief } = parsed.data
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [recipient],
        reply_to: email,
        subject: `Workflow diagnostic — ${fullName} at ${company}`,
        html: `<h1>Workflow diagnostic</h1><p><strong>Name:</strong> ${escapeHtml(
          fullName,
        )}<br /><strong>Company:</strong> ${escapeHtml(
          company,
        )}<br /><strong>Email:</strong> ${escapeHtml(email)}</p>${
          note
            ? `<p><strong>Additional context:</strong><br />${escapeHtml(
                note,
              )}</p>`
            : ''
        }${briefHtml(brief)}`,
        text: `Workflow diagnostic\n\nName: ${fullName}\nCompany: ${company}\nEmail: ${email}\n${
          note ? `\nAdditional context: ${note}\n` : ''
        }\n${brief.summary}\n\nValidate next:\n${brief.validateNext
          .map((item) => `- ${item}`)
          .join('\n')}`,
      }),
    })

    if (!response.ok) throw new Error('Resend rejected the message')
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Diagnostic handoff failed', error?.name || 'unknown')
    return res.status(error?.statusCode || 502).json({
      error:
        error?.statusCode === 429
          ? error.message
          : 'The assessment could not be sent. Please try again or email Louis directly.',
    })
  }
}
