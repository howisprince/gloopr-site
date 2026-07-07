import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const adminSecret = process.env.ADMIN_SECRET || 'gloopr-admin-secret-2025';

  if (req.method === 'POST') {
    // Setup helper (Admin only)
    const query = req.query || {};
    if (query.action === 'setup') {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${adminSecret}`) return res.status(401).json({ error: 'Unauthorized' });
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS Bookings (
                    id SERIAL PRIMARY KEY,
                    bookingId VARCHAR(50),
                    city VARCHAR(100),
                    carType VARCHAR(100),
                    pkg VARCHAR(100),
                    price INTEGER,
                    date VARCHAR(50),
                    time VARCHAR(50),
                    name VARCHAR(255),
                    phone VARCHAR(20),
                    address TEXT,
                    status VARCHAR(50) DEFAULT 'Pending',
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            return res.status(200).json({ message: "Bookings table setup successful" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Public route to create a booking
    try {
      const { bookingId, city, carType, pkg, price, date, time, name, phone, address } = req.body;
      await sql`
        INSERT INTO Bookings (bookingId, city, carType, pkg, price, date, time, name, phone, address)
        VALUES (${bookingId}, ${city}, ${carType}, ${pkg}, ${price}, ${date}, ${time}, ${name}, ${phone}, ${address});
      `;
      return res.status(200).json({ message: "Booking created successfully" });
    } catch (error) {
      if (error.message.includes('does not exist')) {
          // Graceful fallback if user hasn't setup Vercel Postgres table yet
          console.warn('Booking table does not exist. Skipping DB save.');
          return res.status(200).json({ message: "DB not configured, but proceeding." });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // Admin routes below (require authentication)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM Bookings ORDER BY createdAt DESC;`;
      return res.status(200).json(rows);
    } catch (error) {
      if (error.message.includes('does not exist')) return res.status(200).json([]);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id } = req.query || {};
      let bookingDbId = id;
      if (!bookingDbId) bookingDbId = req.body.id;
      const { status } = req.body;

      await sql`UPDATE Bookings SET status = ${status} WHERE id = ${bookingDbId};`;
      return res.status(200).json({ message: "Booking status updated" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
