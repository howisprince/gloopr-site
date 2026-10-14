/**
 * Guards against the "Bearer undefined" auth bypass.
 *
 * If ADMIN_SECRET is unset, the handler must reject every request, including
 * one that sends `Authorization: Bearer undefined` — the literal string that
 * `Bearer ${adminSecret}` interpolates to when the variable is undefined.
 */
import handler from './bookings';
import { sql } from '@vercel/postgres';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

describe('admin secret guards', () => {
  const originalEnv = process.env;
  let req;
  let res;

  const makeReqRes = (method, headers, body = {}) => ({
    req: { method, query: {}, headers, body },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.ADMIN_SECRET;
    sql.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects "Bearer undefined" when ADMIN_SECRET is unset', async () => {
    ({ req, res } = makeReqRes('POST', { authorization: 'Bearer undefined' }));
    req.query.action = 'setup';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(sql).not.toHaveBeenCalled();
  });

  it('rejects the retired hardcoded fallback secret', async () => {
    ({ req, res } = makeReqRes('GET', { authorization: 'Bearer gloopr-admin-secret-2025' }));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(sql).not.toHaveBeenCalled();
  });

  it('rejects every admin route when ADMIN_SECRET is unset', async () => {
    for (const method of ['GET', 'PATCH']) {
      ({ req, res } = makeReqRes(method, { authorization: 'Bearer anything' }));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    }
  });

  it('still allows the public booking route with no auth header', async () => {
    sql.mockResolvedValueOnce();
    ({ req, res } = makeReqRes('POST', {}, {
      bookingId: 'SW-123456',
      city: 'Jaipur',
      carType: 'Hatchback',
      pkg: 'Deep Cleaning',
      price: 799,
      date: '2026-10-20',
      time: '9:30 AM',
      name: 'Test User',
      phone: '9876543210',
      address: '12 Example Street, Jaipur',
    }));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
