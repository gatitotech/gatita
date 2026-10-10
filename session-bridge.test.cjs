const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync(__dirname + '/session-bridge.html', 'utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

async function check(token, response, expected) {
  let sent;
  let authorization;
  const context = {
    localStorage: { getItem: () => token },
    fetch: async (_url, options) => {
      authorization = options.headers.Authorization;
      return { ok: true, json: async () => ({ user: response }) };
    },
    parent: { postMessage: (message, origin) => { sent = { message, origin }; } }
  };
  vm.runInNewContext(script, context);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(authorization, token ? `Bearer ${token}` : undefined);
  assert.equal(sent.origin, 'https://search.gatita.tech');
  assert.equal(sent.message.type, 'gatita-account');
  assert.equal(sent.message.user?.email, expected);
  assert.equal(JSON.stringify(sent).includes(token || 'impossible-token'), false);
}

Promise.all([
  check('test-token', { id: '1', displayName: 'Test', email: 'test@example.com', privateField: 'secret' }, 'test@example.com'),
  check('', null, undefined)
]).then(() => console.log('session bridge OK')).catch((error) => { console.error(error); process.exitCode = 1; });
