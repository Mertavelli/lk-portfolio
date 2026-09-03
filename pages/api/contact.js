const recipient = 'hello@louiskarakas.com'

const fields = [
  ['full_name', 'Full name'],
  ['company', 'Company'],
  ['email', 'Email'],
  ['what_are_you_looking_to_improve', 'What are you looking to improve?'],
  ['timeline_expectation', 'Timeline'],
  ['how_you_found_us', 'How did you find me?'],
  ['favorite_movie_or_album', 'Favourite movie or album'],
  ['description', 'Current setup or challenge'],
]

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const valueFor = (value) => {
  if (Array.isArray(value)) return value.join(', ').slice(0, 4_000)
  return typeof value === 'string' ? value.trim().slice(0, 4_000) : ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Invalid form data' })
    }
  }
  const submittedFields = body?.fields

  if (!submittedFields || typeof submittedFields !== 'object') {
    return res.status(400).json({ error: 'Invalid form data' })
  }

  // A hidden field that humans never see; silently accept bot submissions.
  if (valueFor(submittedFields.website)) {
    return res.status(200).json({ ok: true })
  }

  const values = Object.fromEntries(
    fields.map(([name]) => [name, valueFor(submittedFields[name])]),
  )

  if (
    !values.full_name ||
    !values.description ||
    !/^\S+@\S+\.\S+$/.test(values.email)
  ) {
    return res
      .status(422)
      .json({ error: 'Please complete the required fields' })
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Resend is not configured')
    return res.status(500).json({ error: 'Email service is not configured' })
  }

  const emailRows = fields
    .map(([name, label]) => {
      const value = values[name] || '—'
      return `<tr><td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top">${escapeHtml(
        label,
      )}</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(
        value,
      )}</td></tr>`
    })
    .join('')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [recipient],
        reply_to: values.email,
        subject: `New website inquiry from ${values.full_name}`,
        html: `<h1>New website inquiry</h1><table>${emailRows}</table>`,
        text: fields
          .map(([name, label]) => `${label}: ${values[name] || '—'}`)
          .join('\n'),
      }),
    })

    if (!response.ok) {
      console.error('Resend rejected contact form email', response.status)
      return res.status(502).json({ error: 'Email delivery failed' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Contact form email request failed', error)
    return res.status(502).json({ error: 'Email delivery failed' })
  }
}
