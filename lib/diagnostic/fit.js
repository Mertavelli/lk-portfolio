const highStakesPattern =
  /legal|regulat|financial|investment|deal|transaction|approval|client|contract|risk|compliance/i
const draftingPattern =
  /draft|write|summari[sz]e|research|analyse|analy[sz]e|prepare|compile|synthesi[sz]e|extract/i
const repetitionPattern = /repeat|weekly|daily|monthly|recurr|every/i

const signalText = (signal) => signal?.value || ''

export function assessWorkflowFit(workflow) {
  const context = [
    signalText(workflow.frequency),
    signalText(workflow.decisionPoint),
    signalText(workflow.dataSensitivity),
    ...workflow.humanJudgment.map(signalText),
  ].join(' ')

  const isHighStakes = highStakesPattern.test(context)
  const isRepeated = repetitionPattern.test(signalText(workflow.frequency))

  const items = workflow.steps.map((step) => {
    const stepText = `${signalText(step.title)} ${signalText(step.purpose)}`
    const supportsDrafting = draftingPattern.test(stepText)

    if (
      isHighStakes &&
      (highStakesPattern.test(stepText) || !supportsDrafting)
    ) {
      return {
        step: signalText(step.title) || 'Workflow step',
        mode: 'recommend',
        rationale:
          'The system can prepare evidence and a recommendation, but the accountable person should make the decision.',
        reviewGate:
          'A named reviewer checks the evidence and explicitly approves the next action.',
      }
    }

    if (supportsDrafting && isRepeated) {
      return {
        step: signalText(step.title) || 'Workflow step',
        mode: 'draft',
        rationale:
          'The step is suitable for a structured first pass when inputs and output checks are defined.',
        reviewGate:
          'A person reviews, corrects, and accepts the draft before it is used.',
      }
    }

    if (supportsDrafting) {
      return {
        step: signalText(step.title) || 'Workflow step',
        mode: 'assist',
        rationale:
          'AI can help find, organise, and prepare material while the person remains in control of the work.',
        reviewGate:
          'The operator decides which output is retained or acted on.',
      }
    }

    return {
      step: signalText(step.title) || 'Workflow step',
      mode: 'human_led',
      rationale:
        'There is not enough evidence that this step is repeatable and verifiable enough for automation.',
      reviewGate:
        'Keep this step human-led until inputs, quality criteria, and failure handling are explicit.',
    }
  })

  const blockers = []
  if (!signalText(workflow.frequency)) {
    blockers.push(
      'Frequency is still unknown, so the value of changing this workflow is not yet clear.',
    )
  }
  if (!signalText(workflow.decisionPoint)) {
    blockers.push(
      'The accountable decision point should be defined before any action is automated.',
    )
  }
  if (!signalText(workflow.dataSensitivity)) {
    blockers.push(
      'Data sensitivity needs to be checked before choosing a model, integration, or storage pattern.',
    )
  }

  return { items, blockers }
}
