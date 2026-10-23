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
      icon: s.icon,
      envImage: s.envImage,
      puzzleImage: s.puzzleImage,
      youtubeVideoId: s.youtubeVideoId,
      trackTitle: s.trackTitle
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
      players: [{ ...hostPlayer, score: 0, rank: 1 }],
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
      unlockedClues: [],
      missionStartedAt: null
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

  getActiveLobbies() {
    const lobbies: any[] = [];
    this.rooms.forEach((room) => {
      if (room.status === 'LOBBY' && room.players.length < room.settings.maxPlayers) {
        lobbies.push({
          code: room.code,
          hostName: room.players[0]?.name || 'Agente_Alfa',
          hostAvatar: room.players[0]?.avatar || '👨‍🚀',
          scenarioId: room.scenario.id,
          scenarioName: room.scenario.name,
          scenarioIcon: room.scenario.icon,
          currentPlayers: room.players.length,
          maxPlayers: room.settings.maxPlayers
        });
      }
    });
    return lobbies;
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
      room.players.push({
        ...player,
        score: 0,
        rank: room.players.length + 1,
        isConnected: true
      });
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

  addPlayerScore(room: any, playerId: string, points: number, reason?: string) {
    const player = room.players.find((p: any) => p.id === playerId);
    if (player) {
      player.score = (player.score || 0) + points;
      room.teamScore = (room.teamScore || 0) + points;
      if (reason) {
        room.chatMessages.push({
          id: Date.now().toString(),
          senderId: 'SYSTEM',
          senderName: 'RANKING PVP',
          avatar: '⭐',
          text: `🎯 ¡${player.name} sumó +${points} PTS (${reason})! Total: ${player.score} PTS.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    }
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
    room.missionStartedAt = Date.now();
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
    room.tilePuzzleState = null;
    room.jigsawPuzzleState = null;
    room.ticTacToeState = null;
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
      const userSeq = Array.isArray(answer) && answer.length > 0 ? answer : (room.playerCables?.get(playerId) || []);
      isCorrect = (JSON.stringify(userSeq) === JSON.stringify(currentPuzzle.targetSequence));
      if (isCorrect && !room.cableWinner) {
        room.cableWinner = playerId;
        this.addPlayerScore(room, playerId, 500, '¡Ganador del Orden de Cables!');
        room.chatMessages.push({
          id: Date.now().toString(),
          senderId: 'SYSTEM',
          senderName: 'CAMPEÓN CABLES',
          avatar: '⚡',
          text: `⚡ ¡${player ? player.name : 'Un agente'} CONECTÓ EL ORDEN DE CABLES PRIMERO Y GANA EL RETO! (+500 PTS)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    } else if (currentPuzzle.type === 'DECODER') {
      isCorrect = (String(answer).trim().toUpperCase() === currentPuzzle.targetSolution.toUpperCase());
    } else if (currentPuzzle.type === 'PRESSURE_VALVES') {
      isCorrect = (Number(answer) === currentPuzzle.targetTotal);
    } else if (currentPuzzle.type === 'SIMON_MEMORY') {
      isCorrect = JSON.stringify(answer) === JSON.stringify(currentPuzzle.targetSteps);
    } else if (currentPuzzle.type === 'TILE_PUZZLE' || currentPuzzle.type === 'JIGSAW_PLACEMENT' || currentPuzzle.type === 'TICTACTOE_VS' || currentPuzzle.type === 'RPS_DUEL') {
      isCorrect = (answer === 'SOLVED');
    } else if (currentPuzzle.type === 'MASTER_PHRASE') {
      const cleanAnswer = String(answer).trim().toUpperCase().replace(/\s+/g, '-');
      isCorrect = (cleanAnswer === currentPuzzle.targetSolution.toUpperCase());
    }

    if (isCorrect) {
      room.completedPuzzles.push(currentPuzzle.id);
      if (currentPuzzle.type !== 'TICTACTOE_VS' && currentPuzzle.type !== 'RPS_DUEL' && currentPuzzle.type !== 'JIGSAW_PLACEMENT' && currentPuzzle.type !== 'CABLE_SEQUENCE') {
        this.addPlayerScore(room, playerId, 200, currentPuzzle.title);
      } else {
        room.teamScore += 500;
      }

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
    const sortedPlayers = [...room.players].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    const playersNamesFormatted = sortedPlayers.map((p: any, idx: number) => {
      const badge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
      return `${badge} ${p.name}: ${p.score || 0} PTS`;
    }).join(' | ');

    const playersDetails = sortedPlayers.map((p: any, idx: number) => ({
      name: p.name,
      score: p.score || 0,
      rank: idx + 1
    }));

    await this.dbService.saveMission({
      roomCode: room.code,
      scenarioId: room.scenario.id,
      scenarioName: room.scenario.name,
      status: room.status,
      teamScore: room.teamScore,
      timeRemaining: room.timeRemaining,
      playersCount: room.players.length,
      playersNames: playersNamesFormatted,
      playersDetails
    });
  }

  // Secuencia de fusibles de cables individual y competitiva (El que arme el orden primero gana)
  pushCableColor(code: string, playerId: string, color: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;
    if (!room.playerCables) room.playerCables = new Map<string, string[]>();
    const seq = room.playerCables.get(playerId) || [];
    if (seq.length < 4) {
      seq.push(color);
      room.playerCables.set(playerId, seq);
    }
    return room;
  }

  removeCableColor(code: string, playerId: string, index: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING' || !room.playerCables) return null;
    const seq = room.playerCables.get(playerId) || [];
    seq.splice(index, 1);
    room.playerCables.set(playerId, seq);
    return room;
  }

  resetCableColors(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || !room.playerCables) return null;
    room.playerCables.set(playerId, []);
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
    room.tilePuzzleState = null;
    room.jigsawPuzzleState = null;
    room.ticTacToeState = null;
    room.chatMessages = [];

    return room;
  }

  // --- Rompecabezas Colaborativo por Turnos (TILE_PUZZLE) ---
  initializeTilePuzzle(room: any, currentPuzzle: any) {
    // Tablero resuelto inicial: 1..8 y 0 (vacío en pos 8)
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let emptyIndex = 8;

    // Mezclar realizando 14 movimientos válidos aleatorios (100% resoluble garantizado)
    let lastMoved = -1;
    for (let i = 0; i < 14; i++) {
      const neighbors = this.getTileNeighbors(emptyIndex).filter(n => n !== lastMoved);
      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        board[emptyIndex] = board[chosen];
        board[chosen] = 0;
        lastMoved = emptyIndex;
        emptyIndex = chosen;
      }
    }

    const firstPlayer = room.players.find((p: any) => !p.isBot) || room.players[0];
    const turnIndex = room.players.indexOf(firstPlayer) !== -1 ? room.players.indexOf(firstPlayer) : 0;

    room.tilePuzzleState = {
      puzzleId: currentPuzzle.id,
      board,
      emptyIndex,
      turnIndex,
      turnPlayerId: firstPlayer ? firstPlayer.id : '',
      turnPlayerName: firstPlayer ? firstPlayer.name : 'Agente',
      turnPlayerAvatar: firstPlayer ? firstPlayer.avatar : '👨‍🚀',
      movesCount: 0,
      thematicImage: currentPuzzle.thematicImage || 'reactor_core',
      isSolved: false,
    };
  }

  getTileNeighbors(index: number): number[] {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(index - 3); // Arriba
    if (row < 2) neighbors.push(index + 3); // Abajo
    if (col > 0) neighbors.push(index - 1); // Izquierda
    if (col < 2) neighbors.push(index + 1); // Derecha
    return neighbors;
  }

  moveTilePuzzle(code: string, playerId: string, tileIndex: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'La misión no está activa' };

    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type !== 'TILE_PUZZLE') {
      return { error: 'El enigma actual no es un rompecabezas' };
    }

    if (!room.tilePuzzleState || room.tilePuzzleState.puzzleId !== currentPuzzle.id) {
      this.initializeTilePuzzle(room, currentPuzzle);
    }

    const state = room.tilePuzzleState;
    if (state.turnPlayerId !== playerId) {
      return { error: `No es tu turno. Espera a que ${state.turnPlayerName} deslice su pieza.` };
    }

    const neighbors = this.getTileNeighbors(state.emptyIndex);
    if (!neighbors.includes(tileIndex)) {
      return { error: 'Solo puedes mover una pieza adyacente a la casilla vacía' };
    }

    // Intercambiar pieza con el espacio vacío
    state.board[state.emptyIndex] = state.board[tileIndex];
    state.board[tileIndex] = 0;
    state.emptyIndex = tileIndex;
    state.movesCount++;

    // Pasar el turno al siguiente agente en la sala
    state.turnIndex = (state.turnIndex + 1) % room.players.length;
    const nextPlayer = room.players[state.turnIndex];
    state.turnPlayerId = nextPlayer.id;
    state.turnPlayerName = nextPlayer.name;
    state.turnPlayerAvatar = nextPlayer.avatar;

    // Verificar si el tablero ha quedado ordenado [1, 2, 3, 4, 5, 6, 7, 8, 0]
    const isSolved = state.board.every((val: number, idx: number) => (idx === 8 ? val === 0 : val === idx + 1));
    if (isSolved) {
      state.isSolved = true;
      this.submitPuzzleAnswer(code, playerId, currentPuzzle.id, 'SOLVED');
    }

    return {
      room,
      nextPlayerIsBot: nextPlayer.isBot || false,
    };
  }

  makeBotTileMove(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.tilePuzzleState) return null;
    const state = room.tilePuzzleState;
    const botPlayer = room.players[state.turnIndex];
    if (!botPlayer || !botPlayer.isBot) return null;

    const neighbors = this.getTileNeighbors(state.emptyIndex);
    const chosenTile = neighbors[Math.floor(Math.random() * neighbors.length)];
    return this.moveTilePuzzle(code, botPlayer.id, chosenTile);
  }

  // --- Rompecabezas Individual de Velocidad (JIGSAW_PLACEMENT - Carrera en Paralelo) ---
  initializeJigsawPlacement(room: any, currentPuzzle: any) {
    if (!room.playerJigsaws) {
      room.playerJigsaws = new Map<string, any>();
    }
    room.jigsawPuzzleState = { puzzleId: currentPuzzle.id };
    room.jigsawWinner = null;
    room.players.forEach((player: any) => {
      const allPieces = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
      const boardSlots: (number | null)[] = [null, null, null, null, null, null, null, null, null];
      room.playerJigsaws.set(player.id, {
        boardSlots,
        availablePieces: allPieces,
        correctCount: 0,
        movesCount: 0,
        isSolved: false
      });
    });
  }

  placeJigsawPiece(code: string, playerId: string, pieceId: number, slotIndex: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'La misión no está activa' };

    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type !== 'JIGSAW_PLACEMENT') {
      return { error: 'El enigma actual no es un rompecabezas de colocación' };
    }

    if (!room.playerJigsaws) {
      this.initializeJigsawPlacement(room, currentPuzzle);
    }

    if (!room.playerJigsaws.has(playerId)) {
      room.playerJigsaws.set(playerId, {
        boardSlots: [null, null, null, null, null, null, null, null, null],
        availablePieces: [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5),
        correctCount: 0,
        movesCount: 0,
        isSolved: false
      });
    }

    const playerJigsaw = room.playerJigsaws.get(playerId);
    if (!playerJigsaw) return { error: 'Tablero no inicializado' };

    const slot = Number(slotIndex);
    const piece = Number(pieceId);

    if (slot < 0 || slot > 8) {
      return { error: 'Posición de casilla inválida' };
    }

    if (playerJigsaw.boardSlots[slot] !== null) {
      return { error: 'Esta casilla ya tiene una pieza colocada' };
    }

    if (!playerJigsaw.availablePieces.includes(piece)) {
      return { error: 'Esta pieza ya fue colocada o no está disponible' };
    }

    // Colocar la pieza en el tablero personal del agente
    playerJigsaw.boardSlots[slot] = piece;
    playerJigsaw.availablePieces = playerJigsaw.availablePieces.filter((p: number) => p !== piece);
    playerJigsaw.movesCount++;

    // Recalcular cuántas piezas correctas tiene este jugador
    playerJigsaw.correctCount = playerJigsaw.boardSlots.filter((p: number | null, idx: number) => p === idx).length;

    // Otorgar puntos competitivos individuales
    if (piece === slot) {
      this.addPlayerScore(room, playerId, 100, `Pieza #${piece + 1} correcta`);
    } else {
      this.addPlayerScore(room, playerId, 30, `Colocación táctica`);
    }

    // Verificar si armó todo el rompecabezas correctamente (9 de 9)
    const allPlaced = playerJigsaw.boardSlots.every((p: number | null) => p !== null);
    const allCorrect = allPlaced && (playerJigsaw.correctCount === 9);

    if (allCorrect && !room.jigsawWinner) {
      room.jigsawWinner = playerId;
      playerJigsaw.isSolved = true;
      const player = room.players.find((p: any) => p.id === playerId);
      const playerName = player ? player.name : 'Un agente';

      // Bonificación de +600 PTS al que lo arme primero
      this.addPlayerScore(room, playerId, 600, '¡Ganador de la Carrera de Rompecabezas!');

      room.chatMessages.push({
        id: Date.now().toString(),
        senderId: 'SYSTEM',
        senderName: 'CAMPEÓN ROMPECABEZAS',
        avatar: '🏆',
        text: `🏁 ¡${playerName} ARMÓ EL ROMPECABEZAS PRIMERO Y GANA LA RONDA! (+600 PTS)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });

      this.submitPuzzleAnswer(code, playerId, currentPuzzle.id, 'SOLVED');
    }

    return {
      room,
      isCorrectPlacement: (piece === slot),
      correctCount: playerJigsaw.correctCount,
      allCorrect
    };
  }

  makeBotJigsawMove(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.playerJigsaws) return null;
    const botPlayer = room.players.find((p: any) => p.isBot);
    if (!botPlayer) return null;
    const botJigsaw = room.playerJigsaws.get(botPlayer.id);
    if (!botJigsaw || botJigsaw.availablePieces.length === 0 || botJigsaw.isSolved) return null;

    const piece = botJigsaw.availablePieces[0];
    let slot = piece;
    if (botJigsaw.boardSlots[slot] !== null) {
      slot = botJigsaw.boardSlots.findIndex((s: any) => s === null);
    }
    if (slot !== -1) {
      return this.placeJigsawPiece(code, botPlayer.id, piece, slot);
    }
    return null;
  }

  removeJigsawPiece(code: string, playerId: string, slotIndex: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'La misión no está activa' };
    const playerJigsaw = room.playerJigsaws?.get(playerId);
    const slot = Number(slotIndex);
    if (!playerJigsaw || playerJigsaw.boardSlots[slot] === null) {
      return { error: 'No hay pieza en esta casilla' };
    }
    const removedPiece = playerJigsaw.boardSlots[slot];
    playerJigsaw.boardSlots[slot] = null;
    if (!playerJigsaw.availablePieces.includes(removedPiece)) {
      playerJigsaw.availablePieces.push(removedPiece);
    }
    playerJigsaw.correctCount = playerJigsaw.boardSlots.filter((p: number | null, idx: number) => p === idx).length;
    return { room };
  }

  resetJigsawPuzzle(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return null;
    const playerJigsaw = room.playerJigsaws?.get(playerId);
    if (playerJigsaw) {
      playerJigsaw.boardSlots = [null, null, null, null, null, null, null, null, null];
      playerJigsaw.availablePieces = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
      playerJigsaw.correctCount = 0;
      playerJigsaw.movesCount = 0;
      playerJigsaw.isSolved = false;
    }
    return room;
  }

  // --- Duelo Cibernético: Tres en Raya (TICTACTOE_VS) ---
  initializeTicTacToe(room: any, currentPuzzle: any) {
    const playerX = room.players[0] || { id: 'p1', name: 'Agente Alfa', avatar: '👨‍🚀' };
    const playerO = room.players.length > 1 ? room.players[1] : { id: 'BOT_RIVAL', name: 'IA Centinela', avatar: '🤖', isBot: true };

    room.ticTacToeState = {
      puzzleId: currentPuzzle.id,
      board: [null, null, null, null, null, null, null, null, null],
      playerX: { id: playerX.id, name: playerX.name, avatar: playerX.avatar },
      playerO: { id: playerO.id, name: playerO.name, avatar: playerO.avatar, isBot: playerO.isBot || false },
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      isCompleted: false,
    };
  }

  makeTicTacToeMove(code: string, playerId: string, cellIndex: number) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'Misión no activa' };

    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type !== 'TICTACTOE_VS') {
      return { error: 'El enigma actual no es un Tres en Raya' };
    }

    if (!room.ticTacToeState || room.ticTacToeState.puzzleId !== currentPuzzle.id) {
      this.initializeTicTacToe(room, currentPuzzle);
    }

    const state = room.ticTacToeState;
    if (state.isCompleted) {
      return { error: 'El duelo de Tres en Raya ya ha finalizado' };
    }

    const isTurnX = (state.currentTurn === 'X' && state.playerX.id === playerId);
    const isTurnO = (state.currentTurn === 'O' && state.playerO.id === playerId);

    if (!isTurnX && !isTurnO) {
      const activePlayer = state.currentTurn === 'X' ? state.playerX.name : state.playerO.name;
      return { error: `No es tu turno en el duelo. Turno de ${activePlayer}` };
    }

    if (cellIndex < 0 || cellIndex > 8 || state.board[cellIndex] !== null) {
      return { error: 'Casilla no disponible' };
    }

    // Marcar casilla
    state.board[cellIndex] = state.currentTurn;

    // Comprobar 8 líneas de victoria
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
      [0, 4, 8], [2, 4, 6]             // Diagonales
    ];

    let won = false;
    for (const [a, b, c] of lines) {
      if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
        state.winner = state.currentTurn;
        state.winningLine = [a, b, c];
        state.isCompleted = true;
        won = true;
        break;
      }
    }

    if (!won) {
      const isBoardFull = state.board.every((c: any) => c !== null);
      if (isBoardFull) {
        state.winner = 'DRAW';
        state.isCompleted = true;
        this.addPlayerScore(room, state.playerX.id, 150, 'Empate en Tres en Raya');
        this.addPlayerScore(room, state.playerO.id, 150, 'Empate en Tres en Raya');
        this.submitPuzzleAnswer(code, playerId, currentPuzzle.id, 'SOLVED');
      } else {
        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
      }
    } else {
      const winnerId = state.winner === 'X' ? state.playerX.id : state.playerO.id;
      const winnerName = state.winner === 'X' ? state.playerX.name : state.playerO.name;
      const loserName = state.winner === 'X' ? state.playerO.name : state.playerX.name;
      this.addPlayerScore(room, winnerId, 400, 'Victoria en Duelo Tres en Raya');
      room.chatMessages.push({
        id: Date.now().toString(),
        senderId: 'SYSTEM',
        senderName: 'DUELO GANADO',
        avatar: '🏆',
        text: `¡${winnerName} ha derrotado a ${loserName} en el Duelo Tres en Raya! Cortafuegos anulado (+500 XP).`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });
      this.submitPuzzleAnswer(code, playerId, currentPuzzle.id, 'SOLVED');
    }

    const nextIsBot = (!state.isCompleted && state.currentTurn === 'O' && state.playerO.isBot);

    return {
      room,
      nextIsBot,
    };
  }

  makeBotTicTacToeMove(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.ticTacToeState) return null;
    const state = room.ticTacToeState;
    if (state.isCompleted || state.currentTurn !== 'O' || !state.playerO.isBot) return null;

    const emptyIndices = state.board
      .map((val: any, idx: number) => (val === null ? idx : null))
      .filter((v: any) => v !== null) as number[];

    if (emptyIndices.length > 0) {
      const preferred = emptyIndices.includes(4) ? 4 : emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      return this.makeTicTacToeMove(code, state.playerO.id, preferred);
    }
    return null;
  }

  resetTicTacToe(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.ticTacToeState) return null;
    const currentPuzzle = room.levelsData[room.currentLevelIndex]?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type === 'TICTACTOE_VS') {
      this.initializeTicTacToe(room, currentPuzzle);
    }
    return room;
  }

  // --- Duelo Táctico: Piedra, Papel o Tijera (RPS_DUEL) ---
  initializeRpsDuel(room: any, currentPuzzle: any) {
    const player1 = room.players[0] || { id: 'p1', name: 'Agente Alfa', avatar: '👨‍🚀' };
    const player2 = room.players.length > 1
      ? room.players[1]
      : { id: 'BOT_RIVAL', name: 'IA Centinela', avatar: '🤖', isBot: true };

    room.rpsState = {
      puzzleId: currentPuzzle.id,
      player1: { id: player1.id, name: player1.name, avatar: player1.avatar, isBot: !!player1.isBot },
      player2: { id: player2.id, name: player2.name, avatar: player2.avatar, isBot: !!player2.isBot },
      currentRound: 1,
      targetWins: 2, // Al mejor de 3 (primer jugador en ganar 2 rondas)
      player1Score: 0,
      player2Score: 0,
      player1Choice: null, // 'ROCK' | 'PAPER' | 'SCISSORS' | null
      player2Choice: null,
      roundResult: null, // 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null
      roundMessage: null,
      isRoundRevealed: false,
      winner: null,
      isCompleted: false,
    };
  }

  makeRpsChoice(code: string, playerId: string, choice: 'ROCK' | 'PAPER' | 'SCISSORS') {
    const room = this.getRoom(code);
    if (!room || room.status !== 'PLAYING') return { error: 'La misión no está activa' };

    const currentLevel = room.levelsData[room.currentLevelIndex];
    const currentPuzzle = currentLevel?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type !== 'RPS_DUEL') {
      return { error: 'El enigma actual no es Piedra, Papel o Tijera' };
    }

    if (!room.rpsState || room.rpsState.puzzleId !== currentPuzzle.id) {
      this.initializeRpsDuel(room, currentPuzzle);
    }

    const state = room.rpsState;
    if (state.isCompleted) {
      return { error: 'El duelo ya ha concluido' };
    }

    if (state.isRoundRevealed) {
      return { error: 'Esperando el inicio de la siguiente ronda...' };
    }

    // Registrar elección
    if (playerId === state.player1.id) {
      state.player1Choice = choice;
    } else if (playerId === state.player2.id) {
      state.player2Choice = choice;
    } else {
      if (state.player2.isBot) {
        state.player1Choice = choice;
      } else {
        return { error: 'Solo los duelistas asignados pueden seleccionar' };
      }
    }

    // Si el oponente es un bot, elegir automáticamente
    if (state.player2.isBot && state.player1Choice && !state.player2Choice) {
      const options: ('ROCK' | 'PAPER' | 'SCISSORS')[] = ['ROCK', 'PAPER', 'SCISSORS'];
      state.player2Choice = options[Math.floor(Math.random() * options.length)];
    }

    // Si ambos ya eligieron, resolver la ronda
    if (state.player1Choice && state.player2Choice) {
      state.isRoundRevealed = true;
      const c1 = state.player1Choice;
      const c2 = state.player2Choice;

      const choiceIcons: any = { ROCK: '🪨 Piedra', PAPER: '📄 Papel', SCISSORS: '✂️ Tijera' };

      if (c1 === c2) {
        state.roundResult = 'DRAW';
        state.roundMessage = `¡Empate! Ambos eligieron ${choiceIcons[c1]}.`;
      } else if (
        (c1 === 'ROCK' && c2 === 'SCISSORS') ||
        (c1 === 'SCISSORS' && c2 === 'PAPER') ||
        (c1 === 'PAPER' && c2 === 'ROCK')
      ) {
        state.roundResult = 'PLAYER1_WIN';
        state.player1Score++;
        this.addPlayerScore(room, state.player1.id, 150, `Ronda con ${choiceIcons[c1]}`);
        state.roundMessage = `¡Ronda para ${state.player1.name}! ${choiceIcons[c1]} vence a ${choiceIcons[c2]}.`;
      } else {
        state.roundResult = 'PLAYER2_WIN';
        state.player2Score++;
        this.addPlayerScore(room, state.player2.id, 150, `Ronda con ${choiceIcons[c2]}`);
        state.roundMessage = `¡Ronda para ${state.player2.name}! ${choiceIcons[c2]} vence a ${choiceIcons[c1]}.`;
      }

      // Verificar si alguien alcanzó targetWins
      if (state.player1Score >= state.targetWins || state.player2Score >= state.targetWins) {
        state.isCompleted = true;
        const winnerObj = state.player1Score >= state.targetWins ? state.player1 : state.player2;
        state.winner = winnerObj.name;
        this.addPlayerScore(room, winnerObj.id, 500, 'Campeón del Duelo Final');

        room.chatMessages.push({
          id: Date.now().toString(),
          senderId: 'SYSTEM',
          senderName: 'DUELO GANADO',
          avatar: '🏆',
          text: `¡${winnerObj.name} ha ganado el Duelo de Piedra, Papel o Tijera (${state.player1Score} - ${state.player2Score})! Salida final desbloqueada (+600 XP).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });

        this.submitPuzzleAnswer(code, playerId, currentPuzzle.id, 'SOLVED');
      }

      return {
        room,
        resolved: true,
        shouldAdvance: !state.isCompleted
      };
    }

    return {
      room,
      resolved: false
    };
  }

  nextRpsRound(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.rpsState) return null;
    const state = room.rpsState;
    if (state.isCompleted) return room;

    state.currentRound++;
    state.player1Choice = null;
    state.player2Choice = null;
    state.roundResult = null;
    state.roundMessage = null;
    state.isRoundRevealed = false;
    return room;
  }

  resetRpsDuel(code: string) {
    const room = this.getRoom(code);
    if (!room || !room.rpsState) return null;
    const currentPuzzle = room.levelsData[room.currentLevelIndex]?.puzzles[room.currentPuzzleIndex];
    if (currentPuzzle?.type === 'RPS_DUEL') {
      this.initializeRpsDuel(room, currentPuzzle);
    }
    return room;
  }

  getSanitizedRpsState(state: any, playerId: string) {
    if (!state) return null;
    const isP1 = (state.player1.id === playerId);
    const isP2 = (state.player2.id === playerId);
    return {
      puzzleId: state.puzzleId,
      player1: state.player1,
      player2: state.player2,
      currentRound: state.currentRound,
      targetWins: state.targetWins,
      player1Score: state.player1Score,
      player2Score: state.player2Score,
      player1Choice: (state.isRoundRevealed || isP1) ? state.player1Choice : null,
      player2Choice: (state.isRoundRevealed || isP2) ? state.player2Choice : null,
      player1Locked: !!state.player1Choice,
      player2Locked: !!state.player2Choice,
      roundResult: state.roundResult,
      roundMessage: state.roundMessage,
      isRoundRevealed: state.isRoundRevealed,
      winner: state.winner,
      isCompleted: state.isCompleted
    };
  }

  // Sanitizar estado para un jugador específico (Asimetría)
  getSanitizedRoomState(room: any, playerId: string) {
    if (!room) return null;

    const currentLevel = room.levelsData ? room.levelsData[room.currentLevelIndex] : null;
    const currentPuzzle = currentLevel ? currentLevel.puzzles[room.currentPuzzleIndex] : null;

    let myAsymmetricData: any = null;

    if (currentPuzzle && room.status === 'PLAYING') {
      if (currentPuzzle.type === 'TILE_PUZZLE' && (!room.tilePuzzleState || room.tilePuzzleState.puzzleId !== currentPuzzle.id)) {
        this.initializeTilePuzzle(room, currentPuzzle);
      }
      if (currentPuzzle.type === 'JIGSAW_PLACEMENT' && (!room.jigsawPuzzleState || room.jigsawPuzzleState.puzzleId !== currentPuzzle.id)) {
        this.initializeJigsawPlacement(room, currentPuzzle);
      }
      if (currentPuzzle.type === 'TICTACTOE_VS' && (!room.ticTacToeState || room.ticTacToeState.puzzleId !== currentPuzzle.id)) {
        this.initializeTicTacToe(room, currentPuzzle);
      }
      if (currentPuzzle.type === 'RPS_DUEL' && (!room.rpsState || room.rpsState.puzzleId !== currentPuzzle.id)) {
        this.initializeRpsDuel(room, currentPuzzle);
      }

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
        myAsymmetricData = {
          hasManual: true,
          manualText: currentPuzzle.guideText || 'Conecta los 4 fusibles en el orden estricto de la guía táctica.',
          availableButtons: ['AZUL', 'AMARILLO', 'ROJO', 'VERDE']
        };
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

    // Calcular Ranking Competitivo en Tiempo Real
    const sortedLeaderboard = [...room.players]
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot || false,
        isHost: (p.id === room.hostId),
        score: p.score || 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    const mvpPlayer = sortedLeaderboard.length > 0 ? sortedLeaderboard[0] : null;

    return {
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      scenario: {
        id: room.scenario.id,
        name: room.scenario.name,
        category: room.scenario.category,
        themeColor: room.scenario.themeColor,
        icon: room.scenario.icon,
        envImage: room.scenario.envImage,
        puzzleImage: room.scenario.puzzleImage,
        youtubeVideoId: room.scenario.youtubeVideoId,
        trackTitle: room.scenario.trackTitle
      },
      players: room.players.map((p: any) => {
        const ranked = sortedLeaderboard.find((sp: any) => sp.id === p.id);
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isBot: p.isBot || false,
          isHost: (p.id === room.hostId),
          score: p.score || 0,
          rank: ranked ? ranked.rank : 1
        };
      }),
      leaderboard: sortedLeaderboard,
      mvpPlayer: mvpPlayer,
      currentLevelIndex: room.currentLevelIndex,
      currentLevel,
      currentPuzzleIndex: room.currentPuzzleIndex,
      currentPuzzle,
      myAsymmetricData,
      timeRemaining: room.timeRemaining,
      missionStartedAt: room.missionStartedAt || null,
      musicElapsedSeconds: room.missionStartedAt ? Math.max(0, Math.floor((Date.now() - room.missionStartedAt) / 1000)) : 0,
      hintsRemaining: room.hintsRemaining,
      teamScore: room.teamScore,
      valves: valvesArray,
      totalPressure: currentTotalPressure,
      chatMessages: room.chatMessages,
      completedPuzzles: room.completedPuzzles,
      completedLevels: room.completedLevels,
      unlockedClues: room.unlockedClues || [],
      sharedCableSequence: room.playerCables?.get(playerId) || [],
      rivalsCableProgress: (() => {
        if (currentPuzzle?.type !== 'CABLE_SEQUENCE') return [];
        const rList: any[] = [];
        room.players.forEach((p: any) => {
          if (p.id !== playerId) {
            const pSeq = room.playerCables?.get(p.id) || [];
            rList.push({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              cablesConnected: pSeq.length
            });
          }
        });
        return rList;
      })(),
      tilePuzzleState: room.tilePuzzleState || null,
      jigsawPuzzleState: (() => {
        if (currentPuzzle?.type !== 'JIGSAW_PLACEMENT') return null;
        if (!room.playerJigsaws || !room.jigsawPuzzleState || room.jigsawPuzzleState.puzzleId !== currentPuzzle.id) {
          this.initializeJigsawPlacement(room, currentPuzzle);
        }
        let myJigsaw = room.playerJigsaws?.get(playerId);
        if (!myJigsaw) {
          myJigsaw = {
            boardSlots: [null, null, null, null, null, null, null, null, null],
            availablePieces: [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5),
            correctCount: 0,
            movesCount: 0,
            isSolved: false
          };
          room.playerJigsaws?.set(playerId, myJigsaw);
        }

        const rivalsProgress: any[] = [];
        room.players.forEach((p: any) => {
          if (p.id !== playerId) {
            const rJ = room.playerJigsaws?.get(p.id);
            rivalsProgress.push({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              correctCount: rJ ? rJ.correctCount : 0,
              placedCount: rJ ? (9 - rJ.availablePieces.length) : 0,
              isSolved: rJ ? rJ.isSolved : false
            });
          }
        });

        return {
          puzzleId: currentPuzzle.id,
          puzzleImage: currentPuzzle.puzzleImage || '/assets/scenarios/reactor_puzzle.png',
          envImage: currentPuzzle.envImage || '/assets/scenarios/reactor_env.png',
          thematicTheme: currentPuzzle.thematicTheme || 'reactor',
          boardSlots: myJigsaw.boardSlots,
          availablePieces: myJigsaw.availablePieces,
          correctCount: myJigsaw.correctCount,
          isSolved: myJigsaw.isSolved,
          winnerPlayerId: room.jigsawWinner || null,
          rivalsProgress
        };
      })(),
      ticTacToeState: room.ticTacToeState || null,
      rpsState: this.getSanitizedRpsState(room.rpsState, playerId)
    };
  }
}
