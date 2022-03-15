import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { ExtendedRequest } from '../../interfaces/server';
import middleware from '../../middleware/database';

const handler = nextConnect<ExtendedRequest, NextApiResponse>();
handler.use(middleware);

handler.get(async (req, res) => {
  
  const { query, path, fuzzy, page, limit, regex, collection, searchIndex, synonyms, autoIndex } = req.query;
  const { db } = req.mongodb;

  
  const limitValue = limit ? Number.parseInt(limit as string) : 10;
  let pageValue = page ? Number.parseInt(page as string) - 1: 0;
  pageValue = pageValue < 0 ? 0 : pageValue;

  const fuzzyOptions = fuzzy === "true" ? {
    "maxEdits": 2,
    // "maxExpansions": 50,
  } : null

  
  const pathOptions = !path || path === '*' ? { "wildcard": "*" } : path.toString().replace(' ', '').split(',')
  console.log('path', pathOptions);

  const regexStage = {
    "$search": {
      "index": searchIndex ? searchIndex : 'default',
        "regex": {
          "query": `.*${query}.*`,
          "path": pathOptions,
          "allowAnalyzedField": true
        },
        "highlight": {
          "path": pathOptions
        }
    }
  }
  
  const textStage = {
    "$search": {
      "index": searchIndex ? searchIndex : 'default',
      "text": {
        "query": query,
        "path": pathOptions,
        "fuzzy": fuzzyOptions,
        synonyms
      },
      "highlight": {
        "path": pathOptions
      }
    }
  };

  const searchStage = regex === "true" ? regexStage : textStage

  const metadataStage = [
    {
      "$addFields": {
        "meta": {
          "score": { "$meta": "searchScore" },
          "highlights": { "$meta": "searchHighlights" } 
        }
      }
    }
  ]
  const skipLimitStage = [
    {
      "$skip": pageValue * limitValue
    },
    {
      "$limit": limitValue
    }
  ]

  console.log(skipLimitStage);
  

  // Need to limit the count, this can take a long time if the result set is huge
  const countStage = [{ $limit: 1001 }, { $count: 'total' }]

  // console.log(`Getting the total results`, JSON.stringify([searchStage, ...countStage ], null, 2));
  
  try {
    let totalMatches = 0
    try {
      let { total } = await db.collection(collection as string).aggregate([searchStage, ...countStage ]).next()
      totalMatches = total
    } catch (error) {
      console.log(`Did not return total from pipeline. Setting total to 0.`);
      
    }

    const pipeline = [searchStage, ...metadataStage, ...skipLimitStage]
    console.log(JSON.stringify(pipeline));
    
    let result = await db.collection(collection as string).aggregate(pipeline).toArray();
    return res.send({total: totalMatches, result, payload: pipeline});
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export default handler;