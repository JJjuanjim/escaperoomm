import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
const scenariosData = require('../data/scenarios.json');

@Injectable()
export class EscapeService {
  private rooms = new Map<string, any>();
  private scenarios = scenariosData;

  constructor(private readonly dbService: DatabaseService) {}

  getScenariosCatalog() {
    return this.scenarios.map((s: any) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      themeColor: s.themeColor,
      icon: s.icon
    }));
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostPlayer: any, chosenScenarioId: string | null = null) {
    const code = this.generateRoomCode();
    let selectedScenario = this.scenarios.find((s: any) => s.id === chosenScenarioId);
    if (!selectedScenario) {
      selectedScenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
    }

    const room = {
      code,
      hostId: hostPlayer.id,
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'ROOM_COMPLETED' | 'GAME_WON' | 'GAME_OVER'
      scenario: selectedScenario,
      levelsData: selectedScenario.levels,
      players: [hostPlayer],
      settings: {
        maxPlayers: 4,
        minPlayers: 2,
        totalTimeSeconds: 900 // 15 minutos
      },
      currentLevelIndex: 0,
      currentPuzzleIndex: 0,
      timeRemaining: 900,
      hintsRemaining: 3,
      teamScore: 0,
      cableSequenceState: [],
      sharedCableSequence: [],
      valvesState: new Map<string, number>(),
      chatMessages: [],
      completedPuzzles: [],
      completedLevels: [],
      unlockedClues: []
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase());
  }

  getAllRooms(): Map<string, any> {
    return this.rooms;
  }

  joinRoom(code: string, player: any) {
    const room = this.getRoom(code);
    if (!room) return { error: 'La sala no existe' };

    // Si la partida ya está en curso, verificar reincorporación
    if (room.status === 'PLAYING') {
      const existingPlayer = room.players.find((p: any) => p.name.trim().toLowerCase() === player.name.trim().toLowerCase());
      if (existingPlayer || room.players.length < room.settings.maxPlayers) {
        return { needsApproval: true, room, isExistingPlayer: !!existingPlayer };
      }
      return { error: 'La misión ya ha comenzado y el equipo está completo' };
    }

    if (room.players.length >= room.settings.maxPlayers) {
      return { error: 'La sala está completa (máximo 4 agentes)' };
    }

    const existingIndex = room.players.findIndex((p: any) => p.id === player.id);
    if (existingIndex !== -1) {
      room.players[existingIndex] = { ...room.players[existingIndex], ...player, isConnected: true };
    } else {
      room.players.push(player);
    }

    return { room };
  }

  // Aprobar reincorporación de un jugador con penalización de -10s
  approveRejoin(code: string, newSocketId: string, playerName: string, avatar: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;

    const existingIndex = room.players.findIndex((p: any) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
    if (existingIndex !== -1) {
      room.players[existingIndex].id = newSocketId;
      room.players[existingIndex].avatar = avatar || room.players[existingIndex].avatar;
      room.players[existingIndex].isConnected = true;
    } else {
      room.players.push({
        id: newSocketId,
        name: playerName,
        avatar: avatar || '👨‍🚀',
        isBot: false,
        isConnected: true
      });
    }

    // Penalización de -10 segundos
    room.timeRemaining = Math.max(0, room.timeRemaining - 10);

    room.chatMessages.push({
      id: Date.now().toString(),
      senderId: 'SYSTEM',
      senderName: 'REINCORPORACIÓN',
      avatar: '🚨',
      text: `¡El agente ${playerName} se ha reincorporado a la misión! Penalización: -10s al cronómetro.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });

    return room;
  }

  changeScenario(code: string, scenarioId: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'LOBBY') return null;

    const selected = this.scenarios.find((s: any) => s.id === scenarioId);
    if (selected) {
      room.scenario = selected;
      room.levelsData = selected.levels;
    }
    return room;
  }

  leaveRoom(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room) return null;

    room.players = room.players.filter((p: any) => p.id !== playerId);
    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (room.hostId === playerId) {
      const nextHost = room.players.find((p: any) => !p.isBot) || room.players[0];
      room.hostId = nextHost.id;
    }

    return room;
  }

  startMission(code: string) {
    const room = this.getRoom(code);
    if (!room) return { error: 'Sala no encontrada' };
    if (room.players.length < room.settings.minPlayers) {
      return { error: `Se necesitan al menos ${room.settings.minPlayers} agentes para iniciar` };
    }

    room.status = 'PLAYING';
    room.currentLevelIndex = 0;
    room.currentPuzzleIndex = 0;
    room.timeRemaining = 900;
    room.hintsRemaining = 3;
    room.teamScore = 0;
    room.completedPuzzles = [];
    room.completedLevels = [];
    room.unlockedClues = [];
    room.cableSequenceState = [];
    room.sharedCableSequence = [];
    room.valvesState.clear();
    room.players.forEach((p: any) => {
      room.valvesState.set(p.id, 0);
    });

    room.chatMessages.push({
      id: Date.now().toString(),
      senderId: 'SYSTEM',
      senderName: 'HQ COMANDO',
      avatar: '🚨',
      text: `¡Misión iniciada en "${room.scenario.name}"! Comuníquense en equipo y descifren los enigmas antes de que el tiempo expire.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });

    return { room };
  }

  // Validar respuesta de un puzzle
  submitPuzzleAnswer(code: string, playerId: string, puzzleId: string, answer: any) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'La misión no está activa' };

    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel.puzzles[room.currentPuzzleIndex];

    if (currentPuzzle.id !== puzzleId) {
      return { error: 'Este enigma no es el activo' };
    }

    let isCorrect = false;
    const player = room.players.find((p: any) => p.id === playerId);

    if (currentPuzzle.type === 'RIDDLE') {
      isCorrect = (String(answer).trim().toUpperCase() === currentPuzzle.targetSolution.toUpperCase());
      if (isCorrect && currentPuzzle.rewardClue) {
        if (!room.unlockedClues) room.unlockedClues = [];
        if (!room.unlockedClues.includes(currentPuzzle.rewardClue)) {
          room.unlockedClues.push(currentPuzzle.rewardClue);
        }
      }
    } else if (currentPuzzle.type === 'ASYNC_KEYPAD') {
      isCorrect = (String(answer).trim() === currentPuzzle.targetSolution);
    } else if (currentPuzzle.type === 'CABLE_SEQUENCE') {
      isCorrect = JSON.stringify(answer) === JSON.stringify(currentPuzzle.targetSequence);
    } else if (currentPuzzle.type === 'DECODER') {
      isCorrect = (String(answer).trim().toUpperCase() === currentPuzzle.targetSolution.toUpperCase());
    } else if (currentPuzzle.type === 'PRESSURE_VALVES') {
      isCorrect = (Number(answer) === currentPuzzle.targetTotal);
    } else if (currentPuzzle.type === 'SIMON_MEMORY') {
      isCorrect = JSON.stringify(answer) === JSON.stringify(currentPuzzle.targetSteps);
    } else if (currentPuzzle.type === 'MASTER_PHRASE') {
      const cleanAnswer = String(answer).trim().toUpperCase().replace(/\s+/g, '-');
      isCorrect = (cleanAnswer === currentPuzzle.targetSolution.toUpperCase());
    }

    if (isCorrect) {
      room.completedPuzzles.push(currentPuzzle.id);
      room.teamScore += 500;

      room.chatMessages.push({
        id: Date.now().toString(),
        senderId: 'SYSTEM',
        senderName: 'ÉXITO',
        avatar: '✅',
        text: `¡${player ? player.name : 'El equipo'} resolvió "${currentPuzzle.title}" con éxito!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });

      if (currentPuzzle.rewardClue) {
        room.chatMessages.push({
          id: (Date.now() + 1).toString(),
          senderId: 'SYSTEM',
          senderName: 'BITÁCORA DE PISTAS',
          avatar: '📜',
          text: currentPuzzle.rewardClue,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }

      if (room.currentPuzzleIndex + 1 < currentLevel.puzzles.length) {
        room.currentPuzzleIndex++;
      } else {
        room.completedLevels.push(currentLevel.id);
        room.teamScore += 1000;

        if (room.currentLevelIndex + 1 < room.levelsData.length) {
          room.currentLevelIndex++;
          room.currentPuzzleIndex = 0;
          room.chatMessages.push({
            id: Date.now().toString(),
            senderId: 'SYSTEM',
            senderName: 'COMPUERTA DESBLOQUEADA',
            avatar: '🚪',
            text: `¡Compuerta del Nivel ${currentLevel.roomNumber} abierta! Avanzando al siguiente sector...`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
        } else {
          room.status = 'GAME_WON';
          this.persistMissionEnd(room);
          room.chatMessages.push({
            id: Date.now().toString(),
            senderId: 'SYSTEM',
            senderName: 'MISIÓN CUMPLIDA',
            avatar: '🏆',
            text: '¡FELICITACIONES! El equipo ha desbloqueado todas las compuertas y completado la misión de escape con éxito.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
        }
      }

      return { room, isCorrect: true };
    } else {
      room.timeRemaining = Math.max(0, room.timeRemaining - 15);

      room.chatMessages.push({
        id: Date.now().toString(),
        senderId: 'SYSTEM',
        senderName: 'ALARMA DE SEGURIDAD',
        avatar: '⚠️',
        text: `¡ERROR! Intento fallido de ${player ? player.name : 'un agente'}. Penalización: -15s al cronómetro.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });

      if (room.timeRemaining <= 0) {
        room.status = 'GAME_OVER';
        this.persistMissionEnd(room);
      }

      return { room, isCorrect: false, error: '¡Respuesta o secuencia incorrecta! Penalización: -15 segundos.' };
    }
  }

  validatePuzzleSubmission(roomCode: string, puzzleType: string, answer: any, playerId?: string) {
    const room = this.getRoom(roomCode);
    if (!room) return { success: false, message: 'La sala no existe', penaltyApplied: false };
    if (room.status !== 'PLAYING') {
      this.startMission(roomCode);
    }
    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel?.puzzles?.[room.currentPuzzleIndex];
    if (!currentPuzzle) {
      return { success: false, message: 'No hay enigmas disponibles para validar', penaltyApplied: false };
    }
    const effectivePlayerId = playerId || room.players[0]?.id || 'agent-evaluator';
    const result = this.submitPuzzleAnswer(roomCode, effectivePlayerId, currentPuzzle.id, answer);
    return {
      success: !!result.isCorrect,
      message: result.isCorrect ? '¡Enigma resuelto correctamente!' : (result.error || 'Respuesta errónea'),
      penaltyApplied: !result.isCorrect,
      isLevelCompleted: room.completedLevels?.length > 0
    };
  }


  async persistMissionEnd(room: any) {
    if (!room || room.persisted) return;
    room.persisted = true;
    const playerNames = room.players.map((p: any) => p.name).join(', ');
    await this.dbService.saveMission({
      roomCode: room.code,
      scenarioId: room.scenario.id,
      scenarioName: room.scenario.name,
      status: room.status,
      teamScore: room.teamScore,
      timeRemaining: room.timeRemaining,
      playersCount: room.players.length,
      playersNames: playerNames
    });
  }

  // Sincronización en tiempo real de fusibles de cables
  pushCableColor(code: string, color: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;
    if (!room.sharedCableSequence) room.sharedCableSequence = [];
    if (room.sharedCableSequence.length < 4) {
      room.sharedCableSequence.push(color);
    }
    return room;
  }

  removeCableColor(code: string, index: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING' || !room.sharedCableSequence) return null;
    room.sharedCableSequence.splice(index, 1);
    return room;
  }

  resetCableColors(code: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;
    room.sharedCableSequence = [];
    return room;
  }

  // Actualizar válvula de presión
  updateValve(code: string, playerId: string, pressureValue: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;

    room.valvesState.set(playerId, Math.max(0, Math.min(100, Number(pressureValue) || 0)));

    let totalPressure = 0;
    room.valvesState.forEach((val: number) => totalPressure += val);

    return { room, totalPressure };
  }

  // Solicitar pista del equipo
  useHint(code: string) {
    const room = this.getRoom(code);
    if (!room || room.hintsRemaining <= 0 || room.status !== 'PLAYING') return null;

    room.hintsRemaining--;
    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel.puzzles[room.currentPuzzleIndex];

    const hintText = `💡 PISTA DEL HQ: Para "${currentPuzzle.title}", recuerden combinar la información visible de todos los miembros del equipo.`;
    
    room.chatMessages.push({
      id: Date.now().toString(),
      senderId: 'SYSTEM',
      senderName: 'PISTA HQ',
      avatar: '💡',
      text: hintText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });

    return room;
  }

  restartMission(code: string) {
    const room = this.getRoom(code);
    if (!room) return null;

    const nextScenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
    room.scenario = nextScenario;
    room.levelsData = nextScenario.levels;

    room.status = 'LOBBY';
    room.currentLevelIndex = 0;
    room.currentPuzzleIndex = 0;
    room.timeRemaining = 900;
    room.hintsRemaining = 3;
    room.teamScore = 0;
    room.completedPuzzles = [];
    room.completedLevels = [];
    room.unlockedClues = [];
    room.cableSequenceState = [];
    room.sharedCableSequence = [];
    room.valvesState.clear();
    room.chatMessages = [];

    return room;
  }

  // Sanitizar estado para un jugador específico (Asimetría)
  getSanitizedRoomState(room: any, playerId: string) {
    if (!room) return null;

    const currentLevel = room.levelsData ? room.levelsData[room.currentLevelIndex] : null;
    const currentPuzzle = currentLevel ? currentLevel.puzzles[room.currentPuzzleIndex] : null;

    let myAsymmetricData: any = null;

    if (currentPuzzle && room.status === 'PLAYING') {
      const playerIndex = room.players.findIndex((p: any) => p.id === playerId);
      const totalPlayers = Math.max(2, Math.min(4, room.players.length));
      const keyGroup = `${totalPlayers}_players`;

      if (currentPuzzle.type === 'ASYNC_KEYPAD' && currentPuzzle.playerFragments?.[keyGroup]) {
        const frag = currentPuzzle.playerFragments[keyGroup][playerIndex] || currentPuzzle.playerFragments[keyGroup][0];
        if (frag) {
          myAsymmetricData = {
            roleText: `Fragmento Asignado al Agente ${playerIndex + 1}`,
            fragmentText: frag.fragment,
            hintText: frag.hint
          };
        }
      } else if (currentPuzzle.type === 'CABLE_SEQUENCE') {
        if (playerIndex === 0) {
          myAsymmetricData = {
            hasManual: true,
            manualText: currentPuzzle.guideText || 'Conecta los cables en el orden especificado.',
            availableButtons: ['AZUL', 'AMARILLO']
          };
        } else {
          myAsymmetricData = {
            hasManual: false,
            manualText: 'Un compañero tiene el orden del manual. ¡Espera sus indicaciones para presionar!',
            availableButtons: ['ROJO', 'VERDE']
          };
        }
      } else if (currentPuzzle.type === 'DECODER') {
        if (playerIndex % 2 === 0) {
          myAsymmetricData = {
            viewType: 'BINARY_SIGNAL',
            signal: currentPuzzle.binaryClue || '01000001 (A)',
            instruction: 'Tienes la señal binaria cruda. Dicta los ceros y unos o busca letras en la tabla de tu compañero.'
          };
        } else {
          myAsymmetricData = {
            viewType: 'ASCII_TABLE',
            table: currentPuzzle.guideTable || 'TABLA ASCII: [01000001 = A]',
            instruction: 'Tienes la tabla de decodificación ASCII. Pide a tu compañero los códigos binarios para traducirlos.'
          };
        }
      } else if (currentPuzzle.type === 'MASTER_PHRASE' && currentPuzzle.playerWords?.[keyGroup]) {
        const wordObj = currentPuzzle.playerWords[keyGroup][playerIndex] || currentPuzzle.playerWords[keyGroup][0];
        if (wordObj) {
          myAsymmetricData = {
            roleText: `Clave Asignada al Agente ${playerIndex + 1}`,
            word: wordObj.word,
            hint: wordObj.hint
          };
        }
      }
    }

    let currentTotalPressure = 0;
    const valvesArray: any[] = [];
    room.valvesState.forEach((val: number, pId: string) => {
      currentTotalPressure += val;
      const pl = room.players.find((p: any) => p.id === pId);
      valvesArray.push({ playerId: pId, playerName: pl ? pl.name : 'Agente', pressure: val });
    });

    return {
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      scenario: {
        id: room.scenario.id,
        name: room.scenario.name,
        category: room.scenario.category,
        themeColor: room.scenario.themeColor,
        icon: room.scenario.icon
      },
      players: room.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot || false,
        isHost: (p.id === room.hostId)
      })),
      currentLevelIndex: room.currentLevelIndex,
      currentLevel,
      currentPuzzleIndex: room.currentPuzzleIndex,
      currentPuzzle,
      myAsymmetricData,
      timeRemaining: room.timeRemaining,
      hintsRemaining: room.hintsRemaining,
      teamScore: room.teamScore,
      valves: valvesArray,
      totalPressure: currentTotalPressure,
      chatMessages: room.chatMessages,
      completedPuzzles: room.completedPuzzles,
      completedLevels: room.completedLevels,
      unlockedClues: room.unlockedClues || [],
      sharedCableSequence: room.sharedCableSequence || []
    };
  }
}
