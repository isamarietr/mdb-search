import { GetStaticProps } from 'next';
import React from 'react'
import { Container } from 'react-bootstrap';
import Search from '../components/Search';
import Layout from '../components/Layout';

type Props = {
  indexField: string
}

export default function Home(props: Props) {
  return (
    <Layout title="Home">
      <Container fluid className="pt-5 mx-auto" >
        <Search indexField={props.indexField} />
      </Container>
    </Layout>
  )
}


export const getStaticProps: GetStaticProps = async () => {
  const indexField = process.env.INDEX_FIELD
  return { props: { indexField } }
}