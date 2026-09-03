import { Cursor, CustomHead } from '@studio-freight/compono'
import { useDebug } from '@studio-freight/hamo'
import cn from 'clsx'
import { Footer } from 'components/footer'
import { Header } from 'components/header'
import dynamic from 'next/dynamic'
import s from './layout.module.scss'

const Orchestra = dynamic(
  () => import('lib/orchestra').then(({ Orchestra }) => Orchestra),
  { ssr: false },
)

export function Layout({
  seo = {
    title: 'Louis Karakas – AI Strategy & Engineering',
    description:
      'I help knowledge-intensive businesses redesign how they work with AI and build the systems required to make it real. Focus on AI strategy, agentic workflows and custom AI software.',
    image: { url: 'https://louiskarakas.com/profile.png' },
    keywords: [
      'Louis Karakas',
      'AI Strategy',
      'AI Engineering',
      'AI Strategy and Engineering',
      'AI Consultant',
      'AI Transformation',
      'AI Operating Model',
      'AI-Native Workflows',
      'Agentic Workflows',
      'AI Agents',
      'Agentic Systems',
      'Custom AI Software',
      'AI Automation',
      'Knowledge Systems',
      'Research Automation',
      'Workflow Automation',
      'Professional Services AI',
      'Consulting AI',
      'Business Process Automation',
      'AI Product Engineering',
      'Fullstack Engineering',
      'System Architecture',
      'Technical Architecture',
      'Next.js',
      'TypeScript',
      'LLM Systems',
      'OpenAI',
      'Human-in-the-Loop Systems',
      'AI Enablement',
    ],
  },
  children,
  theme = 'dark',
  className,
  principles,
  footerLinks,
  studioInfo,
  contactData,
  scrollable = false,
}) {
  const debug = useDebug()

  return (
    <>
      <CustomHead {...seo} />

      <div
        className={cn(
          `theme-${theme}`,
          s.layout,
          scrollable && s.scrollable,
          className,
        )}
      >
        <Cursor />
        <Header principles={principles} contact={contactData} />
        <main className={s.main}>{children}</main>
        <Footer links={footerLinks} studioInfo={studioInfo} />
      </div>

      {debug && (
        <>
          <Orchestra />
        </>
      )}
    </>
  )
}
