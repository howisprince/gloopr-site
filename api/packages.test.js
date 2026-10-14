import handler from './packages';
import { sql } from '@vercel/postgres';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

const VALID_BODY = {
  name: 'Quick Shine',
  duration: '~1 hr',
  includes: ['Vacuum cleaning', 'Shampoo washing'],
  pricing: {
    'Hatchback': 349,
    'Sedan': 399,
    'Compact SUV': 399,
    '5 Seater SUV': 449,
    '7 Seater SUV': 499,
  },
};

const makeReqRes = (overrides = {}) => {
  const req = {
    method: 'GET',
    query: {},
    headers: {},
    body: {},
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return { req, res };
};

const adminHeaders = () => ({ authorization: 'Bearer test-secret' });

describe('packages api', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ADMIN_SECRET: 'test-secret' };
    // clearAllMocks() only clears call history, so the rejected implementation
    // from an earlier test would leak into tests that queue no value of their own.
    sql.mockReset();
    sql.mockResolvedValue({ rows: [] });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/packages', () => {
    it('should return default packages if table does not exist', async () => {
      sql.mockRejectedValue(new Error('relation "Packages" does not exist'));

      const { req, res } = makeReqRes();
      await handler(req, res);

      expect(sql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        quick: expect.any(Object),
        deep: expect.any(Object),
        rubbing: expect.any(Object),
        windshield: expect.any(Object),
      }));
    });

    it('should return packages from DB if table exists', async () => {
      const mockRows = [
        {
          id: 'test_pkg',
          name: 'Test Package',
          duration: '1 hr',
          includes: '["Test 1", "Test 2"]',
          price_hatchback: 100,
          price_sedan: 200,
          price_compact_suv: 300,
          price_5_seater_suv: 400,
          price_7_seater_suv: 500,
        }
      ];

      sql.mockResolvedValue({ rows: mockRows });

      const { req, res } = makeReqRes();
      await handler(req, res);

      expect(sql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        test_pkg: {
          name: 'Test Package',
          duration: '1 hr',
          includes: ['Test 1', 'Test 2'],
          pricing: {
            "Hatchback": 100,
            "Sedan": 200,
            "Compact SUV": 300,
            "5 Seater SUV": 400,
            "7 Seater SUV": 500
          }
        }
      });
    });

    it('should return 500 on unexpected database error', async () => {
      sql.mockRejectedValue(new Error('connection timeout'));

      const { req, res } = makeReqRes();
      await handler(req, res);

      expect(sql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'connection timeout' });
    });
  });

  describe('PUT /api/packages', () => {
    it('should return 401 without a valid auth header', async () => {
      const { req, res } = makeReqRes({
        method: 'PUT',
        query: { id: 'quick' },
        headers: { authorization: 'Bearer wrong-secret' },
        body: VALID_BODY,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(sql).not.toHaveBeenCalled();
    });

    it('should update a package given a valid payload', async () => {
      sql.mockResolvedValueOnce();

      const { req, res } = makeReqRes({
        method: 'PUT',
        query: { id: 'quick' },
        headers: adminHeaders(),
        body: VALID_BODY,
      });

      await handler(req, res);

      expect(sql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Package updated successfully' });
    });

    it('should fall back to the id in the request body', async () => {
      sql.mockResolvedValueOnce();

      const { req, res } = makeReqRes({
        method: 'PUT',
        headers: adminHeaders(),
        body: { id: 'deep', ...VALID_BODY },
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 when the package id is missing', async () => {
      const { req, res } = makeReqRes({
        method: 'PUT',
        headers: adminHeaders(),
        body: VALID_BODY,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing package ID' });
      expect(sql).not.toHaveBeenCalled();
    });

    it('should return 400 when the body is missing', async () => {
      const { req, res } = makeReqRes({
        method: 'PUT',
        query: { id: 'quick' },
        headers: adminHeaders(),
        body: undefined,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid request body' });
      expect(sql).not.toHaveBeenCalled();
    });

    it.each([
      ['name is missing', { ...VALID_BODY, name: undefined }],
      ['duration is not a string', { ...VALID_BODY, duration: 90 }],
      ['includes is not an array', { ...VALID_BODY, includes: 'Vacuum cleaning' }],
      ['pricing is missing', { ...VALID_BODY, pricing: undefined }],
      ['a car tier is missing', { ...VALID_BODY, pricing: { ...VALID_BODY.pricing, '5 Seater SUV': undefined } }],
      ['a car tier is not a number', { ...VALID_BODY, pricing: { ...VALID_BODY.pricing, Sedan: '399' } }],
    ])('should return 400 when %s', async (_label, body) => {
      const { req, res } = makeReqRes({
        method: 'PUT',
        query: { id: 'quick' },
        headers: adminHeaders(),
        body,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(sql).not.toHaveBeenCalled();
    });

    it('should return 500 on a database error', async () => {
      sql.mockRejectedValueOnce(new Error('DB failure'));

      const { req, res } = makeReqRes({
        method: 'PUT',
        query: { id: 'quick' },
        headers: adminHeaders(),
        body: VALID_BODY,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB failure' });
    });
  });

  describe('POST /api/packages', () => {
    it('should return 401 without a valid auth header', async () => {
      const { req, res } = makeReqRes({
        method: 'POST',
        query: { action: 'setup' },
        headers: { authorization: 'Bearer wrong-secret' },
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(sql).not.toHaveBeenCalled();
    });

    it('should create the table and seed it when empty', async () => {
      sql.mockResolvedValueOnce();
      sql.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const { req, res } = makeReqRes({
        method: 'POST',
        query: { action: 'setup' },
        headers: adminHeaders(),
      });

      await handler(req, res);

      expect(sql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Table setup successful' });
    });

    it('should skip seeding when the table already has rows', async () => {
      sql.mockResolvedValueOnce();
      sql.mockResolvedValueOnce({ rows: [{ count: '4' }] });

      const { req, res } = makeReqRes({
        method: 'POST',
        query: { action: 'setup' },
        headers: adminHeaders(),
      });

      await handler(req, res);

      // One call to CREATE TABLE, one to COUNT(*), and no INSERTs.
      expect(sql).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on a database error during setup', async () => {
      sql.mockRejectedValueOnce(new Error('DB failure'));

      const { req, res } = makeReqRes({
        method: 'POST',
        query: { action: 'setup' },
        headers: adminHeaders(),
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB failure' });
    });
  });

  it('should return 405 for an unsupported method', async () => {
    const { req, res } = makeReqRes({
      method: 'DELETE',
      headers: adminHeaders(),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
