// netlify/functions/votes.js - FIXED for MissingBlobsEnvironmentError
const DEFAULT_COUNTS = { '1': 3, '2': 5, '3': 2 };
const VALID_VOTES = ['1','2','3'];

exports.handler = async (event) => {
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

  let counts = {...DEFAULT_COUNTS};
  let useBlobs = true;
  let store;

  try{
    const { getStore } = require('@netlify/blobs');
    store = getStore('mcd-votes');
    const raw = await store.get('counts', {type: 'json'});
    if(raw && raw['1'] != null) counts = raw;
  }catch(e){
    useBlobs = false;
  }

  if(event.httpMethod === 'GET'){
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
      body: JSON.stringify({counts})
    };
  }

  if(event.httpMethod === 'POST'){
    let payload;
    try{ payload = JSON.parse(event.body || '{}'); }catch(e){
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({error: 'invalid json', counts}) };
    }
    const vote = String(payload.vote || '').trim();
    const previous = payload.previous ? String(payload.previous).trim() : null;
    if(!VALID_VOTES.includes(vote)){
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({error: 'invalid vote', counts}) };
    }
    if(previous && VALID_VOTES.includes(previous) && previous !== vote){
      counts[previous] = Math.max(0, (counts[previous]||0) - 1);
      counts[vote] = (counts[vote]||0) + 1;
    } else if(!previous){
      counts[vote] = (counts[vote]||0) + 1;
    }
    if(useBlobs && store){
      try{ await store.setJSON('counts', counts); }catch(e){}
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
      body: JSON.stringify({counts})
    };
  }

  return { statusCode: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({error: 'method not allowed', counts}) };
};
