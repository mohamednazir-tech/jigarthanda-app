const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Use production database URL
const pool = new Pool({
  connectionString: 'postgresql://postgres.jigarthanda-api.onrender.com:5432/yourdb',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function fixPassword() {
  try {
    const userId = 'usr_nazir_001';
    const correctPassword = 'baseel123';
    const hashedPassword = '$2b$10$d.O.juucl6lKUJtnsvQV4ep3ivEkpdASjEhjjFSwtp0ZqzakPyNB2';
    
    console.log('🔧 Fixing password for user:', userId);
    console.log('Setting password to:', correctPassword);
    console.log('Using hash:', hashedPassword);
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    console.log('✅ Password fixed successfully!');
    console.log('Now you can update password from baseel123 to baseel@123');
    
  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await pool.end();
  }
}

fixPassword();
