import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SocketService } from './services/socket.service';
import { AudioService } from './services/audio.service';
import { EscapeRoomState, Player, ScenarioInfo, RejoinRequest } from './models/escape.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  // Perfil del Agente
  playerName: string = 'Agente_Alfa';
  selectedAvatar: string = '👨‍🚀';
  avatars: string[] = ['👨‍🚀', '👩‍🚀', '🤖', '🕵️', '🧙‍♂️', '⚡', '🐱‍💻', '🚀', '🦊', '👾'];
  roomCodeInput: string = '';

  // Escenarios Temáticos
  availableScenarios: ScenarioInfo[] = [];
  selectedScenarioId: string = '';

  // Reincorporación / Rejoin
  pendingRejoinRequest: RejoinRequest | null = null;
  isWaitingRejoinApproval: boolean = false;
  waitingRejoinMessage: string = '';

  // Estado del Juego
  roomState: EscapeRoomState | null = null;
  mySocketId: string = '';
  isHost: boolean = false;
  localHostUrl: string = 'http://localhost:4200';

  // Interacción de Puzzles
  keypadInput: string = '';
  decoderInput: string = '';
  masterPhraseInput: string = '';
  myValvePressure: number = 0;
  selectedCableSequence: string[] = [];
  simonUserInput: number[] = [];

  // Chat y Notificaciones
  chatInput: string = '';
  errorMessage: string | null = null;
  copiedCodeSuccess: boolean = false;
  isSoundEnabled: boolean = true;
  showRecordsModal: boolean = false;
  leaderboardRecords: any[] = [];

  private subs = new Subscription();
  private lastLevel: number = -1;

  constructor(
    private socketService: SocketService,
    private audioService: AudioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.localHostUrl = window.location.origin;
    }
    this.isSoundEnabled = this.audioService.isSoundEnabled();

    // 1. Suscripción al estado de la sala
    this.subs.add(
      this.socketService.roomState$.subscribe(state => {
        if (!state) {
          this.roomState = null;
          this.cdr.markForCheck();
          return;
        }

        const prevLevel = this.lastLevel;
        this.roomState = state;
        this.mySocketId = this.socketService.getSocketId();
        this.isHost = (state.hostId === this.mySocketId);
        this.isWaitingRejoinApproval = false;

        // Sonidos de transición
        if (state.currentLevelIndex !== prevLevel && prevLevel !== -1 && state.status === 'PLAYING') {
          this.audioService.playDoorUnlock();
          this.resetPuzzleInputs();
        }
        this.lastLevel = state.currentLevelIndex;

        if (state.status === 'GAME_WON') {
          this.audioService.playVictoryFanfare();
        } else if (state.status === 'GAME_OVER') {
          this.audioService.playErrorBuzz();
        }

        this.cdr.markForCheck();
      })
    );

    // 2. Suscripción al catálogo de escenarios
    this.subs.add(
      this.socketService.scenariosList$.subscribe(list => {
        this.availableScenarios = list;
        if (list.length > 0 && !this.selectedScenarioId) {
          this.selectedScenarioId = list[0].id;
        }
        this.cdr.markForCheck();
      })
    );

    // 3. Suscripción a solicitudes de reincorporación
    this.subs.add(
      this.socketService.rejoinRequest$.subscribe(req => {
        this.pendingRejoinRequest = req;
        this.audioService.playErrorBuzz();
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.socketService.rejoinPending$.subscribe(msg => {
        this.isWaitingRejoinApproval = true;
        this.waitingRejoinMessage = msg;
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.socketService.rejoinApproved$.subscribe(() => {
        this.isWaitingRejoinApproval = false;
        this.audioService.playDoorUnlock();
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.socketService.rejoinRejected$.subscribe(msg => {
        this.isWaitingRejoinApproval = false;
        this.showError(msg);
        this.audioService.playErrorBuzz();
        this.cdr.markForCheck();
      })
    );

    // 4. Suscripción a errores
    this.subs.add(
      this.socketService.error$.subscribe(msg => {
        this.showError(msg);
        this.audioService.playErrorBuzz();
        this.cdr.markForCheck();
      })
    );

    // 5. Suscripción a mensajes de chat
    this.subs.add(
      this.socketService.newChatMessage$.subscribe(msg => {
        if (this.roomState && !this.roomState.chatMessages.some(m => m.id === msg.id)) {
          this.roomState.chatMessages.push(msg);
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // --- Respuestas de Reincorporación ---
  approveRejoin(): void {
    if (!this.pendingRejoinRequest || !this.roomState) return;
    this.socketService.respondRejoinRequest(
      this.roomState.code,
      this.pendingRejoinRequest.targetSocketId,
      this.pendingRejoinRequest.playerName,
      this.pendingRejoinRequest.avatar,
      true
    );
    this.pendingRejoinRequest = null;
    this.cdr.markForCheck();
  }

  rejectRejoin(): void {
    if (!this.pendingRejoinRequest || !this.roomState) return;
    this.socketService.respondRejoinRequest(
      this.roomState.code,
      this.pendingRejoinRequest.targetSocketId,
      this.pendingRejoinRequest.playerName,
      this.pendingRejoinRequest.avatar,
      false
    );
    this.pendingRejoinRequest = null;
    this.cdr.markForCheck();
  }

  // --- Creación y Unión a Salas ---
  createRoom(): void {
    if (!this.playerName.trim()) {
      this.showError('Por favor ingresa tu nombre de agente');
      return;
    }
    this.socketService.createRoom(
      this.playerName.trim(),
      this.selectedAvatar,
      this.selectedScenarioId || undefined
    );
  }

  selectScenario(scenarioId: string): void {
    this.selectedScenarioId = scenarioId;
    if (this.roomState && this.isHost && this.roomState.status === 'LOBBY') {
      this.socketService.changeScenario(this.roomState.code, scenarioId);
    }
  }

  joinRoom(): void {
    if (!this.playerName.trim()) {
      this.showError('Por favor ingresa tu nombre de agente');
      return;
    }
    if (!this.roomCodeInput.trim()) {
      this.showError('Por favor ingresa el código de 4 dígitos de la sala');
      return;
    }
    this.socketService.joinRoom(
      this.roomCodeInput.trim().toUpperCase(),
      this.playerName.trim(),
      this.selectedAvatar
    );
  }

  addBot(): void {
    if (!this.roomState) return;
    this.socketService.addBot(this.roomState.code);
  }

  removeBot(botId: string): void {
    if (!this.roomState) return;
    this.socketService.removeBot(this.roomState.code, botId);
  }

  startMission(): void {
    if (!this.roomState) return;
    this.socketService.startMission(this.roomState.code);
  }

  restartMission(): void {
    if (!this.roomState) return;
    this.resetPuzzleInputs();
    this.socketService.restartMission(this.roomState.code);
  }

  // --- Interacciones con Puzzles ---
  submitRiddleOption(opt: string): void {
    if (!this.roomState || !this.roomState.currentPuzzle) return;
    this.audioService.playKeypadBeep();
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      opt
    );
  }

  pressKeypadDigit(digit: string): void {
    if (this.keypadInput.length < 4) {
      this.audioService.playKeypadBeep();
      this.keypadInput += digit;
    }
  }

  clearKeypad(): void {
    this.audioService.playKeypadBeep();
    this.keypadInput = '';
  }

  submitKeypad(): void {
    if (!this.roomState || !this.roomState.currentPuzzle) return;
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      this.keypadInput
    );
  }

  // Cable Sequence (Sincronizado en tiempo real con todo el equipo)
  pressCable(color: string): void {
    if (!this.roomState) return;
    const currentList = this.roomState.sharedCableSequence || [];
    if (currentList.length < 4) {
      this.audioService.playKeypadBeep();
      this.socketService.pushCableColor(this.roomState.code, color);
    }
  }

  removeCableAt(index: number): void {
    if (!this.roomState) return;
    this.audioService.playKeypadBeep();
    this.socketService.removeCableColor(this.roomState.code, index);
  }

  submitCableSequence(): void {
    if (!this.roomState || !this.roomState.currentPuzzle) return;
    const currentList = this.roomState.sharedCableSequence || [];
    if (currentList.length !== 4) {
      this.showError('Deben completar los 4 fusibles en equipo antes de transmitir');
      return;
    }
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      currentList
    );
  }

  resetCables(): void {
    if (!this.roomState) return;
    this.audioService.playKeypadBeep();
    this.socketService.resetCableColors(this.roomState.code);
  }

  // Decoder
  submitDecoder(): void {
    if (!this.roomState || !this.roomState.currentPuzzle || !this.decoderInput.trim()) return;
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      this.decoderInput.trim().toUpperCase()
    );
  }

  // Válvulas
  onValveSliderChange(): void {
    if (!this.roomState) return;
    this.socketService.updateValvePressure(this.roomState.code, this.myValvePressure);
  }

  // Simon Memory
  pressSimonQuadrant(index: number): void {
    this.audioService.playKeypadBeep();
    this.simonUserInput.push(index);

    if (this.simonUserInput.length === 4) {
      if (this.roomState && this.roomState.currentPuzzle) {
        this.socketService.submitPuzzleAnswer(
          this.roomState.code,
          this.roomState.currentPuzzle.id,
          this.simonUserInput
        );
        setTimeout(() => this.simonUserInput = [], 1000);
      }
    }
  }

  // Master Phrase
  submitMasterPhrase(): void {
    if (!this.roomState || !this.roomState.currentPuzzle || !this.masterPhraseInput.trim()) return;
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      this.masterPhraseInput.trim().toUpperCase()
    );
  }

  // Pistas y Chat
  requestHint(): void {
    if (!this.roomState || this.roomState.hintsRemaining <= 0) return;
    this.socketService.requestHint(this.roomState.code);
  }

  sendChat(): void {
    if (!this.chatInput.trim() || !this.roomState) return;
    this.socketService.sendChat(this.roomState.code, this.chatInput.trim());
    this.chatInput = '';
  }

  // Utilidades
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  copyRoomLink(): void {
    if (!this.roomState) return;
    const url = `${this.localHostUrl}/?room=${this.roomState.code}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedCodeSuccess = true;
      setTimeout(() => this.copiedCodeSuccess = false, 2500);
    });
  }

  toggleSound(): void {
    this.isSoundEnabled = this.audioService.toggleSound();
  }

  async openRecordsModal(): Promise<void> {
    this.leaderboardRecords = await this.socketService.fetchLeaderboard();
    this.showRecordsModal = true;
    this.cdr.markForCheck();
  }

  closeRecordsModal(): void {
    this.showRecordsModal = false;
    this.cdr.markForCheck();
  }

  private resetPuzzleInputs(): void {
    this.keypadInput = '';
    this.decoderInput = '';
    this.masterPhraseInput = '';
    this.selectedCableSequence = [];
    this.simonUserInput = [];
    this.myValvePressure = 0;
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => this.errorMessage = null, 4000);
  }
}
