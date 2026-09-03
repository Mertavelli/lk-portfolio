import { Diagnostic } from 'components/diagnostic'
import { fetchCmsQuery } from 'contentful/api'
import {
  contactEntryQuery,
  footerEntryQuery,
  studioTitanEntryQuery,
} from 'contentful/queries/home.graphql'
import { Layout } from 'layouts/default'

export default function DiagnosticPage({ studioTitan, footer, contact }) {
  return (
    <Layout
      scrollable
      seo={{
        title:
          'Workflow Diagnostic — AI Strategy & Engineering | Louis Karakas',
        description:
          'Map one workflow, identify where AI creates leverage, and keep human judgment where it matters.',
        image: { url: 'https://louiskarakas.com/profile.png' },
      }}
      theme="dark"
      principles={studioTitan?.principles || []}
      studioInfo={{
        phone: studioTitan?.phoneNumber || '',
        email: studioTitan?.email || 'hello@louiskarakas.com',
      }}
      contactData={contact}
      footerLinks={footer?.linksCollection?.items || []}
    >
      <Diagnostic />
    </Layout>
  )
}

export async function getStaticProps({ preview = false }) {
  const [studioData, footerData, contactData] = await Promise.all([
    fetchCmsQuery(studioTitanEntryQuery, { preview }),
    fetchCmsQuery(footerEntryQuery, { preview }),
    fetchCmsQuery(contactEntryQuery, { preview }),
  ])

  return {
    props: {
      studioTitan: studioData?.studioTitan || null,
      footer: footerData?.footer || null,
      contact: contactData?.contact || null,
    },
    revalidate: 30,
  }
}
