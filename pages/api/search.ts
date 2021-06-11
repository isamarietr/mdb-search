import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { ExtendedRequest } from '../../interfaces/server';
import middleware from '../../middleware/database';

const handler = nextConnect<ExtendedRequest, NextApiResponse>();
handler.use(middleware);

handler.get(async (req, res) => {
  
  const { query, path, fuzzy, page, limit } = req.query;
  const { indexName, collection } = req.mongodb;
  
  const limitValue = limit ? Number.parseInt(limit as string) : 10;
  let pageValue = page ? Number.parseInt(page as string) - 1: 0;
  pageValue = pageValue < 0 ? 0 : pageValue;

  const fuzzyOptions = fuzzy === "true" ? {
    "maxEdits": 2,
    "maxExpansions": 50,
  } : null

  
  const pathOptions = !path || path === '*' ? { "wildcard": "*" } : path.toString().split(',')
  console.log('path', pathOptions);

  const searchStage = {
    "$search": {
      "index": indexName,
      "text": {
        "query": query,
        "path": pathOptions,
        "fuzzy": fuzzyOptions
      }
    }
  };

  const skipLimitStage = [
    {
      "$skip": pageValue * limitValue
    },
    {
      "$limit": limitValue
    }
  ]

  console.log(skipLimitStage);
  

  const countStage = { $count: 'total' }
  try {
    let totalMatches = 0
    try {
      let { total } = await collection.aggregate([searchStage, countStage ]).next()
      totalMatches = total
    } catch (error) {
      console.log(`Did not return total from pipeline. Setting total to 0.`);
      
    }

    const pipeline = [searchStage, ...skipLimitStage]
    let result = await collection.aggregate(pipeline).toArray();
    return res.send({total: totalMatches, result, payload: searchStage});
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export default handler;