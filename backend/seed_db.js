const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '12345678'
});

async function seed() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS escape_missions (
        id SERIAL PRIMARY KEY,
        room_code VARCHAR(10) NOT NULL,
        scenario_id VARCHAR(50) NOT NULL,
        scenario_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        team_score INT NOT NULL,
        time_remaining INT NOT NULL,
        players_count INT NOT NULL,
        players_names TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRes = await pool.query('SELECT COUNT(*) FROM escape_missions;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO escape_missions (room_code, scenario_id, scenario_name, status, team_score, time_remaining, players_count, players_names)
        VALUES 
        ('K7M2', 'scenario_reactor', 'El Reactor Cuántico (Fuga Nuclear)', 'GAME_WON', 3500, 480, 3, 'Mynor_Dev, Agente_Nova, Cypher_Bot'),
        ('X9L4', 'scenario_temple', 'El Templo Perdido y la Tumba del Faraón', 'GAME_WON', 3200, 315, 2, 'Comandante_Alfa, Agente_Beta');
      `);
      console.log('✅ 2 registros de prueba insertados con éxito en PostgreSQL.');
    } else {
      console.log(`ℹ️ La tabla escape_missions ya contiene ${countRes.rows[0].count} registros.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
