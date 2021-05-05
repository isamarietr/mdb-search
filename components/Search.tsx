
import React, { useEffect, useState } from 'react'
import { Accordion, Card, Form, Col, Container, Row, Button } from 'react-bootstrap';
import Layout from './Layout';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../redux/actions';
import { IAppState } from '../redux/initial-state';

const axios = require('axios');

type Props = {
  indexFields: string[]
  actions: any;
  state: IAppState
}

const Search = ({ indexFields, actions, state }: Props) => {

  const [query, setQuery] = useState('')
  const [searchPath, setSearchPath] = useState<string | string[]>('*')
  const [results, setResults] = useState(null)
  const [isFuzzyMatch, setFuzzyMatch] = useState(false)
  const [searchLimit, setSearchLimit] = useState(10)

  const TITLE: string = 'Search';

  useEffect(() => {
    actions.setTitle(TITLE);
  }, [])

  /**
   * renderResults
   * @returns 
   */
  const renderResults = () => {
    let resultsEl = null
    if (results) {
      resultsEl = results.map((result, index) => {
        return (
          <Card key={`card-${index}`} >
            <Accordion.Toggle eventKey={`${index}`} as={Card.Header}>
              Id: {result._id}
            </Accordion.Toggle>
            <Accordion.Collapse eventKey={`${index}`}>
              <Card.Body>
                {
                  Object.keys(result).map((key, index) => {
                    const value = JSON.stringify(result[key], null, 2) 
                    return <Row key={`card-body-${index}`} ><code className={value.toUpperCase().includes(query.toUpperCase()) ? 'highlight' : ''}><b>{key}</b>: { value }</code></Row>
                  })
              }
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        )
      })
    }
    return (
      <Accordion className="mt-5" defaultActiveKey="0">
        {results ? <p>Found {results.length} results</p> : null}
        {resultsEl}
      </Accordion>)
  }

  /**
   * onKeyDown
   * @param event 
   */
  const onSubmit = async (event: any) => {

    axios.get(`/api/search?query=${query}&path=${searchPath}&limit=${searchLimit}&fuzzy=${isFuzzyMatch}`).then(response => {
      console.log(`data`, response);
      setResults(response.data);
      // actions.setResults(response.data);
    }).catch(error => {
      console.log(error.response)
    })
    if (event) {
      event.preventDefault();
    }
  }

  /**
   * onQueryChange
   * @param event 
   */
  const onQueryChange = async (event: any) => {
    setQuery(event.target.value);
    setResults(null);
  }

  /**
   * render
   */
  return (
    <Layout title={state.title}>
      <Container fluid className="pt-5 mx-auto" >
        <Col className="justify-items-center">
          <Row className="mx-1">
            <h1 className="title">Atlas Search <span className="subtitle">{state.title}</span> </h1>
          </Row>
          <Form className="mt-4">
          <Form.Text className="mb-1" muted>
                  Searching for values in { searchPath === '*' ? `all fields` : indexFields.join(', ')}
                </Form.Text>
            <Form.Row className="align-items-center">
              <Col sm={4} className="my-1">
                <Form.Control placeholder={`Enter your search text...`} onChange={onQueryChange} onKeyDown={(event) => { if (query?.length && event.key === 'Enter') { onSubmit(event) }}} value={query} />
              </Col>
              <Col sm={4} className="my-1">
            <Button type="submit" className="my-1" onClick={onSubmit} disabled={!query || !query.length ? true : false}>
                Search
              </Button>
              </Col>
             
            </Form.Row>
            <Form.Row className="align-items-center">
            <Col xs="auto" className="my-1" >
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label="Fuzzy Match"
                  onClick={() => {
                    setFuzzyMatch(!isFuzzyMatch)
                  }}
                />
                
              </Col>
              {/* <Col xs="auto" className="my-1" >
              <Form.Check
                  type="switch"
                  id="wildcard-switch"
                  label="Search across all fields"
                  checked disabled
                />
                </Col> */}
            </Form.Row>
          </Form>

          <Row >
            <Col sm={6} className="">
              {renderResults()}
            </Col>
          </Row>

        </Col>
      </Container>
    </Layout>
  )
}

function mapStateToProps(state) {
  return {
    state: state
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);