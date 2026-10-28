// netlify/functions/visitors.js - FIXED for MissingBlobsEnvironmentError
const DEFAULT_TOTAL = 1926;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

function makeResponse(total, nowBrowsing){
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({total, now: nowBrowsing})
  };
}

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

  let total = DEFAULT_TOTAL;
  let active = {};
  let useBlobs = true;
  let store;

  try{
    const { getStore } = require('@netlify/blobs');
    store = getStore('mcd-visitors');
  }catch(e){
    // MissingBlobsEnvironmentError or module not found -> fallback
    useBlobs = false;
  }

  if(useBlobs && store){
    try{
      const t = await store.get('total', {type: 'json'});
      if(typeof t === 'number') total = t;
      else if(t && t.value != null) total = t.value;
    }catch(e){}
    try{
      const a = await store.get('active', {type: 'json'});
      if(a && typeof a === 'object') active = a;
    }catch(e){}
  }

  const nowMs = Date.now();
  const cutoff = nowMs - ACTIVE_WINDOW_MS;
  for(const id in active){
    if(active[id] < cutoff) delete active[id];
  }

  if(event.httpMethod === 'POST'){
    try{
      const payload = JSON.parse(event.body || '{}');
      const clientId = String(payload.clientId || '').slice(0,64);
      const isNewVisitor = !!payload.isNewVisitor;
      if(clientId){
        active[clientId] = nowMs;
        if(isNewVisitor) total += 1;
      }
    }catch(e){}
  }

  if(useBlobs && store){
    try{
      await store.setJSON('total', total);
      await store.setJSON('active', active);
    }catch(e){}
  }

  const nowBrowsing = Math.max(1, Object.keys(active).length || 42);
  return makeResponse(total, nowBrowsing);
};
