import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { ExtendedRequest } from '../../interfaces/server';
import middleware from '../../middleware/database';

const handler = nextConnect<ExtendedRequest, NextApiResponse>();
handler.use(middleware);

handler.get(async (req, res) => {
  
  const { query, path, fuzzy } = req.query;
  const { indexName, collection } = req.mongodb;
  
  const fuzzyOptions = fuzzy === "true" ? {
    "maxEdits": 2,
    "maxExpansions": 50,
  } : null

  const searchStage = {
    "$search": {
      "index": indexName,
      "text": {
        "query": query,
        "path": { "wildcard": "*" },
        "fuzzy": fuzzyOptions
      }
    }
  };

  const skipLimitStage = [
    {
      "$skip": 0
    },
    {
      "$limit": 10
    }
  ]

  const countStage = { $count: 'total' }
  try {
    let { total } = await collection.aggregate([searchStage, countStage ]).next()

    let result = await collection.aggregate([searchStage, ...skipLimitStage]).toArray();
    return res.send({total, result});
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export default handler;