const hubspotFormApi = async (id) => {
  // id muss aus hubspot sein
  const resp = await fetch(`https://api.hubapi.com/marketing/v3/forms/${id}`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    },
  })
  if (!resp.ok) {
    throw new Error(`Failed to fetch form data: ${resp.status}`)
  }
  const response = await resp.json()
  //console.log("response.fieldGroups: ", response.fieldGroups)
  return apiParser(id, response)
}

const apiParser = (id, data) => {
  const typeSetter = (type) => {
    switch (type) {
      case 'phone':
        return 'single_line_text'
      case 'email':
        return 'single_line_text'
      default:
        return type
    }
  }

  const legalConsentOptions =
    data?.legalConsentOptions?.communicationsCheckboxes || null

  const removeHTML = (htmlText) =>
    htmlText.replace('<p>', '').replace('</p>', '')

  return {
    portalId: process.env.HUSBPOT_PORTAL_ID,
    id: id,
    inputs: data.fieldGroups.flatMap((group) =>
      group.fields.map((field) => ({
        name: field?.name || '',
        label: field?.label || '',
        placeholder: field?.placeholder || 'HIER EINGEBEN',
        required: field?.required || false,
        hubspotType: typeSetter(field.fieldType),
        type: field.fieldType || '',
        hidden: field.hidden || false,
        helpText: field?.helpText || '',
        options: field.options
          ? field.options.map((option) => option.label)
          : [],
      })),
    ),
    submitButton: {
      text: data.displayOptions.submitButtonText || 'SENDEN',
    },
    legalConsent: legalConsentOptions
      ? {
          required: true,
          subscriptionTypeId: legalConsentOptions[0].subscriptionTypeId,
          label: removeHTML(legalConsentOptions[0].label),
          disclaimer: [
            removeHTML(data.legalConsentOptions.privacyText),
            removeHTML(data.legalConsentOptions.consentToProcessText),
          ],
        }
      : { required: false },
    actions: {
      redirect:
        data.configuration.postSubmitAction.type === 'redirect_url'
          ? true
          : false,
      redirectValue: data.configuration.postSubmitAction.value,
    },
  }
}

export const getForm = async (formId, handler = async () => {}) => {
  try {
    const form = {
      form: await hubspotFormApi(
        formId || 'bb9cc0ad-aa2f-4e28-b499-6e00baa2081e',
      ),
    }
    await handler(form)
    return form
  } catch (err) {
    console.error(err)
    return { error: err.message }
  }
}
