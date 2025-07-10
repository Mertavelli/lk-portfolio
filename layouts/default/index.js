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
    title: 'Studio Titan – Intelligence meets Execution',
    description:
      'Studio Titan ist ein Studio für AI Beratung, Automatisierung und Produktentwicklung.',
    image: { url: 'https://studiotitan.de/st-og.jpg' },
    keywords: [
      'Studio Titan',
      'AI Beratung',
      'Strategieberatung',
      'digitale Produkte',
      'Automatisierung',
      'Prozessoptimierung',
      'AI Agenten',
      'Custom Tools',
      'digitale Transformation',
      'LLMs',
      'OpenAI',
      'API Entwicklung',
      'digitale Strategie',
      'Webentwicklung',
      'Tech-Consulting',
      'Business Automation',
      'Agentensysteme',
      'Studio',
      'Execution',
      'Intelligence',
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
