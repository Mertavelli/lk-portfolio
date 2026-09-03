import cn from 'clsx'
import va from '@vercel/analytics'
import { useEffect, useState } from 'react'
import { getRelevantExperience } from 'lib/diagnostic/experience'
import s from './diagnostic.module.scss'

const SESSION_STORAGE_KEY = 'lk-workflow-diagnostic-v1'

const modeLabels = {
  human_led: 'Human-led',
  assist: 'Assist',
  draft: 'Draft',
  recommend: 'Recommend',
  act_after_approval: 'Act after approval',
}

const statusLabels = {
  observed: 'Observed',
  inferred: 'Inferred',
  recommended: 'Recommended',
  unknown: 'Unknown',
}

function signalValue(signal) {
  return signal?.value || 'Not specified'
}

function makeUserSignal(signal, value) {
  return {
    ...signal,
    value: value.slice(0, 280),
    provenance: 'user',
    confidence: value.trim() ? 'high' : 'unknown',
    confirmedByUser: true,
  }
}

function Field({ label, signal, editable, onChange, multiline = false }) {
  const Component = multiline ? 'textarea' : 'input'

  return (
    <div className={cn(s.field, editable && s.editableField)}>
      <span>{label}</span>
      {editable ? (
        <Component
          aria-label={label}
          maxLength={280}
          onChange={(event) => onChange(event.target.value)}
          rows={multiline ? 3 : undefined}
          value={signal?.value || ''}
        />
      ) : (
        <p>{signalValue(signal)}</p>
      )}
      <small>
        {signal?.provenance === 'unknown'
          ? 'Unknown'
          : signal?.provenance?.replace('_', ' ')}
      </small>
    </div>
  )
}

function SignalList({ label, signals }) {
  const values = (signals || []).map(signalValue).filter(Boolean)
  if (!values.length) return null

  return (
    <div className={s.signalList}>
      <span>{label}</span>
      <p>{values.join(' · ')}</p>
    </div>
  )
}

function WorkflowSheet({ state, editable, onStateChange }) {
  if (!state) {
    return (
      <aside className={s.blankSheet} aria-live="polite">
        <p>The working model will appear here.</p>
      </aside>
    )
  }

  const workflow = state.workflow
  const updateWorkflowSignal = (key, value) => {
    onStateChange({
      ...state,
      workflow: { ...workflow, [key]: makeUserSignal(workflow[key], value) },
    })
  }

  const updateStep = (index, key, value) => {
    const steps = workflow.steps.map((step, stepIndex) =>
      stepIndex === index
        ? { ...step, [key]: makeUserSignal(step[key], value) }
        : step,
    )
    onStateChange({ ...state, workflow: { ...workflow, steps } })
  }

  return (
    <aside className={s.sheet} aria-label="Workflow working model">
      <div className={s.sheetHead}>
        <span>Working model</span>
        <span>{editable ? 'Editing' : 'Provisional'}</span>
      </div>

      <Field
        editable={editable}
        label="Workflow"
        onChange={(value) => updateWorkflowSignal('title', value)}
        signal={workflow.title}
      />
      <Field
        editable={editable}
        label="Trigger"
        multiline
        onChange={(value) => updateWorkflowSignal('trigger', value)}
        signal={workflow.trigger}
      />

      <div className={s.steps}>
        <span>Current flow</span>
        <ol>
          {workflow.steps.map((step, index) => (
            <li key={`${step.title.value}-${index}`}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              {editable ? (
                <div>
                  <input
                    aria-label={`Step ${index + 1} title`}
                    maxLength={280}
                    onChange={(event) =>
                      updateStep(index, 'title', event.target.value)
                    }
                    value={step.title.value}
                  />
                  <textarea
                    aria-label={`Step ${index + 1} purpose`}
                    maxLength={280}
                    onChange={(event) =>
                      updateStep(index, 'purpose', event.target.value)
                    }
                    rows="2"
                    value={step.purpose.value}
                  />
                </div>
              ) : (
                <div>
                  <strong>{signalValue(step.title)}</strong>
                  <p>{signalValue(step.purpose)}</p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      <Field
        editable={editable}
        label="Output"
        multiline
        onChange={(value) => updateWorkflowSignal('output', value)}
        signal={workflow.output}
      />
      <Field
        editable={editable}
        label="Decision / review"
        multiline
        onChange={(value) => updateWorkflowSignal('decisionPoint', value)}
        signal={workflow.decisionPoint}
      />
      <SignalList label="Friction" signals={workflow.frictions} />
      <SignalList label="Human judgment" signals={workflow.humanJudgment} />
      <SignalList label="Frequency" signals={[workflow.frequency]} />
    </aside>
  )
}

function BriefSection({ title, children }) {
  return (
    <section className={s.briefSection}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function BriefItem({ item }) {
  return (
    <article className={s.briefItem}>
      <span>{statusLabels[item.status]}</span>
      <h4>{item.title}</h4>
      <p>{item.body}</p>
    </article>
  )
}

function DiagnosticBrief({ brief, state, onDiscuss }) {
  const relevantExperience = getRelevantExperience(state)

  return (
    <section className={s.brief} aria-labelledby="brief-title">
      <header className={s.briefIntro}>
        <p>Preliminary workflow leverage brief</p>
        <h2 id="brief-title">{brief.summary}</h2>
      </header>

      <BriefSection title="Where friction appears">
        {brief.friction.map((item) => (
          <BriefItem item={item} key={`${item.title}-${item.body}`} />
        ))}
      </BriefSection>

      <BriefSection title="Potential AI leverage">
        <div className={s.leverageList}>
          {brief.leverage.map((item) => (
            <article key={`${item.step}-${item.mode}`}>
              <div>
                <span>{modeLabels[item.mode]}</span>
                <h4>{item.step}</h4>
              </div>
              <p>{item.rationale}</p>
              <small>{item.reviewGate}</small>
            </article>
          ))}
        </div>
      </BriefSection>

      <BriefSection title="Human judgment stays">
        {brief.humanJudgment.map((item) => (
          <BriefItem item={item} key={`${item.title}-${item.body}`} />
        ))}
      </BriefSection>

      <BriefSection title="Suggested target workflow">
        {brief.targetWorkflow.map((item) => (
          <BriefItem item={item} key={`${item.title}-${item.body}`} />
        ))}
      </BriefSection>

      {(brief.unknowns.length > 0 || brief.validateNext.length > 0) && (
        <section className={s.validation}>
          <div>
            <h3>Validate before implementation</h3>
            <ol>
              {brief.validateNext.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          {brief.unknowns.length > 0 && (
            <div>
              <h3>Unknowns</h3>
              {brief.unknowns.map((item) => (
                <BriefItem item={item} key={`${item.title}-${item.body}`} />
              ))}
            </div>
          )}
        </section>
      )}

      {relevantExperience && (
        <a className={s.experience} href={relevantExperience.href}>
          <span>Relevant experience</span>
          <strong>{relevantExperience.title}</strong>
          <p>{relevantExperience.copy}</p>
          <i>View work →</i>
        </a>
      )}

      <button
        className={cn('button', s.discussButton)}
        onClick={onDiscuss}
        type="button"
      >
        Discuss this with Louis
      </button>
    </section>
  )
}

function Handoff({ brief, state, onSent }) {
  const [values, setValues] = useState({
    fullName: '',
    company: '',
    email: '',
    note: '',
    consent: false,
    website: '',
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const updateValue = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSending(true)

    try {
      const response = await fetch('/api/diagnostic/handoff', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, state, brief }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || 'The assessment could not be sent.')
      va.track('Diagnostic sent to Louis')
      onSent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={s.handoff} aria-labelledby="handoff-title">
      <div>
        <h2 id="handoff-title">Take the next step when the context is real.</h2>
        <p>
          Louis will receive this preliminary brief and your note. Nothing is
          sent until you confirm below.
        </p>
      </div>
      <form onSubmit={submit}>
        <label>
          <span>Full name *</span>
          <input
            autoComplete="name"
            maxLength="120"
            onChange={(event) => updateValue('fullName', event.target.value)}
            required
            value={values.fullName}
          />
        </label>
        <label>
          <span>Company *</span>
          <input
            autoComplete="organization"
            maxLength="160"
            onChange={(event) => updateValue('company', event.target.value)}
            required
            value={values.company}
          />
        </label>
        <label>
          <span>Email *</span>
          <input
            autoComplete="email"
            maxLength="254"
            onChange={(event) => updateValue('email', event.target.value)}
            required
            type="email"
            value={values.email}
          />
        </label>
        <label>
          <span>Additional context</span>
          <textarea
            maxLength="750"
            onChange={(event) => updateValue('note', event.target.value)}
            rows="4"
            value={values.note}
          />
        </label>
        <input
          aria-hidden="true"
          autoComplete="off"
          className={s.honeypot}
          onChange={(event) => updateValue('website', event.target.value)}
          tabIndex="-1"
          type="text"
          value={values.website}
        />
        <details className={s.preview}>
          <summary>Preview brief highlights</summary>
          <p>{brief.summary}</p>
          <p>{brief.validateNext.join(' · ')}</p>
        </details>
        <label className={s.consent}>
          <input
            checked={values.consent}
            onChange={(event) => updateValue('consent', event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            I confirm that Louis may receive this brief and my contact details.
          </span>
        </label>
        <button
          className={cn('button', s.sendButton)}
          disabled={sending}
          type="submit"
        >
          {sending ? 'Sending…' : 'Send this assessment to Louis'}
        </button>
        {error && <p className={s.error}>{error}</p>}
      </form>
    </section>
  )
}

export function Diagnostic() {
  const [description, setDescription] = useState('')
  const [state, setState] = useState(null)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [brief, setBrief] = useState(null)
  const [phase, setPhase] = useState('input')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed.expiresAt < Date.now()) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
        return
      }
      setDescription(parsed.description || '')
      setState(parsed.state || null)
      setQuestion(parsed.question || null)
      setBrief(parsed.brief || null)
      setPhase(parsed.phase || 'input')
    } catch {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!state && !brief) return
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        description,
        state,
        question,
        brief,
        phase,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      }),
    )
  }, [brief, description, phase, question, state])

  const request = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || 'The diagnostic could not continue.')
    return data
  }

  const start = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await request('/api/diagnostic/run', {
        mode: 'initial',
        workflowDescription: description,
      })
      setState(data.state)
      setQuestion(data.nextQuestion)
      setPhase(data.nextQuestion ? 'question' : 'review')
      va.track('Diagnostic started')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const continueWithAnswer = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await request('/api/diagnostic/run', {
        mode: 'follow_up',
        state,
        answer,
      })
      setState(data.state)
      setQuestion(data.nextQuestion)
      setAnswer('')
      setPhase(data.nextQuestion ? 'question' : 'review')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const finalize = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await request('/api/diagnostic/finalize', { state })
      setBrief(data.brief)
      setState((current) => ({ ...current, phase: 'brief' }))
      setPhase('brief')
      va.track('Diagnostic brief generated')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setDescription('')
    setState(null)
    setQuestion(null)
    setBrief(null)
    setAnswer('')
    setPhase('input')
    setError('')
  }

  return (
    <article className={s.diagnostic}>
      <section className={cn(s.intro, 'layout-block')}>
        <div className={cn(s.introGrid, 'layout-grid')}>
          <h1>Start with one workflow.</h1>
          <p>
            Describe something that feels slower, harder, or more repetitive
            than it should. The aim is not maximum automation. It is a better
            way for the work to move.
          </p>
        </div>
      </section>

      {phase === 'input' && (
        <section className={cn(s.start, 'layout-block')}>
          <form onSubmit={start}>
            <label htmlFor="workflow-description">Describe the workflow</label>
            <textarea
              id="workflow-description"
              maxLength="1500"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="For example: We prepare a market briefing for each client meeting. Analysts gather material from several sources, a partner reviews the narrative, then the team turns it into a final deck."
              required
              rows="7"
              value={description}
            />
            <p className={s.privacyNote}>
              Use 2–4 sentences. Do not include confidential information, client
              names, or unpublished deal details.
            </p>
            <button
              className={cn('button', s.startButton)}
              disabled={loading}
              type="submit"
            >
              {loading ? 'Mapping the workflow…' : 'Build a working model'}
            </button>
            {error && <p className={s.error}>{error}</p>}
          </form>
          <WorkflowSheet state={null} />
        </section>
      )}

      {(phase === 'question' || phase === 'review') && state && (
        <section className={cn(s.session, 'layout-block')}>
          <div className={s.conversation}>
            {phase === 'question' ? (
              <form onSubmit={continueWithAnswer}>
                <p className={s.questionCount}>One useful question</p>
                <h2 id="diagnostic-question">{question.prompt}</h2>
                <p className={s.why} id="diagnostic-question-context">
                  {question.whyItMatters}
                </p>
                <textarea
                  aria-describedby="diagnostic-question-context"
                  aria-labelledby="diagnostic-question"
                  autoFocus
                  maxLength="750"
                  onChange={(event) => setAnswer(event.target.value)}
                  required
                  rows="5"
                  value={answer}
                />
                <button
                  className={cn('button', s.continueButton)}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Updating the model…' : 'Continue'}
                </button>
              </form>
            ) : (
              <div className={s.reviewCopy}>
                <p>Human checkpoint</p>
                <h2>Review the workflow before the assessment continues.</h2>
                <p>
                  Correct anything that is wrong or incomplete. The
                  recommendation will use this working model, not the chat
                  history.
                </p>
                <button
                  className={cn('button', s.continueButton)}
                  disabled={loading}
                  onClick={finalize}
                  type="button"
                >
                  {loading
                    ? 'Assessing workflow fit…'
                    : 'Use this understanding'}
                </button>
              </div>
            )}
            {error && <p className={s.error}>{error}</p>}
          </div>
          <WorkflowSheet
            editable={phase === 'review'}
            onStateChange={setState}
            state={state}
          />
        </section>
      )}

      {phase === 'brief' && brief && (
        <>
          <DiagnosticBrief
            brief={brief}
            onDiscuss={() => setPhase('handoff')}
            state={state}
          />
          <button
            className={cn('button', s.resetButton)}
            onClick={reset}
            type="button"
          >
            Start another workflow
          </button>
        </>
      )}

      {phase === 'handoff' && brief && (
        <Handoff brief={brief} onSent={() => setPhase('sent')} state={state} />
      )}

      {phase === 'sent' && (
        <section className={cn(s.sent, 'layout-block')}>
          <h2>Sent.</h2>
          <p>
            Louis now has your preliminary brief and will reply to the address
            you provided.
          </p>
          <button
            className={cn('button', s.resetButton)}
            onClick={reset}
            type="button"
          >
            Start another workflow
          </button>
        </section>
      )}
    </article>
  )
}
