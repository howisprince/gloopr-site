import handler from './bookings';
import { sql } from '@vercel/postgres';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

describe('Bookings API handler', () => {
  let req;
  let res;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ADMIN_SECRET: 'test-secret' };

    req = {
      method: '',
      query: {},
      headers: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    sql.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Unsupported Method', () => {
    it('should return 401 for unsupported method without auth because of auth check precedence', async () => {
      req.method = 'PUT';
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 405 for unsupported method with auth', async () => {
      req.method = 'PUT';
      req.headers.authorization = 'Bearer test-secret';
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });

  describe('POST /api/bookings', () => {
    describe('Setup Action', () => {
      beforeEach(() => {
        req.method = 'POST';
        req.query = { action: 'setup' };
      });

      it('should fail if unauthorized', async () => {
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });

      it('should succeed with correct authorization', async () => {
        req.headers.authorization = 'Bearer test-secret';
        sql.mockResolvedValueOnce();

        await handler(req, res);

        expect(sql).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Bookings table setup successful" });
      });

      it('should return 500 on database error during setup', async () => {
        req.headers.authorization = 'Bearer test-secret';
        sql.mockRejectedValueOnce(new Error('DB connection failed'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'DB connection failed' });
      });
    });

    describe('Create Booking', () => {
      beforeEach(() => {
        req.method = 'POST';
        req.body = {
          bookingId: '123',
          city: 'NY',
          carType: 'SUV',
          pkg: 'Full',
          price: 100,
          date: '2023-10-10',
          time: '10:00',
          name: 'John Doe',
          phone: '1234567890',
          address: '123 St',
        };
      });

      it('should create a booking successfully', async () => {
        sql.mockResolvedValueOnce();

        await handler(req, res);

        expect(sql).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Booking created successfully" });
      });

      it('should gracefully fallback if table does not exist', async () => {
        sql.mockRejectedValueOnce(new Error('relation "bookings" does not exist'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "DB not configured, but proceeding." });
      });

      it('should return 500 on general database error', async () => {
        sql.mockRejectedValueOnce(new Error('DB failure'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'DB failure' });
      });
    });
  });

  describe('Admin Routes (GET/PATCH)', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer test-secret';
    });

    it('should return 401 if not authorized', async () => {
      req.headers.authorization = 'Bearer wrong-secret';
      req.method = 'GET';
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    describe('GET /api/bookings', () => {
      beforeEach(() => {
        req.method = 'GET';
      });

      it('should return rows from DB', async () => {
        const mockRows = [{ id: 1, name: 'John Doe' }];
        sql.mockResolvedValueOnce({ rows: mockRows });

        await handler(req, res);

        expect(sql).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockRows);
      });

      it('should return empty array if table does not exist', async () => {
        sql.mockRejectedValueOnce(new Error('relation "bookings" does not exist'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
      });

      it('should return 500 on other DB errors', async () => {
        sql.mockRejectedValueOnce(new Error('Connection error'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
      });
    });

    describe('PATCH /api/bookings', () => {
      beforeEach(() => {
        req.method = 'PATCH';
        req.body = { status: 'Confirmed' };
      });

      it('should update booking using query id', async () => {
        req.query = { id: '1' };
        sql.mockResolvedValueOnce();

        await handler(req, res);

        expect(sql).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Booking status updated" });
      });

      it('should update booking using body id', async () => {
        req.body.id = '2';
        sql.mockResolvedValueOnce();

        await handler(req, res);

        expect(sql).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Booking status updated" });
      });

      it('should return 500 on DB error', async () => {
        req.query = { id: '1' };
        sql.mockRejectedValueOnce(new Error('Update failed'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Update failed' });
      });
    });
  });
});
