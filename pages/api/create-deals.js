export default async function handler(req, res) {
  let body = req.body

  // Falls dein body schon ein JSON-String ist, musst du ihn zuerst parsen:
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }

  // Dealname validieren oder setzen
  if (!body.properties?.dealname) {
    body.properties.dealname = 'Unbenannter Deal'
  }

  // Ungültige ownerId entfernen
  if (body.properties.hubspot_owner_id === 'undefined') {
    delete body.properties.hubspot_owner_id
  }

  const allowedDealStages = [
    'appointmentscheduled',
    'qualifiedtobuy',
    'presentationscheduled',
    'decisionmakerboughtin',
    'contractsent',
    'closedwon',
    'closedlost',
  ]

  if (!allowedDealStages.includes(body.properties.dealstage)) {
    return res.status(400).json({ error: 'Ungültige dealstage' })
  }

  try {
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body), // wichtig!
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.log('error code', resp.status, errorText)
      throw new Error(`Failed to create deal: ${resp.status}`)
    }

    const response = await resp.json()
    res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ error: error.message })
  }
}
