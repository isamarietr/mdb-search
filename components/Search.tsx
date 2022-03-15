
import React, { useEffect, useRef, useState } from 'react'
import { Accordion, Card, Form, Col, Container, Row, Button, Pagination, Spinner } from 'react-bootstrap';
import Layout from './Layout';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../redux/actions';
import { IAppState } from '../redux/initial-state';
import ReactJson from 'react-json-view';
import dynamic from 'next/dynamic'
const flatten = require('flat')

const DynamicReactJson = dynamic(import('react-json-view'), { ssr: false });

const axios = require('axios');

type Props = {
  indexFields: string[]
  actions: any;
  state: IAppState
}

const Search = ({ indexFields, actions, state }: Props) => {

  const [query, setQuery] = useState('')
  const [searchPath, setSearchPath] = useState<string | string[]>('*')
  const [autocompletePath, setAutocompletePath] = useState<string>(null)
  const [results, setResults] = useState(null)
  const [resultsCount, setResultsCount] = useState(0)
  const [isFuzzyMatch, setFuzzyMatch] = useState(false)
  const [isRegex, setRegex] = useState(false)
  const [searchLimit, setSearchLimit] = useState(10)
  const [numPages, setNumPages] = useState(1)
  const [currPage, setCurrPage] = useState(1)
  const [payload, setPayload] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [autocompleteMatches, setAutocompleteMatches] = useState(null)

  const synonymsCollectionRef = useRef<HTMLInputElement>()
  const collectionRef = useRef<HTMLInputElement>()
  const searchIndexRef = useRef<HTMLInputElement>()
  const autocompleteIndexRef = useRef<HTMLInputElement>()

  const TITLE: string = 'Search and Autocomplete Demo';

  useEffect(() => {
    actions.setTitle(TITLE);
  }, [])

  const resetResults = () => {
    setLoading(false)
    setResults([])
    setNumPages(1)
    setCurrPage(1)
    setPayload(null)
    setResultsCount(0)
  }
  const renderPagination = () => {
    let pagesEl = null

    if (numPages > 1) {
      let active = currPage > 0 ? currPage : 1;
      let items = [];
      const maxPages = numPages < 10 ? numPages : 10;
      for (let number = 1; number <= maxPages; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currPage} onClick={() => { setCurrPage(number); onSubmit(null, number) }}>
            {number}
          </Pagination.Item>,
        );
      }
      if (numPages > maxPages) {
        items.push(
          <Pagination.Ellipsis />
        );
      }
      pagesEl = <Pagination>{items}</Pagination>
    }

    return pagesEl
  }

  /**
   * 
   * @returns 
   */
  const renderDatabaseConfig = () => {
    return <Row >
      <Col sm={10} className="">
        <Accordion defaultActiveKey="0">
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey="0">
              Search Index Details
            </Accordion.Toggle>
            <Accordion.Collapse eventKey="0">
              <Form className="my-2 mx-4">
                <Form.Row className="align-items-top">
                  <Col  className="my-2">
                    <Form.Text className="text-muted">
                      Collection
                    </Form.Text>
                    <Form.Control placeholder={`Collection name`} ref={collectionRef} />
                  </Col>
                  <Col  className="my-2">
                    <Form.Text className="text-muted">
                    Synonyms Collection
                    </Form.Text>
                    <Form.Control placeholder={`Synonyms Collection`} ref={synonymsCollectionRef} />
                  </Col>
                  </Form.Row>
                  <Form.Row className="align-items-top">
                  <Col  className="my-2">
                  <Form.Text className="text-muted">
                      Search Index Name
                    </Form.Text>
                    <Form.Control type="text" ref={searchIndexRef}  placeholder={`default`}/>
                  </Col>
                  <Col  className="my-2">
                  <Form.Text className="text-muted">
                      Autocomplete Index Name
                    </Form.Text>
                    <Form.Control placeholder={`default`} type="text" ref={autocompleteIndexRef}/>
                  </Col>
                </Form.Row>
              </Form>
            </Accordion.Collapse>
          </Card>

        </Accordion>
      </Col>
    </Row>


  }
  /**
   * renderMatches
   * @returns 
   */
  const renderAutocompleteMatches = () => {
    let matchList = null
    if (autocompleteMatches) {
      matchList = autocompleteMatches.map((match, index) => {
        return match && match.score ? <a href="#" key={`match-${index}`} className="list-group-item list-group-item-action z-index-1000" onClick={() => { onAutocompleteSelect(match) }}>{match.value} <i>(Score: {match.score.toFixed(3)})</i></a> : null
      })
    }
    return <div className="list-group position-fixed z-index-1000">
      {matchList}
    </div>
  }

  /**
  * onSelect
  * @param match 
  */
  const onAutocompleteSelect = (match: any) => {
    console.log(`autocomplete match`, match);
    setQuery(match.value)
    setAutocompleteMatches(null)
    setPayload(null)
    resetResults()
  }

  /**
   * 
   * @param resultObj 
   * @returns 
   */
  const renderResultObject = (resultObj) => {
    const { meta, ...resultFields } = resultObj
    const flatObj = flatten(resultFields)

    console.log(`flatObj`, flatObj);

    const hitFields = meta.highlights.map((_h) => _h.path)
    console.log(`hitFields`, hitFields);

    return Object.keys(flatObj).map((key, index) => {
      if (key === 'meta') return
      return <Row key={`card-body-${index}`} ><code className={hitFields.includes(key) ? 'highlight' : ''}><b>{key}</b>: {flatObj[key].toString()}</code></Row>
    })
  }

  /**
   * renderResults
   * @returns 
   */
  const renderResults = () => {
    let resultsEl = null
    if (results) {
      resultsEl = results.map((result, index) => {
        if (!result) return
        return (
          // <ReactJson src={result} name={null} displayDataTypes={false} />
          <Card key={`card-${index}`} >
            <Accordion.Toggle eventKey={`${index}`} as={Card.Header}>
              ID: {result._id}
            </Accordion.Toggle>
            <Accordion.Collapse eventKey={`${index}`}>
              <Card.Body>
                {
                  renderResultObject(result)
                }
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        )
      })
    }

    return (
      <Accordion className="mt-5 mb-5" defaultActiveKey="0">
        {isLoading ? <Spinner animation="border" variant="primary" /> : null}
        {results && payload ? <p>Found {resultsCount > 1000 ? <i>more than 1000</i> : resultsCount} results</p> : null}
        {results ? <Row sm={6} className="mx-0">
          {renderPagination()}
        </Row> : null}

        {resultsEl}
      </Accordion>
    )
  }

  /**
   * onKeyDown
   * @param event 
   */
  const onSubmit = async (event: any, page?: number) => {
    // resetResults()
    if (!page) {
      setCurrPage(1)
    }
    setLoading(true)
    axios.get(`/api/search?synonyms=${synonymsCollectionRef.current.value}&collection=${collectionRef.current.value}&searchIndex=${searchIndexRef.current.value}&autoIndex=${autocompleteIndexRef.current.value}&query=${query}&path=${searchPath}&page=${page ? page : 1}&limit=${searchLimit}&fuzzy=${isFuzzyMatch}&regex=${isRegex}`).then(response => {
      console.log(`data`, response);
      setAutocompleteMatches(null)
      setResults(response.data.result);
      setResultsCount(response.data.total);
      setPayload(response.data.payload);
      setNumPages(Math.ceil(response.data.total / searchLimit));
      // actions.setResults(response.data);
      setLoading(false)
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
    const newQuery = event.target.value
    setQuery(event.target.value);
    // console.log(newQuery);

    if (newQuery && autocompletePath) {
      axios.get(`/api/autocomplete?collection=${collectionRef.current.value}&searchIndex=${searchIndexRef.current.value}&autoIndex=${autocompleteIndexRef.current.value}&query=${newQuery}&path=${autocompletePath}&limit=${searchLimit}&fuzzy=${isFuzzyMatch}`).then(response => {
        console.log(`data`, response);
        const results = response.data.result.map((r) => {
          console.log({ value: r["_id"], score: r['score'] });

          return { value: r["_id"], score: r['score'] }
        })
        setAutocompleteMatches(results);
        setPayload(response.data.payload);
      }).catch(error => {
        console.log(error.response)
      })
    }
    else {
      setAutocompleteMatches(null)
    }

  }

  const onFieldChange = async (event: any) => {
    setSearchPath(event.target.value);
  }

  const onAutocompleteFieldChange = async (event: any) => {
    setAutocompletePath(event.target.value);
  }

  /**
   * render
   */
  return (
    <Layout title={state.title}>
      <Container as={Row} fluid className="pt-5 mx-auto" >
        <Col sm={8} className="justify-items-center">
          <Row className="mx-1">
            <h1 className="title">Atlas Search <span className="subtitle">{state.title}</span> </h1>
          </Row>
          {renderDatabaseConfig()}
          <Form className="mt-4">
            <Form.Row className="align-items-center">
              <Col sm={4} className="my-1">
                <Form.Label>Search for...</Form.Label>
                <Form.Control placeholder={`Your search text...`} onChange={onQueryChange} onKeyDown={(event) => { if (query?.length && event.key === 'Enter') { onSubmit(event) } }} value={query} />
                {renderAutocompleteMatches()}
                <Form.Text className="text-muted">
                  We use this to query your index
                </Form.Text>
              </Col>
              <Col sm={3} className="my-1">
                <Form.Label>In these indexed fields...</Form.Label>
                <Form.Control type="text" onChange={onFieldChange} onKeyDown={(event) => { if (query?.length && event.key === 'Enter') { onSubmit(event) } }} value={searchPath} />
                <Form.Text className="text-muted">
                  Separate multiple fields with comma
                </Form.Text>
              </Col>
              <Col sm={3} className="my-1">
                <Form.Label>Autocomplete with...</Form.Label>
                <Form.Control placeholder={`Autocomplete field name`} type="text" onChange={onAutocompleteFieldChange} value={autocompletePath} />
                <Form.Text className="text-muted">
                  Optional: Provide a value to enable
                </Form.Text>
              </Col>
            </Form.Row>
            <Form.Row className="align-items-center">
              <Col xs="auto" className="my-3" >
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label="Fuzzy Match"
                  disabled={isRegex}
                  onClick={() => {
                    setFuzzyMatch(!isFuzzyMatch)
                  }}
                />

              </Col>
              {/* <Col xs="auto" className="my-3" >
                <Form.Check
                  type="switch"
                  id="regex-switch"
                  label="Search exact substring"
                  onClick={() => {
                    setRegex(!isRegex)
                  }}
                />

              </Col> */}
            </Form.Row>
            <Form.Row>
              <Button type="submit" className="my-2" onClick={onSubmit} disabled={!query || !query.length ? true : false}>
                Search
              </Button>
              <Button type="submit" className="ml-2 my-2" onClick={(event) => {
                setQuery('')
                resetResults()
                event.preventDefault();
              }} >
                Clear
              </Button>
            </Form.Row>
          </Form>

          <Row >
            <Col sm={10} className="">
              {renderResults()}
            </Col>
          </Row>


        </Col>
        <div className="code-bg"></div>
        <Col sm={4} className="">
          <Row >
            <h1 className="code-title">View Pipeline</h1>

          </Row>
          <Row className="my-4">
            {payload ? <DynamicReactJson src={payload} name={null} displayDataTypes={false} displayObjectSize={false} /> : <span>Perform a search to see the $search stage</span>}
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