import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  isDbConnected(): boolean {
    return true;
  }

  async saveMission(data: {
    roomCode: string;
    scenarioId: string;
    scenarioName: string;
    status: string;
    teamScore: number;
    timeRemaining: number;
    playersCount: number;
    playersNames: string;
  }) {
    try {
      const record = await this.prisma.escapeMission.create({
        data: {
          roomCode: data.roomCode,
          scenarioId: data.scenarioId,
          scenarioName: data.scenarioName,
          status: data.status,
          teamScore: data.teamScore,
          timeRemaining: data.timeRemaining,
          playersCount: data.playersCount,
          playersNames: data.playersNames
        }
      });
      console.log(`💾 [Prisma ORM] Misión ${data.roomCode} guardada con éxito (ID: ${record.id})`);
      return record;
    } catch (err: any) {
      console.error('⚠️ [Prisma ORM] Error al guardar misión:', err.message);
      return null;
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      return await this.prisma.escapeMission.findMany({
        where: { status: 'GAME_WON' },
        orderBy: [
          { teamScore: 'desc' },
          { timeRemaining: 'desc' }
        ],
        take: limit
      });
    } catch (err: any) {
      console.error('⚠️ [Prisma ORM] Error al consultar Leaderboard:', err.message);
      return [];
    }
  }

  async getHistory(limit = 20) {
    try {
      return await this.prisma.escapeMission.findMany({
        orderBy: { completedAt: 'desc' },
        take: limit
      });
    } catch (err: any) {
      console.error('⚠️ [Prisma ORM] Error al consultar historial:', err.message);
      return [];
    }
  }
}
