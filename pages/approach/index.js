import { Approach } from 'components/approach'
import { fetchCmsQuery } from 'contentful/api'
import {
  contactEntryQuery,
  footerEntryQuery,
  studioTitanEntryQuery,
} from 'contentful/queries/home.graphql'
import { Layout } from 'layouts/default'

export default function ApproachPage({ studioTitan, footer, contact }) {
  return (
    <Layout
      scrollable
      seo={{
        title: 'Approach — AI Strategy & Engineering | Louis Karakas',
        description:
          'How I assess workflows, decide where AI creates real leverage, and build systems that keep human judgment where it matters.',
        image: { url: 'https://louiskarakas.com/profile.png' },
      }}
      theme="dark"
      principles={studioTitan.principles}
      studioInfo={{
        phone: studioTitan.phoneNumber,
        email: studioTitan.email,
      }}
      contactData={contact}
      footerLinks={footer.linksCollection.items}
    >
      <Approach />
    </Layout>
  )
}

export async function getStaticProps({ preview = false }) {
  const [{ studioTitan }, { footer }, { contact }] = await Promise.all([
    fetchCmsQuery(studioTitanEntryQuery, { preview }),
    fetchCmsQuery(footerEntryQuery, { preview }),
    fetchCmsQuery(contactEntryQuery, { preview }),
  ])

  return {
    props: {
      studioTitan,
      footer,
      contact,
    },
    revalidate: 30,
  }
}
