export function getRelevantExperience(state) {
  const text = [
    state?.workflow?.title?.value,
    state?.workflow?.trigger?.value,
    state?.workflow?.output?.value,
    ...(state?.workflow?.steps || []).flatMap((step) => [
      step.title.value,
      step.purpose.value,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (
    /deal|transaction|m&a|due diligence|investment|private market/.test(text)
  ) {
    return {
      title: 'Arvendorf',
      copy: 'Human-in-the-loop infrastructure for research, knowledge retrieval, document generation, and transaction execution.',
      href: '/#arvendorf',
    }
  }

  if (/research|analysis|knowledge|document|report|memo/.test(text)) {
    return {
      title: 'Markets AI',
      copy: 'A research and analysis system built around structured decision materials, retrieval, and review.',
      href: '/#markets-ai',
    }
  }

  if (/project|backlog|sprint|coordination|handoff/.test(text)) {
    return {
      title: 'Captain',
      copy: 'An operating layer that turns unstructured project signals into useful coordination context.',
      href: '/#captain',
    }
  }

  if (/payment|credit|repayment|identity|financial flow/.test(text)) {
    return {
      title: 'Avalco',
      copy: 'A system where deterministic financial flows, identity, and state transitions need to hold up in production.',
      href: '/#avalco',
    }
  }

  return null
}
