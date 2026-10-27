// netlify/functions/votes.js — MAD CATS DEN vote counter (vanilla, no deps except @netlify/blobs)
// GET  /api/votes -> {counts: {1:3,2:5,3:2}}
// POST /api/votes {vote:"1", previous:"2"|null} -> {counts}

const { getStore } = require('@netlify/blobs');

const DEFAULT_COUNTS = { '1': 3, '2': 5, '3': 2 };
const VALID_VOTES = ['1','2','3'];
const STORE_NAME = 'mcd-votes';
const KEY = 'counts';

function jsonResponse(body, status=200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if(event.httpMethod === 'OPTIONS'){
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  const store = getStore(STORE_NAME);

  // Try to get existing counts
  let counts;
  try{
    const raw = await store.get(KEY, {type: 'json'});
    counts = raw && raw['1'] != null ? raw : {...DEFAULT_COUNTS};
  }catch(e){
    counts = {...DEFAULT_COUNTS};
  }

  if(event.httpMethod === 'GET'){
    return jsonResponse({counts});
  }

  if(event.httpMethod === 'POST'){
    let payload;
    try{
      payload = JSON.parse(event.body || '{}');
    }catch(e){
      return jsonResponse({error: 'invalid json', counts}, 400);
    }

    const vote = String(payload.vote || '').trim();
    const previous = payload.previous ? String(payload.previous).trim() : null;

    if(!VALID_VOTES.includes(vote)){
      return jsonResponse({error: 'invalid vote', counts}, 400);
    }

    // Apply vote logic: decrement previous if different, increment new
    if(previous && VALID_VOTES.includes(previous) && previous !== vote){
      counts[previous] = Math.max(0, (counts[previous]||0) - 1);
      counts[vote] = (counts[vote]||0) + 1;
    } else if(!previous){
      // first vote
      counts[vote] = (counts[vote]||0) + 1;
    } else if(previous === vote){
      // same vote again - no change (idempotent)
    }

    try{
      await store.setJSON(KEY, counts);
    }catch(e){
      console.warn('blobs set failed', e);
      // still return counts even if persistence fails
    }

    return jsonResponse({counts});
  }

  return jsonResponse({error: 'method not allowed', counts}, 405);
};
