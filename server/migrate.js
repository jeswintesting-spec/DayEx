require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Running migrations...');

    // Create expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(100) NOT NULL,
        amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        category    VARCHAR(50) NOT NULL DEFAULT 'Others',
        date        DATE NOT NULL,
        note        TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "expenses" ready');

    // Create budget table (single-row config)
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget (
        id             SERIAL PRIMARY KEY,
        monthly_limit  NUMERIC(12, 2) NOT NULL DEFAULT 20000,
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "budget" ready');

    // Seed budget row if empty
    const budgetCount = await client.query('SELECT COUNT(*) FROM budget');
    if (parseInt(budgetCount.rows[0].count) === 0) {
      await client.query('INSERT INTO budget (monthly_limit) VALUES (20000)');
      console.log('✅ Budget seeded with ₹20,000 default limit');
    }

    // Seed sample expenses if empty
    const expenseCount = await client.query('SELECT COUNT(*) FROM expenses');
    if (parseInt(expenseCount.rows[0].count) === 0) {
      const today = new Date().toISOString().split('T')[0];
      const daysAgo = (n) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
      };

      const samples = [
        ['Coffee at Starbucks', 350, 'Food', today, 'Tall Java Chip Frappuccino with extra whip.'],
        ['Uber to office', 450, 'Travel', today, 'Raining heavily, surge pricing active.'],
        ['Monthly Groceries', 3200, 'Food', daysAgo(2), 'Stocked up on pantry essentials from Zepto.'],
        ['Netflix Subscription', 649, 'Entertainment', daysAgo(5), 'Premium 4K ultra-HD plan.'],
        ['Electricity Bill', 1850, 'Bills', daysAgo(10), 'Power bill for May.'],
        ['New Sneakers', 4999, 'Shopping', daysAgo(12), 'Puma running shoes from Myntra sale.'],
      ];

      for (const [title, amount, category, date, note] of samples) {
        await client.query(
          'INSERT INTO expenses (title, amount, category, date, note) VALUES ($1, $2, $3, $4, $5)',
          [title, amount, category, date, note]
        );
      }
      console.log(`✅ Seeded ${samples.length} sample expenses`);
    }

    console.log('\n🎉 Migration complete! Database is ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
