const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    const count = await prisma.escapeMission.count();
    if (count === 0) {
      await prisma.escapeMission.createMany({
        data: [
          {
            roomCode: 'K7M2',
            scenarioId: 'scenario_reactor',
            scenarioName: 'El Reactor Cuántico (Fuga Nuclear)',
            status: 'GAME_WON',
            teamScore: 3500,
            timeRemaining: 480,
            playersCount: 3,
            playersNames: 'Mynor_Dev, Agente_Nova, Cypher_Bot'
          },
          {
            roomCode: 'X9L4',
            scenarioId: 'scenario_temple',
            scenarioName: 'El Templo Perdido y la Tumba del Faraón',
            status: 'GAME_WON',
            teamScore: 3200,
            timeRemaining: 315,
            playersCount: 2,
            playersNames: 'Comandante_Alfa, Agente_Beta'
          },
          {
            roomCode: 'Z8R1',
            scenarioId: 'scenario_space',
            scenarioName: 'Estación Espacial Internacional',
            status: 'GAME_WON',
            teamScore: 2900,
            timeRemaining: 210,
            playersCount: 4,
            playersNames: 'Astro_Mynor, Echo_Drone, Hacker_Zero, Nova'
          }
        ]
      });
      console.log('✅ 3 misiones de prueba registradas con Prisma ORM en PostgreSQL.');
    } else {
      console.log(`ℹ️ Ya existen ${count} misiones en la tabla escaperoom.escape_missions.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
