import handler from './packages';
import { sql } from '@vercel/postgres';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

describe('packages api', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return default packages if table does not exist', async () => {
    sql.mockRejectedValue(new Error('relation "Packages" does not exist'));

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

    await handler(req, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'connection timeout' });
  });
});
