import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { EscapeRoomState, ChatMessage, ScenarioInfo, RejoinRequest } from '../models/escape.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;

  private getServerUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname || 'localhost';
      return `http://${hostname}:3002`;
    }
    return 'http://localhost:3002';
  }

  private roomStateSubject = new BehaviorSubject<EscapeRoomState | null>(null);
  public roomState$ = this.roomStateSubject.asObservable();

  private errorSubject = new Subject<string>();
  public error$ = this.errorSubject.asObservable();

  private timerTickSubject = new Subject<number>();
  public timerTick$ = this.timerTickSubject.asObservable();

  private newChatMessageSubject = new Subject<ChatMessage>();
  public newChatMessage$ = this.newChatMessageSubject.asObservable();

  private scenariosListSubject = new BehaviorSubject<ScenarioInfo[]>([]);
  public scenariosList$ = this.scenariosListSubject.asObservable();

  private rejoinRequestSubject = new Subject<RejoinRequest>();
  public rejoinRequest$ = this.rejoinRequestSubject.asObservable();

  private rejoinPendingSubject = new Subject<string>();
  public rejoinPending$ = this.rejoinPendingSubject.asObservable();

  private rejoinApprovedSubject = new Subject<{ roomCode: string }>();
  public rejoinApproved$ = this.rejoinApprovedSubject.asObservable();

  private rejoinRejectedSubject = new Subject<string>();
  public rejoinRejected$ = this.rejoinRejectedSubject.asObservable();

  constructor() {
    this.initSocket();
  }

  private initSocket(): void {
    if (typeof window === 'undefined') return;

    const url = this.getServerUrl();
    console.log('🔗 Conectando a Escape Room Socket.io en:', url);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('⚡ Conectado al servidor de Escape Room:', this.socket?.id);
      this.getScenarios();
    });

    this.socket.on('room_state_update', (state: EscapeRoomState) => {
      this.roomStateSubject.next(state);
    });

    this.socket.on('scenarios_list', (list: ScenarioInfo[]) => {
      this.scenariosListSubject.next(list);
    });

    this.socket.on('timer_tick', (data: { timeRemaining: number }) => {
      this.timerTickSubject.next(data.timeRemaining);
      const current = this.roomStateSubject.getValue();
      if (current) {
        current.timeRemaining = data.timeRemaining;
        this.roomStateSubject.next(current);
      }
    });

    this.socket.on('rejoin_request_received', (req: RejoinRequest) => {
      this.rejoinRequestSubject.next(req);
    });

    this.socket.on('rejoin_pending_approval', (data: { message: string }) => {
      this.rejoinPendingSubject.next(data.message);
    });

    this.socket.on('rejoin_approved', (data: { roomCode: string }) => {
      this.rejoinApprovedSubject.next(data);
    });

    this.socket.on('rejoin_rejected', (data: { message: string }) => {
      this.rejoinRejectedSubject.next(data.message);
    });

    this.socket.on('new_chat_message', (msg: ChatMessage) => {
      this.newChatMessageSubject.next(msg);
    });

    this.socket.on('escape_error', (data: { message: string }) => {
      this.errorSubject.next(data.message);
    });
  }

  getSocketId(): string {
    return this.socket?.id || '';
  }

  // --- Emisión de Acciones ---
  getScenarios(): void {
    this.socket?.emit('get_scenarios');
  }

  createRoom(playerName: string, avatar: string, scenarioId?: string): void {
    this.socket?.emit('create_room', { playerName, avatar, scenarioId });
  }

  changeScenario(roomCode: string, scenarioId: string): void {
    this.socket?.emit('change_scenario', { roomCode, scenarioId });
  }

  joinRoom(roomCode: string, playerName: string, avatar: string): void {
    this.socket?.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName, avatar });
  }

  respondRejoinRequest(roomCode: string, targetSocketId: string, playerName: string, avatar: string, approved: boolean): void {
    this.socket?.emit('respond_rejoin_request', { roomCode, targetSocketId, playerName, avatar, approved });
  }

  addBot(roomCode: string): void {
    this.socket?.emit('add_bot', { roomCode });
  }

  removeBot(roomCode: string, botId: string): void {
    this.socket?.emit('remove_bot', { roomCode, botId });
  }

  startMission(roomCode: string): void {
    this.socket?.emit('start_mission', { roomCode });
  }

  submitPuzzleAnswer(roomCode: string, puzzleId: string, answer: any): void {
    this.socket?.emit('submit_puzzle_answer', { roomCode, puzzleId, answer });
  }

  pushCableColor(roomCode: string, color: string): void {
    this.socket?.emit('push_cable_color', { roomCode, color });
  }

  removeCableColor(roomCode: string, index: number): void {
    this.socket?.emit('remove_cable_color', { roomCode, index });
  }

  resetCableColors(roomCode: string): void {
    this.socket?.emit('reset_cable_colors', { roomCode });
  }

  updateValvePressure(roomCode: string, pressure: number): void {
    this.socket?.emit('update_valve_pressure', { roomCode, pressure });
  }

  requestHint(roomCode: string): void {
    this.socket?.emit('request_hint', { roomCode });
  }

  sendChat(roomCode: string, text: string): void {
    this.socket?.emit('send_chat_message', { roomCode, text });
  }

  restartMission(roomCode: string): void {
    this.socket?.emit('restart_mission', { roomCode });
  }

  async fetchLeaderboard(): Promise<any[]> {
    try {
      const res = await fetch(`${this.getServerUrl()}/api/missions/leaderboard`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async fetchHistory(): Promise<any[]> {
    try {
      const res = await fetch(`${this.getServerUrl()}/api/missions/history`);
      return await res.json();
    } catch {
      return [];
    }
  }
}
