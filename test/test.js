const assert = require('assert');
const http = require('http');

function fetch(port, path, cb){
  const opts = { hostname: '127.0.0.1', port, path, timeout: 3000 };
  const req = http.get(opts, (res) => {
    let d='';
    res.on('data', c=>d+=c);
    res.on('end', ()=> cb(null, res, d));
  });
  req.on('error', cb);
  req.on('timeout', ()=> { req.abort(); cb(new Error('timeout')); });
}

const server = require('../src/app');

async function runOnce(){
  return new Promise((res, rej) => {
    const s = server.listen(0, () => {
      const port = s.address().port;
      // health check
      fetch(port, '/health', (err, r, body) => {
        if (err) { s.close(); return rej(err); }
        try {
          assert.strictEqual(r.statusCode, 200);
        } catch (e) { s.close(); return rej(e); }
        // greet check
        fetch(port, '/greet?name=qa', (err2, r2, body2) => {
          s.close();
          if (err2) return rej(err2);
          try {
            assert.strictEqual(typeof body2, 'string');
            assert.ok(body2.includes('delivered for'));
            console.log('TEST-PASSED');
            return res(true);
          } catch (e2){ return rej(e2); }
        });
      });
    });
    // safety timeout
    setTimeout(()=> { try { s.close(); } catch(e){}; rej(new Error('test-timeout')); }, 10000);
  });
}

// Retry a few times for flakiness on CI
(async () => {
  for (let i=0;i<3;i++){
    try { await runOnce(); process.exit(0); } catch(e){ if (i===2) { console.error('TEST-FAILED', e && e.message); process.exit(1); } }
    await new Promise(r=>setTimeout(r, 200));
  }
})();