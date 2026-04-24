// minimal HTTP wrapper
const http = require('http');
const { greet } = require('./lib/logic');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200); res.end('ok'); return;
  }
  if (req.url.startsWith('/greet')) {
    const name = new URL(req.url, 'http://localhost').searchParams.get('name');
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end(greet(name));
    return;
  }
  res.writeHead(404); res.end('not found');
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log('Listening on', port));
}


/* graceful shutdown & structured logging added by DevOps */
function log(obj){ try { console.log(JSON.stringify(obj)); } catch(e){ console.log(obj); } }
function shutdown(signal){
  log({ level: 'warn', msg: 'shutdown', signal });
  try { server.close(() => process.exit(0)); } catch(e){ process.exit(1); }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;