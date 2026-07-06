import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM Packages;`;

      const packagesObj = {};
      rows.forEach(row => {
          packagesObj[row.id] = {
              name: row.name,
              duration: row.duration,
              includes: JSON.parse(row.includes),
              pricing: {
                  "Hatchback": row.price_hatchback,
                  "Sedan": row.price_sedan,
                  "Compact SUV": row.price_compact_suv,
                  "5 Seater SUV": row.price_5_seater_suv,
                  "7 Seater SUV": row.price_7_seater_suv
              }
          };
      });
      return res.status(200).json(packagesObj);
    } catch (error) {
      // If table doesn't exist (first run), return default packages
      if (error.message.includes('does not exist')) {
          // In a real Vercel app, the user needs to create the table via Vercel CLI or Dashboard
          // We provide a fallback here for seamless frontend loading if DB isn't setup
          const defaultPkgs = {
            "quick": { "name": "Quick Shine", "duration": "~1 hr", "includes": ["Vacuum cleaning", "Shampoo washing", "Tyre polish", "Interior dusting"], "pricing": { "Hatchback": 349, "Sedan": 399, "Compact SUV": 399, "5 Seater SUV": 449, "7 Seater SUV": 499 } },
            "deep": { "name": "Deep Cleaning", "duration": "2-3 hrs", "includes": ["Quick shine + interior polishing", "Door-dashboard-seat-roof-mats-trunk dry cleaning"], "pricing": { "Hatchback": 799, "Sedan": 999, "Compact SUV": 999, "5 Seater SUV": 1199, "7 Seater SUV": 1399 } },
            "rubbing": { "name": "Rubbing & Polishing", "duration": "2-3 hrs", "includes": ["Shampoo wash", "Boot/roof buffing", "Doors-headlight-bonnet-sandpaper rubbing", "Exterior wax polishing"], "pricing": { "Hatchback": 1399, "Sedan": 1599, "Compact SUV": 1599, "5 Seater SUV": 1699, "7 Seater SUV": 1799 } },
            "windshield": { "name": "Windshield Polish", "duration": "~2 hrs", "includes": ["Shampoo wash", "Windshield-headlight sandpaper rubbing", "Water-repellent coat"], "pricing": { "Hatchback": 799, "Sedan": 999, "Compact SUV": 999, "5 Seater SUV": 1199, "7 Seater SUV": 1199 } }
          };
          return res.status(200).json(defaultPkgs);
      }
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    // Basic Auth Check
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { id } = req.query || {}; // Safely unpack query in case it is undefined
      // If we use /api/packages?id=something
      let packageId = id;
      if (!packageId) {
         // Fallback if ID is in body
         packageId = req.body.id;
      }

      const { name, duration, includes, pricing } = req.body;
      const includesStr = JSON.stringify(includes);

      await sql`
        UPDATE Packages SET
        name = ${name}, duration = ${duration}, includes = ${includesStr},
        price_hatchback = ${pricing["Hatchback"]},
        price_sedan = ${pricing["Sedan"]},
        price_compact_suv = ${pricing["Compact SUV"]},
        price_5_seater_suv = ${pricing["5 Seater SUV"]},
        price_7_seater_suv = ${pricing["7 Seater SUV"]}
        WHERE id = ${packageId}
      `;
      return res.status(200).json({ message: "Package updated successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Create table helper (Admin setup)
  if (req.method === 'POST') {
     const authHeader = req.headers.authorization;
     if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) return res.status(401).json({ error: 'Unauthorized' });

     const query = req.query || {};
     if (query.action === 'setup') {
         try {
             await sql`
                CREATE TABLE IF NOT EXISTS Packages (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100),
                    duration VARCHAR(50),
                    includes TEXT,
                    price_hatchback INTEGER,
                    price_sedan INTEGER,
                    price_compact_suv INTEGER,
                    price_5_seater_suv INTEGER,
                    price_7_seater_suv INTEGER
                );
             `;
             // Seed data if needed
             const countRes = await sql`SELECT COUNT(*) FROM Packages;`;
             if (parseInt(countRes.rows[0].count) === 0) {
                 await sql`INSERT INTO Packages VALUES ('quick', 'Quick Shine', '~1 hr', '["Vacuum cleaning", "Shampoo washing", "Tyre polish", "Interior dusting"]', 349, 399, 399, 449, 499);`;
                 await sql`INSERT INTO Packages VALUES ('deep', 'Deep Cleaning', '2-3 hrs', '["Quick shine + interior polishing", "Door-dashboard-seat-roof-mats-trunk dry cleaning"]', 799, 999, 999, 1199, 1399);`;
                 await sql`INSERT INTO Packages VALUES ('rubbing', 'Rubbing & Polishing', '2-3 hrs', '["Shampoo wash", "Boot/roof buffing", "Doors-headlight-bonnet-sandpaper rubbing", "Exterior wax polishing"]', 1399, 1599, 1599, 1699, 1799);`;
                 await sql`INSERT INTO Packages VALUES ('windshield', 'Windshield Polish', '~2 hrs', '["Shampoo wash", "Windshield-headlight sandpaper rubbing", "Water-repellent coat"]', 799, 999, 999, 1199, 1199);`;
             }
             return res.status(200).json({ message: "Table setup successful" });
         } catch (error) {
             return res.status(500).json({ error: error.message });
         }
     }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
