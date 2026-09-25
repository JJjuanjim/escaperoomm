import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EscapeService } from './escape.service';
import { BotEscapeService } from './bot-escape.service';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class EscapeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private roomTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly escapeService: EscapeService,
    private readonly botService: BotEscapeService
  ) {}

  handleConnection(client: Socket) {
    console.log(`[NestJS EscapeRoom Gateway] Conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[NestJS EscapeRoom Gateway] Desconectado: ${client.id}`);
    const allRooms = this.escapeService.getAllRooms();
    allRooms.forEach((room: any) => {
      const player = room.players.find((p: any) => p.id === client.id);
      if (player) {
        player.isConnected = false;
        this.broadcastRoomState(room);
      }
    });
  }

  private broadcastRoomState(room: any) {
    if (!room) return;
    room.players.forEach((player: any) => {
      if (!player.isBot) {
        const sanitized = this.escapeService.getSanitizedRoomState(room, player.id);
        this.server.to(player.id).emit('room_state_update', sanitized);
      }
    });
  }

  private startGlobalTimer(roomCode: string) {
    if (this.roomTimers.has(roomCode)) {
      clearInterval(this.roomTimers.get(roomCode));
    }

    const timerId = setInterval(() => {
      const room = this.escapeService.getRoom(roomCode);
      if (!room || room.status !== 'PLAYING') {
        clearInterval(timerId);
        this.roomTimers.delete(roomCode);
        return;
      }

      room.timeRemaining--;

      if (room.timeRemaining <= 0) {
        clearInterval(timerId);
        this.roomTimers.delete(roomCode);
        room.status = 'GAME_OVER';
        this.escapeService.persistMissionEnd(room);

        room.chatMessages.push({
          id: Date.now().toString(),
          senderId: 'SYSTEM',
          senderName: 'TIEMPO AGOTADO',
          avatar: '💥',
          text: '¡El reactor o la seguridad central colapsó! La misión ha fracasado.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });

        this.broadcastRoomState(room);
        this.server.to(roomCode).emit('mission_failed', { reason: 'Se agotó el tiempo límite de 15 minutos.' });
      } else {
        this.server.to(roomCode).emit('timer_tick', { timeRemaining: room.timeRemaining });
      }
    }, 1000);

    this.roomTimers.set(roomCode, timerId);
  }

  @SubscribeMessage('get_scenarios')
  handleGetScenarios(@ConnectedSocket() client: Socket) {
    client.emit('scenarios_list', this.escapeService.getScenariosCatalog());
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const hostPlayer = {
      id: client.id,
      name: data?.playerName || 'Agente_Alfa',
      avatar: data?.avatar || '👨‍🚀',
      isBot: false,
      isConnected: true
    };

    const room = this.escapeService.createRoom(hostPlayer, data?.scenarioId || null);
    client.join(room.code);

    console.log(`[NestJS EscapeRoom] Sala Creada: ${room.code} (${room.scenario.name}) por ${hostPlayer.name}`);
    this.broadcastRoomState(room);
  }

  @SubscribeMessage('change_scenario')
  handleChangeScenario(@MessageBody() data: any) {
    const room = this.escapeService.changeScenario(data.roomCode, data.scenarioId);
    if (room) {
      this.broadcastRoomState(room);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const player = {
      id: client.id,
      name: data?.playerName || 'Agente_Beta',
      avatar: data?.avatar || '👩‍🚀',
      isBot: false,
      isConnected: true
    };

    const result = this.escapeService.joinRoom(data.roomCode, player);
    if (result.error) {
      client.emit('escape_error', { message: result.error });
      return;
    }

    if (result.needsApproval) {
      client.emit('rejoin_pending_approval', {
        roomCode: result.room.code,
        message: 'Solicitud de reincorporación enviada al equipo. Esperando autorización (-10s)...'
      });

      this.server.to(result.room.code).emit('rejoin_request_received', {
        targetSocketId: client.id,
        playerName: player.name,
        avatar: player.avatar,
        roomCode: result.room.code,
        isExistingPlayer: result.isExistingPlayer
      });
      return;
    }

    client.join(result.room.code);
    console.log(`[NestJS EscapeRoom] Jugador Unido: ${player.name} a sala ${result.room.code}`);
    this.broadcastRoomState(result.room);
  }

  @SubscribeMessage('respond_rejoin_request')
  handleRespondRejoin(@MessageBody() data: any) {
    if (data.approved) {
      const room = this.escapeService.approveRejoin(data.roomCode, data.targetSocketId, data.playerName, data.avatar);
      if (room) {
        const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
        if (targetSocket) {
          targetSocket.join(data.roomCode);
          targetSocket.emit('rejoin_approved', { roomCode: data.roomCode });
        }
        this.broadcastRoomState(room);
      }
    } else {
      const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
      if (targetSocket) {
        targetSocket.emit('rejoin_rejected', {
          message: 'El equipo no autorizó la reincorporación a la misión en curso.'
        });
      }
    }
  }

  @SubscribeMessage('add_bot')
  handleAddBot(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const room = this.escapeService.getRoom(data.roomCode);
    if (!room || room.status !== 'LOBBY') return;
    if (room.players.length >= room.settings.maxPlayers) {
      client.emit('escape_error', { message: 'La sala está completa' });
      return;
    }

    const bot = this.botService.createBot(room);
    room.players.push(bot);
    this.broadcastRoomState(room);
  }

  @SubscribeMessage('remove_bot')
  handleRemoveBot(@MessageBody() data: any) {
    const room = this.escapeService.getRoom(data.roomCode);
    if (!room || room.status !== 'LOBBY') return;

    room.players = room.players.filter((p: any) => p.id !== data.botId);
    this.broadcastRoomState(room);
  }

  @SubscribeMessage('start_mission')
  handleStartMission(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const result = this.escapeService.startMission(data.roomCode);
    if (result.error) {
      client.emit('escape_error', { message: result.error });
      return;
    }

    this.broadcastRoomState(result.room);
    this.startGlobalTimer(result.room.code);

    const hasBots = result.room.players.some((p: any) => p.isBot);
    if (hasBots) {
      setTimeout(() => {
        const currentLevel = result.room.levelsData[result.room.currentLevelIndex];
        const currentPuzzle = currentLevel.puzzles[result.room.currentPuzzleIndex];
        const botHelp = this.botService.generateBotChatHelp(result.room, currentPuzzle);
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
          this.server.to(result.room.code).emit('new_chat_message', botMsg);
        }
      }, 3000);
    }
  }

  @SubscribeMessage('submit_puzzle_answer')
  handleSubmitAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const result = this.escapeService.submitPuzzleAnswer(data.roomCode, client.id, data.puzzleId, data.answer);
    if (result.error && !result.isCorrect) {
      client.emit('escape_error', { message: result.error });
    }

    if (result.room) {
      this.broadcastRoomState(result.room);
    }
  }

  @SubscribeMessage('push_cable_color')
  handlePushCable(@MessageBody() data: any) {
    const room = this.escapeService.pushCableColor(data.roomCode, data.color);
    if (room) {
      this.broadcastRoomState(room);
    }
  }

  @SubscribeMessage('remove_cable_color')
  handleRemoveCable(@MessageBody() data: any) {
    const room = this.escapeService.removeCableColor(data.roomCode, data.index);
    if (room) {
      this.broadcastRoomState(room);
    }
  }

  @SubscribeMessage('reset_cable_colors')
  handleResetCables(@MessageBody() data: any) {
    const room = this.escapeService.resetCableColors(data.roomCode);
    if (room) {
      this.broadcastRoomState(room);
    }
  }

  @SubscribeMessage('update_valve_pressure')
  handleUpdateValve(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const result = this.escapeService.updateValve(data.roomCode, client.id, data.pressure);
    if (result) {
      this.broadcastRoomState(result.room);
      this.server.to(data.roomCode).emit('valves_pressure_updated', { totalPressure: result.totalPressure });

      if (result.totalPressure === 100) {
        const currentLevel = result.room.levelsData[result.room.currentLevelIndex];
        const currentPuzzle = currentLevel.puzzles[result.room.currentPuzzleIndex];
        if (currentPuzzle && currentPuzzle.type === 'PRESSURE_VALVES') {
          this.escapeService.submitPuzzleAnswer(data.roomCode, client.id, currentPuzzle.id, 100);
          this.broadcastRoomState(result.room);
        }
      }
    }
  }

  @SubscribeMessage('request_hint')
  handleRequestHint(@MessageBody() data: any) {
    const result = this.escapeService.useHint(data.roomCode);
    if (result) {
      this.broadcastRoomState(result);
    }
  }

  @SubscribeMessage('send_chat_message')
  handleSendChat(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const room = this.escapeService.getRoom(data.roomCode);
    if (!room) return;

    const player = room.players.find((p: any) => p.id === client.id);
    const newMsg = {
      id: Date.now().toString(),
      senderId: client.id,
      senderName: player ? player.name : 'Agente',
      avatar: player ? player.avatar : '👨‍🚀',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };

    room.chatMessages.push(newMsg);
    this.server.to(data.roomCode).emit('new_chat_message', newMsg);
  }

  @SubscribeMessage('restart_mission')
  handleRestartMission(@MessageBody() data: any) {
    const room = this.escapeService.restartMission(data.roomCode);
    if (room) {
      this.broadcastRoomState(room);
    }
  }
}
