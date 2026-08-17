import assert from 'assert';
import bookingsHandler from './api/bookings.js';
import packagesHandler from './api/packages.js';

function createMockReqRes(method, path, headers = {}) {
  const req = {
    method,
    url: path,
    headers,
    query: {},
    body: {}
  };
  const res = {
    statusCode: null,
    body: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.body = data;
      return this;
    }
  };
  return { req, res };
}

async function runTests() {
  console.log("Running security fix tests...");

  // Test 1: Bookings Setup (Admin) - Missing ADMIN_SECRET in env, sending "Bearer undefined"
  console.log("Test 1: Bookings - Bearer undefined bypass attempt");
  process.env.ADMIN_SECRET = ''; // ensure it's not set
  let { req, res } = createMockReqRes('POST', '/api/bookings', { authorization: 'Bearer undefined' });
  req.query.action = 'setup';
  await bookingsHandler(req, res);
  assert.strictEqual(res.statusCode, 401, "Bookings handler should return 401 when ADMIN_SECRET is not set, even if client sends 'Bearer undefined'");

  // Test 2: Packages Setup (Admin) - Missing ADMIN_SECRET in env, sending "Bearer undefined"
  console.log("Test 2: Packages - Bearer undefined bypass attempt");
  process.env.ADMIN_SECRET = ''; // ensure it's not set
  ({ req, res } = createMockReqRes('POST', '/api/packages', { authorization: 'Bearer undefined' }));
  req.query.action = 'setup';
  await packagesHandler(req, res);
  assert.strictEqual(res.statusCode, 401, "Packages handler should return 401 when ADMIN_SECRET is not set, even if client sends 'Bearer undefined'");

  // Test 3: Valid secret correctly authenticates for Bookings
  console.log("Test 3: Bookings - Valid authentication");
  process.env.ADMIN_SECRET = 'super-secret-123';
  ({ req, res } = createMockReqRes('GET', '/api/bookings', { authorization: 'Bearer super-secret-123' }));
  try {
      await bookingsHandler(req, res);
  } catch(e) {
      // It should pass auth and throw a Vercel Postgres error because of missing URL
      assert.ok(e.message.includes('POSTGRES_URL') || e.message.includes('requires'), "Should pass auth and hit DB logic");
  }
  // If it didn't throw, it should return 200 or 500 depending on the DB error
  if (res.statusCode !== null) {
      assert.notStrictEqual(res.statusCode, 401, "Should not return 401 for valid auth");
  }

  // Test 4: Valid secret correctly authenticates for Packages
  console.log("Test 4: Packages - Valid authentication");
  process.env.ADMIN_SECRET = 'super-secret-123';
  ({ req, res } = createMockReqRes('PUT', '/api/packages', { authorization: 'Bearer super-secret-123' }));
  req.body = { id: 'quick', pricing: { "Hatchback": 1, "Sedan": 1, "Compact SUV": 1, "5 Seater SUV": 1, "7 Seater SUV": 1 } };
  try {
    await packagesHandler(req, res);
  } catch(e) {
    assert.ok(e.message.includes('POSTGRES_URL') || e.message.includes('requires'), "Should pass auth and hit DB logic");
  }
  if (res.statusCode !== null) {
      assert.notStrictEqual(res.statusCode, 401, "Should not return 401 for valid auth");
  }

  // Test 5: Hardcoded fallback removed
  console.log("Test 5: Hardcoded fallback removed");
  process.env.ADMIN_SECRET = '';
  ({ req, res } = createMockReqRes('GET', '/api/bookings', { authorization: 'Bearer gloopr-admin-secret-2025' }));
  await bookingsHandler(req, res);
  assert.strictEqual(res.statusCode, 401, "Bookings handler should not authenticate with old hardcoded fallback");

  console.log("All tests passed!");
}

runTests().catch((err) => {
    console.error(err);
    process.exit(1);
});
