const escapeManager = require('../services/escapeManager');
const botEscapeService = require('../services/botEscapeService');

function setupEscapeSockets(io) {
  const roomTimers = new Map();

  function broadcastRoomState(room) {
    if (!room) return;
    room.players.forEach(player => {
      if (!player.isBot) {
        const sanitized = escapeManager.getSanitizedRoomState(room, player.id);
        io.to(player.id).emit('room_state_update', sanitized);
      }
    });
  }

  function startGlobalTimer(roomCode) {
    if (roomTimers.has(roomCode)) {
      clearInterval(roomTimers.get(roomCode));
    }

    const timerId = setInterval(() => {
      const room = escapeManager.getRoom(roomCode);
      if (!room || room.status !== 'PLAYING') {
        clearInterval(timerId);
        roomTimers.delete(roomCode);
        return;
      }

      room.timeRemaining--;

      if (room.timeRemaining <= 0) {
        clearInterval(timerId);
        roomTimers.delete(roomCode);
        room.status = 'GAME_OVER';

        room.chatMessages.push({
          id: Date.now().toString(),
          senderId: 'SYSTEM',
          senderName: 'TIEMPO AGOTADO',
          avatar: '💥',
          text: '¡El reactor o la seguridad central colapsó! La misión ha fracasado.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });

        broadcastRoomState(room);
        io.to(roomCode).emit('mission_failed', { reason: 'Se agotó el tiempo límite de 15 minutos.' });
      } else {
        io.to(roomCode).emit('timer_tick', { timeRemaining: room.timeRemaining });
      }
    }, 1000);

    roomTimers.set(roomCode, timerId);
  }

  io.on('connection', (socket) => {
    console.log(`[EscapeRoom Socket] Conectado: ${socket.id}`);

    // Obtener catálogo de escenarios
    socket.on('get_scenarios', () => {
      socket.emit('scenarios_list', escapeManager.getScenariosCatalog());
    });

    // 1. Crear Sala
    socket.on('create_room', (data) => {
      const hostPlayer = {
        id: socket.id,
        name: data.playerName || 'Agente_Alfa',
        avatar: data.avatar || '👨‍🚀',
        isBot: false,
        isConnected: true
      };

      const room = escapeManager.createRoom(hostPlayer, data.scenarioId || null);
      socket.join(room.code);

      console.log(`[EscapeRoom Sala Creada] Código: ${room.code} (${room.scenario.name}) por ${hostPlayer.name}`);
      broadcastRoomState(room);
    });

    // Cambiar Escenario en Lobby
    socket.on('change_scenario', (data) => {
      const room = escapeManager.changeScenario(data.roomCode, data.scenarioId);
      if (room) {
        broadcastRoomState(room);
      }
    });

    // 2. Unirse a Sala
    socket.on('join_room', (data) => {
      const player = {
        id: socket.id,
        name: data.playerName || 'Agente_Beta',
        avatar: data.avatar || '👩‍🚀',
        isBot: false,
        isConnected: true
      };

      const result = escapeManager.joinRoom(data.roomCode, player);
      if (result.error) {
        socket.emit('escape_error', { message: result.error });
        return;
      }

      if (result.needsApproval) {
        // Enviar solicitud de reincorporación a la sala / anfitrión
        socket.emit('rejoin_pending_approval', {
          roomCode: result.room.code,
          message: 'Solicitud de reincorporación enviada al equipo. Esperando autorización (-10s)...'
        });

        io.to(result.room.code).emit('rejoin_request_received', {
          targetSocketId: socket.id,
          playerName: player.name,
          avatar: player.avatar,
          roomCode: result.room.code,
          isExistingPlayer: result.isExistingPlayer
        });
        return;
      }

      socket.join(result.room.code);
      console.log(`[EscapeRoom Jugador Unido] ${player.name} a sala ${result.room.code}`);
      broadcastRoomState(result.room);
    });

    // 2.1 Responder a Solicitud de Reincorporación
    socket.on('respond_rejoin_request', (data) => {
      // data: { roomCode, targetSocketId, playerName, avatar, approved: boolean }
      if (data.approved) {
        const room = escapeManager.approveRejoin(data.roomCode, data.targetSocketId, data.playerName, data.avatar);
        if (room) {
          const targetSocket = io.sockets.sockets.get(data.targetSocketId);
          if (targetSocket) {
            targetSocket.join(data.roomCode);
            targetSocket.emit('rejoin_approved', { roomCode: data.roomCode });
          }
          broadcastRoomState(room);
        }
      } else {
        const targetSocket = io.sockets.sockets.get(data.targetSocketId);
        if (targetSocket) {
          targetSocket.emit('rejoin_rejected', {
            message: 'El equipo no autorizó la reincorporación a la misión en curso.'
          });
        }
      }
    });

    // 3. Agregar Bot Cooperativo
    socket.on('add_bot', (data) => {
      const room = escapeManager.getRoom(data.roomCode);
      if (!room || room.status !== 'LOBBY') return;
      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit('escape_error', { message: 'La sala está completa' });
        return;
      }

      const bot = botEscapeService.createBot(room);
      room.players.push(bot);
      broadcastRoomState(room);
    });

    // 4. Remover Bot
    socket.on('remove_bot', (data) => {
      const room = escapeManager.getRoom(data.roomCode);
      if (!room || room.status !== 'LOBBY') return;

      room.players = room.players.filter(p => p.id !== data.botId);
      broadcastRoomState(room);
    });

    // 5. Iniciar Misión
    socket.on('start_mission', (data) => {
      const result = escapeManager.startMission(data.roomCode);
      if (result.error) {
        socket.emit('escape_error', { message: result.error });
        return;
      }

      broadcastRoomState(result.room);
      startGlobalTimer(result.room.code);

      // Si hay bots, enviar ayuda inicial
      const hasBots = result.room.players.some(p => p.isBot);
      if (hasBots) {
        setTimeout(() => {
          const currentLevel = result.room.levelsData[result.room.currentLevelIndex];
          const currentPuzzle = currentLevel.puzzles[result.room.currentPuzzleIndex];
          const botHelp = botEscapeService.generateBotChatHelp(result.room, currentPuzzle);
          if (botHelp) {
            const botMsg = {
              id: Date.now().toString(),
              senderId: 'BOT',
              senderName: 'BOT COOPERATIVO',
              avatar: '🤖',
              text: botHelp,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: false
            };
            result.room.chatMessages.push(botMsg);
            io.to(result.room.code).emit('new_chat_message', botMsg);
          }
        }, 3000);
      }
    });

    // 6. Enviar Respuesta de Puzzle
    socket.on('submit_puzzle_answer', (data) => {
      const result = escapeManager.submitPuzzleAnswer(data.roomCode, socket.id, data.puzzleId, data.answer);
      if (result.error && !result.isCorrect) {
        socket.emit('escape_error', { message: result.error });
      }

      if (result.room) {
        broadcastRoomState(result.room);
      }
    });

    // 6.1 Sincronización en tiempo real de fusibles de cables
    socket.on('push_cable_color', (data) => {
      const room = escapeManager.pushCableColor(data.roomCode, data.color);
      if (room) {
        broadcastRoomState(room);
      }
    });

    socket.on('remove_cable_color', (data) => {
      const room = escapeManager.removeCableColor(data.roomCode, data.index);
      if (room) {
        broadcastRoomState(room);
      }
    });

    socket.on('reset_cable_colors', (data) => {
      const room = escapeManager.resetCableColors(data.roomCode);
      if (room) {
        broadcastRoomState(room);
      }
    });

    // 7. Actualizar Válvula de Presión
    socket.on('update_valve_pressure', (data) => {
      const result = escapeManager.updateValve(data.roomCode, socket.id, data.pressure);
      if (result) {
        broadcastRoomState(result.room);
        io.to(data.roomCode).emit('valves_pressure_updated', { totalPressure: result.totalPressure });

        // Si la suma exacta alcanza 100 PSI, validar automáticamente el puzzle
        if (result.totalPressure === 100) {
          const currentLevel = result.room.levelsData[result.room.currentLevelIndex];
          const currentPuzzle = currentLevel.puzzles[result.room.currentPuzzleIndex];
          if (currentPuzzle && currentPuzzle.type === 'PRESSURE_VALVES') {
            escapeManager.submitPuzzleAnswer(data.roomCode, socket.id, currentPuzzle.id, 100);
            broadcastRoomState(result.room);
          }
        }
      }
    });

    // 8. Solicitar Pista
    socket.on('request_hint', (data) => {
      const result = escapeManager.useHint(data.roomCode);
      if (result) {
        broadcastRoomState(result.room);
      }
    });

    // 9. Enviar Mensaje de Chat
    socket.on('send_chat_message', (data) => {
      const room = escapeManager.getRoom(data.roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      const newMsg = {
        id: Date.now().toString(),
        senderId: socket.id,
        senderName: player ? player.name : 'Agente',
        avatar: player ? player.avatar : '👨‍🚀',
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: false
      };

      room.chatMessages.push(newMsg);
      io.to(data.roomCode).emit('new_chat_message', newMsg);
    });

    // 10. Reiniciar Misión
    socket.on('restart_mission', (data) => {
      const room = escapeManager.restartMission(data.roomCode);
      if (room) {
        broadcastRoomState(room);
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`[EscapeRoom Socket] Desconectado: ${socket.id}`);
      escapeManager.rooms.forEach((room, code) => {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.isConnected = false;
          broadcastRoomState(room);
        }
      });
    });
  });
}

module.exports = setupEscapeSockets;
