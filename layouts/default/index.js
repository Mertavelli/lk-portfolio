import { Cursor, CustomHead, Scrollbar } from '@studio-freight/compono'
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
    title: 'Louis Karakas – CTO',
    description:
      'Independent CTO. I build AI-native software end-to-end – from idea to working product. Focus on agentic systems, automation and pragmatic execution.',
    image: { url: 'https://louiskarakas.com/profile.png' },
    keywords: [
      'Louis Karakas',
      'AI Product Engineer',
      'AI Engineering',
      'AI Product Development',
      'AI Enablement',
      'LLM Systems',
      'Large Language Models',
      'OpenAI',
      'Agent Orchestration',
      'AI Agents',
      'AI Venture Prototyping',
      'AI Automation',
      'Business Automation',
      'Process Automation',
      'System Architecture',
      'Technical Architecture',
      'Web Application Development',
      'Fullstack Engineering',
      'Next.js',
      'TypeScript',
      'Product Engineering',
      'Custom AI Tools',
      'Execution Focused',
      'Founder Engineer',
      'AI Prototyping',
      'MVP Development',
    ],
  },
  children,
  theme = 'dark',
  className,
  principles,
  footerLinks,
  studioInfo,
  contactData,
}) {
  const debug = useDebug()

  return (
    <>
      <CustomHead {...seo} />

      <div className={cn(`theme-${theme}`, s.layout, className)}>
        <Cursor />
        <Scrollbar />
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
