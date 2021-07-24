import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { ExtendedRequest } from '../../interfaces/server';
import middleware from '../../middleware/database';

const handler = nextConnect<ExtendedRequest, NextApiResponse>();
handler.use(middleware);

handler.get(async (req, res) => {
  const { query, path, limit, fuzzy } = req.query;
  const { autocompleteIndexName, collection } = req.mongodb;

  const fuzzyOptions = fuzzy === "true" ? {
    "maxEdits": 2,
    "prefixLength": 3
  } : null

  try {
    const pipeline = [
      {
        "$search": {
          'index': autocompleteIndexName,
          "autocomplete": {
            "query": `${query}`,
            "path": path,
            "fuzzy": fuzzyOptions,
            "tokenOrder": "sequential"
          }
        }
      },
      {
        '$project': { [path as string]: 1, score: { $meta: "searchScore" } }
      },
      {
        '$group': {
          _id: `$${path}`,
          score: {
            $avg: `$score`
          }
        }
      },
      {
        '$set': {
          [path as string]: "$_id"
        }
      },
      {
        '$limit': limit ? parseInt(limit as string) : 5
      }
    ]

    // const pipeline =  [
    //   {
    //     "$search": {
    //       "index": autocompleteIndexName,
    //       "compound": {
    //         "should": shouldAutocomplete
    //       }
    //     }
    //   },
    //   {
    //     '$limit': limit ? parseInt(limit as string) : 5
    //   },
    //   {
    //     "$addFields": {
    //       "meta": {
    //         "score": { "$meta": "searchScore" },
    //         "highlights": { "$meta": "searchHighlights" } 
    //       }
    //     }
    //   }
    // ]

    // console.log(`Autocomplete pipeline`, JSON.stringify(pipeline, null, 2));
    
    let result = await collection.aggregate(pipeline).toArray();
    return res.send({result, payload: pipeline});
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export default handler;