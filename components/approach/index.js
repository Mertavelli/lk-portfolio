import { Link } from '@studio-freight/compono'
import va from '@vercel/analytics'
import cn from 'clsx'
import { approach } from 'config/approach'
import { useStore } from 'lib/store'
import { useEffect, useRef, useState } from 'react'
import s from './approach.module.scss'

export function Approach() {
  const [activeStage, setActiveStage] = useState(approach.method[0].id)
  const stageRefs = useRef([])
  const [setContactIsOpen] = useStore((state) => [state.setContactIsOpen])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry) setActiveStage(visibleEntry.target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.2, 0.55] },
    )

    stageRefs.current.forEach((stage) => stage && observer.observe(stage))
    return () => observer.disconnect()
  }, [])

  const openContact = () => {
    va.track('Opened Contact Form', { source: 'Approach' })
    setContactIsOpen(true)
  }

  return (
    <article className={s.approach}>
      <section className={cn(s.intro, 'layout-block')}>
        <div className={cn(s.introGrid, 'layout-grid')}>
          <p className={s.practice}>AI Strategy &amp; Engineering</p>
          <h1 className={s.title}>
            AI is useful when it changes the workflow, not when it adds another
            tab.
          </h1>
          <p className={s.lead}>
            I help teams rethink how research, analysis, and decisions move
            through the business — then build the systems that make the change
            real.
          </p>
        </div>

        <figure className={s.workflow}>
          <figcaption>
            An isolated tool leaves the work around it unchanged.
          </figcaption>
          <ol>
            {approach.workflow.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className={s.isolatedTool}>Isolated AI tool</div>
        </figure>
      </section>

      <section
        className={cn(s.method, 'layout-block')}
        aria-labelledby="method-title"
      >
        <div className={cn(s.methodGrid, 'layout-grid')}>
          <aside className={s.methodIndex}>
            <h2 id="method-title">A practical way to begin.</h2>
            <ol>
              {approach.method.map((stage) => (
                <li
                  className={cn(activeStage === stage.id && s.active)}
                  key={stage.id}
                >
                  <a href={`#${stage.id}`}>{stage.title}</a>
                </li>
              ))}
            </ol>
          </aside>

          <div className={s.stages}>
            {approach.method.map((stage, index) => (
              <section
                aria-labelledby={`${stage.id}-title`}
                className={cn(s.stage, activeStage === stage.id && s.active)}
                id={stage.id}
                key={stage.id}
                ref={(element) => {
                  stageRefs.current[index] = element
                }}
              >
                <p className={s.stageNumber}>
                  {String(index + 1).padStart(2, '0')}
                </p>
                <div>
                  <h3 id={`${stage.id}-title`}>{stage.title}</h3>
                  <p>{stage.copy}</p>
                  <p className={s.stageDetail}>{stage.detail}</p>
                  {stage.id === 'implement' && (
                    <Link
                      className={cn('p-s decorate', s.workLink)}
                      href="/#markets-ai"
                    >
                      See Markets AI
                    </Link>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section
        className={cn(s.judgment, 'layout-block')}
        aria-labelledby="judgment-title"
      >
        <div className={cn(s.judgmentGrid, 'layout-grid')}>
          <div className={s.judgmentCopy}>
            <h2 id="judgment-title">Human judgment stays where it matters.</h2>
            <p>
              In high-stakes workflows, the goal is not maximum autonomy. The
              system should make its output easy to inspect, correct, and
              verify.
            </p>
          </div>
          <figure className={s.system}>
            <figcaption>
              Models propose. Systems constrain. People verify.
            </figcaption>
            <div className={s.systemSteps}>
              <section>
                <p>Probabilistic generation</p>
                <span>Retrieval and model output</span>
              </section>
              <section>
                <p>Structured state</p>
                <span>Schema, validation, evidence</span>
              </section>
              <section>
                <p>Human review</p>
                <span>Inspect, edit, verify</span>
              </section>
            </div>
            <p className={s.systemNote}>
              Missing evidence should be visible. Outputs should stay editable.
            </p>
          </figure>
        </div>
      </section>

      <section
        className={cn(s.research, 'layout-block')}
        aria-labelledby="research-title"
      >
        <div className={cn(s.researchGrid, 'layout-grid')}>
          <p className={s.researchType}>Independent research</p>
          <div>
            <h2 id="research-title">
              Collaborative AI for Private Markets: Schema-Driven Document
              Generation
            </h2>
            <p>
              Independent research into a private-markets editor where model
              output is schema-bound, validated, and reviewed by people before
              it becomes part of a high-stakes document.
            </p>
          </div>
          <a
            className={cn('p-s decorate', s.paperLink)}
            href="/research/collaborative-ai-private-markets.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Read the paper (PDF)
          </a>
        </div>
      </section>

      <section className={cn(s.close, 'layout-block')}>
        <div className={cn(s.closeGrid, 'layout-grid')}>
          <h2>Build the system only after the problem is understood.</h2>
          <div className={s.closeActions}>
            <Link
              className={cn('p-s decorate', s.diagnosticLink)}
              href="/diagnostic"
            >
              Test the method on one workflow
            </Link>
            <button
              className={cn('button', s.contactButton)}
              onClick={openContact}
            >
              Discuss a workflow
            </button>
          </div>
        </div>
      </section>
    </article>
  )
}
