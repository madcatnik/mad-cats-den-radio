// netlify/functions/visitors.js — MAD CATS DEN live visitor counter
// GET  /api/visitors -> {total, now}
// POST /api/visitors {clientId, isNewVisitor} -> {total, now}
// Uses @netlify/blobs for persistence, 2min active window

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'mcd-visitors';
const TOTAL_KEY = 'total';
const ACTIVE_KEY = 'active';
const DEFAULT_TOTAL = 1926;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes = now browsing

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
  let total;
  let active;

  try{
    const t = await store.get(TOTAL_KEY, {type: 'json'});
    total = (typeof t === 'number') ? t : (t && t.value != null ? t.value : DEFAULT_TOTAL);
    if(total == null) total = DEFAULT_TOTAL;
  }catch(e){
    total = DEFAULT_TOTAL;
  }

  try{
    const a = await store.get(ACTIVE_KEY, {type: 'json'});
    active = a && typeof a === 'object' ? a : {};
  }catch(e){
    active = {};
  }

  const nowMs = Date.now();
  const cutoff = nowMs - ACTIVE_WINDOW_MS;

  // prune old entries
  let pruned = false;
  for(const id in active){
    if(active[id] < cutoff){
      delete active[id];
      pruned = true;
    }
  }

  if(event.httpMethod === 'POST'){
    let payload = {};
    try{
      payload = JSON.parse(event.body || '{}');
    }catch(e){}

    const clientId = String(payload.clientId || '').trim().slice(0, 64);
    const isNewVisitor = !!payload.isNewVisitor;

    if(clientId){
      active[clientId] = nowMs;
      if(isNewVisitor){
        total = (total || DEFAULT_TOTAL) + 1;
      }
    }
  }

  // save back (best effort)
  try{
    await store.setJSON(TOTAL_KEY, total);
    await store.setJSON(ACTIVE_KEY, active);
  }catch(e){
    console.warn('visitors blob save failed', e);
  }

  const nowBrowsing = Object.keys(active).length || 1; // at least 1 (you)

  return jsonResponse({total, now: nowBrowsing});
};
