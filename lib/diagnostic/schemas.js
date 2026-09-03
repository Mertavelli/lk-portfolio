import { z } from 'zod'

export const provenanceSchema = z.enum([
  'user',
  'agent_inference',
  'rule_result',
  'unknown',
])

export const confidenceSchema = z.enum(['high', 'medium', 'low', 'unknown'])

export const signalSchema = z
  .object({
    value: z.string().max(280),
    provenance: provenanceSchema,
    confidence: confidenceSchema,
    confirmedByUser: z.boolean(),
  })
  .strict()

export const stepSchema = z
  .object({
    title: signalSchema,
    purpose: signalSchema,
  })
  .strict()

export const unknownSchema = z
  .object({
    question: z.string().min(1).max(180),
    impact: z.string().min(1).max(240),
  })
  .strict()

export const diagnosticStateSchema = z
  .object({
    version: z.literal(1),
    phase: z.enum(['question', 'review', 'brief']),
    questionCount: z.number().int().min(0).max(2),
    workflow: z
      .object({
        title: signalSchema,
        trigger: signalSchema,
        output: signalSchema,
        steps: z.array(stepSchema).min(2).max(6),
        actors: z.array(signalSchema).max(5),
        systems: z.array(signalSchema).max(6),
        frequency: signalSchema,
        decisionPoint: signalSchema,
        frictions: z.array(signalSchema).max(5),
        humanJudgment: z.array(signalSchema).max(5),
        dataSensitivity: signalSchema,
      })
      .strict(),
    unknowns: z.array(unknownSchema).max(4),
  })
  .strict()

export const questionSchema = z
  .object({
    id: z.enum(['frequency', 'decision', 'input_quality', 'review', 'handoff']),
    prompt: z.string().min(1).max(260),
    whyItMatters: z.string().min(1).max(180),
  })
  .strict()

export const diagnosticRunSchema = z
  .object({
    state: diagnosticStateSchema,
    nextQuestion: questionSchema.nullable(),
  })
  .strict()

export const autonomySchema = z.enum([
  'human_led',
  'assist',
  'draft',
  'recommend',
  'act_after_approval',
])

export const fitItemSchema = z
  .object({
    step: z.string().min(1).max(120),
    mode: autonomySchema,
    rationale: z.string().min(1).max(260),
    reviewGate: z.string().min(1).max(220),
  })
  .strict()

export const fitAssessmentSchema = z
  .object({
    items: z.array(fitItemSchema).min(2).max(6),
    blockers: z.array(z.string().min(1).max(180)).max(4),
  })
  .strict()

export const briefItemSchema = z
  .object({
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(340),
    status: z.enum(['observed', 'inferred', 'recommended', 'unknown']),
  })
  .strict()

export const workflowLeverageBriefSchema = z
  .object({
    summary: z.string().min(1).max(420),
    friction: z.array(briefItemSchema).min(1).max(4),
    leverage: z.array(fitItemSchema).min(2).max(6),
    humanJudgment: z.array(briefItemSchema).min(1).max(4),
    targetWorkflow: z.array(briefItemSchema).min(2).max(6),
    unknowns: z.array(briefItemSchema).max(4),
    validateNext: z.array(z.string().min(1).max(180)).min(1).max(3),
  })
  .strict()

export const diagnosticFinalSchema = z
  .object({
    brief: workflowLeverageBriefSchema,
  })
  .strict()

export const diagnosticRunRequestSchema = z
  .object({
    mode: z.enum(['initial', 'follow_up']),
    workflowDescription: z.string().trim().min(20).max(1500).optional(),
    answer: z.string().trim().min(1).max(750).optional(),
    state: diagnosticStateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.mode === 'initial' && !value.workflowDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A workflow description is required.',
        path: ['workflowDescription'],
      })
    }

    if (value.mode === 'follow_up' && (!value.answer || !value.state)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A prior workflow state and an answer are required.',
        path: ['state'],
      })
    }
  })

export const diagnosticFinalizeRequestSchema = z
  .object({
    state: diagnosticStateSchema,
  })
  .strict()

export const diagnosticHandoffRequestSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    note: z.string().trim().max(750).optional().default(''),
    consent: z.literal(true),
    website: z.string().max(0).optional().default(''),
    state: diagnosticStateSchema,
    brief: workflowLeverageBriefSchema,
  })
  .strict()
