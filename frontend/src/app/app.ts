import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SocketService } from './services/socket.service';
import { AudioService } from './services/audio.service';
import { EscapeRoomState, Player, ScenarioInfo, RejoinRequest, AgentProfile, ActiveLobby } from './models/escape.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  // Navegación principal de pantallas
  currentView: 'LANDING' | 'LOBBY' = 'LANDING';

  // Perfil del Agente y Autenticación con Correo (Gmail)
  agentProfile: AgentProfile | null = null;
  showLoginModal: boolean = false;
  authTab: 'LOGIN' | 'REGISTER' | 'VERIFY' = 'LOGIN';
  authEmail: string = '';
  authPassword: string = '';
  authCodename: string = '';
  authAvatar: string = '👨‍🚀';
  authRank: 'Recluta' | 'Especialista' | 'Táctico' | 'Comandante' = 'Especialista';
  authVerificationCode: string = '';
  authDevCode: string | null = null;
  isAuthLoading: boolean = false;
  authMessage: string | null = null;
  loginCodename: string = '';
  loginPin: string = '';
  loginRank: 'Recluta' | 'Especialista' | 'Táctico' | 'Comandante' = 'Especialista';
  loginAvatar: string = '👨‍🚀';
  loginIsNew: boolean = false;

  // Datos del Jugador en sala
  playerName: string = 'Agente_Alfa';
  selectedAvatar: string = '👨‍🚀';
  avatars: string[] = ['👨‍🚀', '👩‍🚀', '🤖', '🕵️', '🧙‍♂️', '⚡', '🐱‍💻', '🚀', '🦊', '👾'];
  roomCodeInput: string = '';

  // Escenarios Temáticos
  availableScenarios: ScenarioInfo[] = [];
  selectedScenarioId: string = 'scenario_reactor';
  activeLobbies: ActiveLobby[] = [];

  // Reincorporación / Rejoin
  pendingRejoinRequest: RejoinRequest | null = null;
  isWaitingRejoinApproval: boolean = false;
  waitingRejoinMessage: string = '';

  // Reconexión Automática Persistente (No salir en F5)
  isAutoReconnecting: boolean = false;
  reconnectStatusMessage: string = '';

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
  selectedJigsawPiece: number | null = null;
  selectedJigsawSlot: number | null = null;

  // Chat y Notificaciones
  chatInput: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  copiedCodeSuccess: boolean = false;
  isSoundEnabled: boolean = true;
  showRecordsModal: boolean = false;
  recordsModalTab: 'USERS' | 'MATCHES' = 'USERS';
  leaderboardRecords: any[] = [];
  userLeaderboardRecords: any[] = [];

  // Reproductor de Música de YouTube Oficial por Escenario
  currentYoutubeUrl: SafeResourceUrl | null = null;
  currentYoutubeTrackTitle: string = '';
  isMusicMuted: boolean = false;
  isMusicMinimized: boolean = false;

  // Mini-Retos de Entrada (Landing Page)
  challenge1Input: string = '';
  challenge1Solved: boolean = false;
  frequencySlider: number = 412;
  frequencyAligned: boolean = false;
  switchA: boolean = false;
  switchB: boolean = false;
  switchC: boolean = false;
  bypassUnlocked: boolean = false;
  challengesBonusXp: number = 0;

  private subs = new Subscription();
  private lastLevel: number = -1;
  private lastStatus: string = '';
  private currentAmbientScenario: string = '';

  constructor(
    private socketService: SocketService,
    private audioService: AudioService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.localHostUrl = window.location.origin;
    }
    this.isSoundEnabled = this.audioService.isSoundEnabled();

    // 1. Cargar perfil guardado del Agente (Login)
    this.loadSavedAgentProfile();

    // Comprobar si se ingresó mediante enlace de activación del correo (?verifyEmail=...&verifyCode=...)
    this.checkEmailActivationLink();

    // 2. Comprobar si hay una partida activa previa en localStorage (Persistencia F5)
    this.checkAutoReconnection();

    // 3. Suscripción al estado de la sala con sincronización en tiempo real inmediata (NgZone + detectChanges)
    this.subs.add(
      this.socketService.roomState$.subscribe(state => {
        this.ngZone.run(() => {
          if (!state) {
            this.roomState = null;
            this.cdr.detectChanges();
            return;
          }

          const prevLevel = this.lastLevel;
          this.roomState = state;
          this.mySocketId = this.socketService.getSocketId();
          this.isHost = (state.hostId === this.mySocketId);
          this.isWaitingRejoinApproval = false;
          this.isAutoReconnecting = false;

          // Guardar sesión activa en localStorage para persistencia de recarga F5
          if (state.status === 'LOBBY' || state.status === 'PLAYING') {
            this.saveActiveMatchSession(state.code, state.scenario?.id);
          } else if (state.status === 'GAME_WON' || state.status === 'GAME_OVER') {
            this.clearActiveMatchSession();
            this.audioService.stopAmbient();
            this.currentAmbientScenario = '';
          }

          // Ambientación y música oficial sincronizada en tiempo real por escenario
          if (state.status === 'PLAYING') {
            this.updateScenarioAmbient(state.scenario?.id);
            if (this.lastStatus !== 'PLAYING' || !this.currentYoutubeUrl) {
              const elapsed = state.musicElapsedSeconds || (state.missionStartedAt ? Math.max(0, Math.floor((Date.now() - state.missionStartedAt) / 1000)) : 0);
              this.applySynchronizedMusic(state.scenario?.youtubeVideoId, state.scenario?.trackTitle, elapsed);
            }
          } else if (state.status === 'LOBBY') {
            if (this.lastStatus !== 'LOBBY' || !this.currentYoutubeUrl) {
              this.updateYoutubeMusic(state.scenario?.id);
            }
          } else {
            this.audioService.stopAmbient();
            this.currentAmbientScenario = '';
          }
          this.lastStatus = state.status;

          // Sonidos de transición
          if (state.currentLevelIndex !== prevLevel && prevLevel !== -1 && state.status === 'PLAYING') {
            this.audioService.playDoorUnlock();
            this.resetPuzzleInputs();
          }
          this.lastLevel = state.currentLevelIndex;

          if (state.status === 'GAME_WON') {
            this.audioService.playVictoryFanfare();
            if (this.agentProfile) {
              this.agentProfile.missionsWon++;
              this.agentProfile.xpPoints += (this.getMyScore() || state.teamScore || 1000);
              this.saveAgentProfileToDisk();
            }
          } else if (state.status === 'GAME_OVER') {
            this.audioService.playErrorBuzz();
          }

          this.cdr.detectChanges();
        });
      })
    );

    // 4. Suscripción al catálogo de escenarios
    this.subs.add(
      this.socketService.scenariosList$.subscribe(list => {
        this.ngZone.run(() => {
          this.availableScenarios = list;
          if (list.length > 0 && !this.selectedScenarioId) {
            this.selectedScenarioId = list[0].id;
          }
          this.cdr.detectChanges();
        });
      })
    );

    // 5. Suscripción a solicitudes de reincorporación
    this.subs.add(
      this.socketService.rejoinRequest$.subscribe(req => {
        this.ngZone.run(() => {
          this.pendingRejoinRequest = req;
          this.audioService.playErrorBuzz();
          this.cdr.detectChanges();
        });
      })
    );

    this.subs.add(
      this.socketService.rejoinPending$.subscribe(msg => {
        this.ngZone.run(() => {
          this.isWaitingRejoinApproval = true;
          this.waitingRejoinMessage = msg;
          this.cdr.detectChanges();
        });
      })
    );

    this.subs.add(
      this.socketService.rejoinApproved$.subscribe(() => {
        this.ngZone.run(() => {
          this.isWaitingRejoinApproval = false;
          this.audioService.playDoorUnlock();
          this.cdr.detectChanges();
        });
      })
    );

    this.subs.add(
      this.socketService.rejoinRejected$.subscribe(msg => {
        this.ngZone.run(() => {
          this.isWaitingRejoinApproval = false;
          this.showError(msg);
          this.audioService.playErrorBuzz();
          this.clearActiveMatchSession();
          this.cdr.detectChanges();
        });
      })
    );

    // 6. Reconexión automática
    this.subs.add(
      this.socketService.reconnectSuccess$.subscribe(data => {
        this.ngZone.run(() => {
          this.isAutoReconnecting = false;
          this.showSuccess(`¡Reconectado con éxito a la misión ${data.roomCode}!`);
          this.audioService.playDoorUnlock();
          this.cdr.detectChanges();
        });
      })
    );

    this.subs.add(
      this.socketService.reconnectFailed$.subscribe(data => {
        this.ngZone.run(() => {
          this.isAutoReconnecting = false;
          this.clearActiveMatchSession();
          this.cdr.detectChanges();
        });
      })
    );

    // 7. Suscripción a errores
    this.subs.add(
      this.socketService.error$.subscribe(msg => {
        this.ngZone.run(() => {
          this.showError(msg);
          this.audioService.playErrorBuzz();
          this.cdr.detectChanges();
        });
      })
    );

    // 8. Suscripción a mensajes de chat
    this.subs.add(
      this.socketService.newChatMessage$.subscribe(msg => {
        this.ngZone.run(() => {
          if (this.roomState && !this.roomState.chatMessages.some(m => m.id === msg.id)) {
            this.roomState.chatMessages.push(msg);
          }
          this.cdr.detectChanges();
        });
      })
    );

    // 9. Suscripción a salas activas en espera (Lobbies disponibles)
    this.subs.add(
      this.socketService.activeLobbies$.subscribe(lobbies => {
        this.ngZone.run(() => {
          this.activeLobbies = lobbies || [];
          this.cdr.detectChanges();
        });
      })
    );

    // 10. Suscripción a sincronización de música oficial de misión (WebSocket en tiempo real)
    this.subs.add(
      this.socketService.syncMissionMusic$.subscribe(data => {
        this.ngZone.run(() => {
          this.applySynchronizedMusic(data.youtubeVideoId, data.trackTitle, data.startSeconds || 0);
          this.cdr.detectChanges();
        });
      })
    );

    // 11. Detección de invitación a sala por URL (?room=XXXX)
    this.checkRoomInviteUrl();

    // Precargar Leaderboard para la landing
    this.preloadLeaderboard();
  }

  ngOnDestroy(): void {
    this.audioService.stopAmbient();
    this.subs.unsubscribe();
  }

  // --- Navegación de Vistas ---
  navigateTo(view: 'LANDING' | 'LOBBY'): void {
    this.currentView = view;
    this.audioService.playKeypadBeep();
    if (view === 'LANDING') {
      this.preloadLeaderboard();
    }
    this.cdr.markForCheck();
  }

  selectScenarioAndPlay(scenarioId: string): void {
    this.selectedScenarioId = scenarioId;
    this.updateYoutubeMusic(scenarioId);
    this.navigateTo('LOBBY');
  }

  // --- Sistema de Autenticación / Login de Agente con Gmail ---
  openLoginModal(): void {
    this.showLoginModal = true;
    this.authTab = this.agentProfile?.email ? 'LOGIN' : 'REGISTER';
    this.authEmail = this.agentProfile?.email || '';
    this.authCodename = this.agentProfile?.codename || this.playerName;
    this.authAvatar = this.agentProfile?.avatar || this.selectedAvatar;
    this.authRank = (this.agentProfile?.rank as any) || 'Especialista';
    this.authPassword = '';
    this.authVerificationCode = '';
    this.authDevCode = null;
    this.authMessage = null;
    this.cdr.markForCheck();
  }

  closeLoginModal(): void {
    this.showLoginModal = false;
    this.cdr.markForCheck();
  }

  switchAuthTab(tab: 'LOGIN' | 'REGISTER' | 'VERIFY'): void {
    this.authTab = tab;
    this.authMessage = null;
    this.cdr.markForCheck();
  }

  async submitRegisterWithEmail(): Promise<void> {
    if (!this.authEmail.trim() || !this.authEmail.includes('@')) {
      this.showError('Ingresa un correo electrónico Gmail o institucional válido');
      return;
    }
    if (!this.authPassword || this.authPassword.length < 4) {
      this.showError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (!this.authCodename.trim()) {
      this.showError('Ingresa tu nombre en clave de Agente');
      return;
    }

    this.isAuthLoading = true;
    try {
      const res = await this.socketService.registerAgent({
        email: this.authEmail.trim().toLowerCase(),
        password: this.authPassword,
        codename: this.authCodename.trim(),
        avatar: this.authAvatar,
        rank: this.authRank,
      });

      this.isAuthLoading = false;
      if (res.success) {
        this.authDevCode = res.devCode || null;
        this.authMessage = res.message;
        this.authTab = 'VERIFY';
        this.audioService.playDoorUnlock();
        this.showSuccess('Código de verificación generado. Revisa tu correo o terminal.');
      } else {
        this.showError(res.message || 'Error al registrar cuenta');
      }
    } catch {
      this.isAuthLoading = false;
      this.showError('Error de conexión al registrar agente');
    }
    this.cdr.markForCheck();
  }

  async submitVerifyCode(): Promise<void> {
    if (!this.authVerificationCode.trim()) {
      this.showError('Ingresa el código de 6 dígitos enviado a tu correo');
      return;
    }

    this.isAuthLoading = true;
    try {
      const res = await this.socketService.verifyCode(this.authEmail.trim().toLowerCase(), this.authVerificationCode.trim());
      this.isAuthLoading = false;

      if (res.success && res.user) {
        const u = res.user;
        const profile: AgentProfile = {
          email: u.email,
          isVerified: true,
          codename: u.codename,
          avatar: u.avatar || '👨‍🚀',
          rank: u.rank || 'Especialista',
          pin: '****',
          missionsPlayed: u.missionsPlayed || 0,
          missionsWon: u.missionsWon || 0,
          xpPoints: (u.xpPoints || 100) + this.challengesBonusXp,
          badges: ['Cuenta Gmail Verificada', 'Agente Activo'],
          lastLogin: new Date().toISOString(),
        };

        this.agentProfile = profile;
        this.playerName = profile.codename;
        this.selectedAvatar = profile.avatar;
        this.saveAgentProfileToDisk();
        this.closeLoginModal();
        this.audioService.playSuccessChime();
        this.showSuccess(`¡Agente ${profile.codename} autenticado y verificado con éxito!`);
      } else {
        this.showError(res.message || 'Código incorrecto o expirado');
      }
    } catch {
      this.isAuthLoading = false;
      this.showError('Error al verificar el código');
    }
    this.cdr.markForCheck();
  }

  async submitLoginWithEmail(): Promise<void> {
    if (!this.authEmail.trim() || !this.authPassword) {
      this.showError('Ingresa tu correo y contraseña');
      return;
    }

    this.isAuthLoading = true;
    try {
      const res = await this.socketService.loginAgent(this.authEmail.trim().toLowerCase(), this.authPassword);
      this.isAuthLoading = false;

      if (res.needsVerification) {
        this.authDevCode = res.devCode || null;
        this.authMessage = res.message;
        this.authTab = 'VERIFY';
        this.showSuccess('Tu cuenta requiere verificación. Revisa el código de 6 dígitos.');
        this.cdr.markForCheck();
        return;
      }

      if (res.success && res.user) {
        const u = res.user;
        const profile: AgentProfile = {
          email: u.email,
          isVerified: true,
          codename: u.codename,
          avatar: u.avatar || '👨‍🚀',
          rank: u.rank || 'Especialista',
          pin: '****',
          missionsPlayed: u.missionsPlayed || 0,
          missionsWon: u.missionsWon || 0,
          xpPoints: (u.xpPoints || 100) + this.challengesBonusXp,
          badges: ['Cuenta Gmail Verificada', 'Agente Activo'],
          lastLogin: new Date().toISOString(),
        };

        this.agentProfile = profile;
        this.playerName = profile.codename;
        this.selectedAvatar = profile.avatar;
        this.saveAgentProfileToDisk();
        this.closeLoginModal();
        this.audioService.playSuccessChime();
        this.showSuccess(`¡Bienvenido de vuelta, ${profile.rank} ${profile.codename}!`);
      } else {
        this.showError(res.message || 'Credenciales incorrectas');
      }
    } catch {
      this.isAuthLoading = false;
      this.showError('Error al iniciar sesión');
    }
    this.cdr.markForCheck();
  }

  async resendVerificationCode(): Promise<void> {
    if (!this.authEmail.trim()) return;
    try {
      const res = await this.socketService.resendCode(this.authEmail.trim().toLowerCase());
      if (res.devCode) this.authDevCode = res.devCode;
      this.showSuccess('Nuevo código enviado a tu correo Gmail');
    } catch {
      this.showError('No se pudo reenviar el código');
    }
    this.cdr.markForCheck();
  }

  // Fallback para formulario rápido sin email si el usuario lo desea
  submitLogin(): void {
    this.submitLoginWithEmail();
  }

  // --- Rompecabezas Colaborativo por Turnos (TILE_PUZZLE) ---
  isMyTurnInTilePuzzle(): boolean {
    if (!this.roomState?.tilePuzzleState) return false;
    return this.mySocketId === this.roomState.tilePuzzleState.turnPlayerId;
  }

  isTileAdjacentToEmpty(tileIndex: number): boolean {
    if (!this.roomState?.tilePuzzleState) return false;
    const emptyIndex = this.roomState.tilePuzzleState.emptyIndex;
    const r1 = Math.floor(tileIndex / 3);
    const c1 = tileIndex % 3;
    const r2 = Math.floor(emptyIndex / 3);
    const c2 = emptyIndex % 3;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  onTileClick(tileIndex: number): void {
    if (!this.roomState || !this.roomState.tilePuzzleState) return;
    const state = this.roomState.tilePuzzleState;
    if (state.board[tileIndex] === 0) return; // Se hizo clic en la casilla vacía

    if (!this.isMyTurnInTilePuzzle()) {
      this.audioService.playErrorBuzz();
      this.showError(`⚠️ No es tu turno. Espera a que ${state.turnPlayerName} mueva su pieza.`);
      return;
    }

    if (!this.isTileAdjacentToEmpty(tileIndex)) {
      this.audioService.playErrorBuzz();
      this.showError('⚠️ Solo puedes deslizar una pieza adyacente a la casilla vacía.');
      return;
    }

    this.audioService.playKeypadBeep();
    this.socketService.moveTilePuzzle(this.roomState.code, tileIndex);
  }

  // --- Rompecabezas Individual de Velocidad (JIGSAW_PLACEMENT - Carrera en Paralelo) ---
  isMyTurnInJigsaw(): boolean {
    return true; // Cada jugador arma a toda velocidad en su propio tablero
  }

  selectJigsawPiece(pieceId: number): void {
    if (!this.roomState?.jigsawPuzzleState) return;
    const state = this.roomState.jigsawPuzzleState;

    // Si el usuario había hecho clic primero en una casilla vacía del tablero:
    if (this.selectedJigsawSlot !== null) {
      const slot = this.selectedJigsawSlot;
      this.selectedJigsawSlot = null;
      this.selectedJigsawPiece = null;
      this.audioService.playPiecePlaced();
      this.socketService.placeJigsawPiece(this.roomState.code, pieceId, slot);
      this.cdr.detectChanges();
      return;
    }

    // Si vuelve a hacer clic en la misma pieza ya seleccionada, colocarla en la primera casilla vacía
    if (this.selectedJigsawPiece === pieceId) {
      const firstEmptySlot = state.boardSlots.findIndex((s: any) => s === null);
      if (firstEmptySlot !== -1) {
        this.selectedJigsawPiece = null;
        this.audioService.playPiecePlaced();
        this.socketService.placeJigsawPiece(this.roomState.code, pieceId, firstEmptySlot);
        this.cdr.detectChanges();
        return;
      }
      this.selectedJigsawPiece = null;
    } else {
      this.selectedJigsawPiece = pieceId;
      this.audioService.playKeypadBeep();
    }
    this.cdr.detectChanges();
  }

  quickPlacePiece(pieceId: number): void {
    if (!this.roomState?.jigsawPuzzleState) return;
    const state = this.roomState.jigsawPuzzleState;
    // Si la casilla correcta está libre, colocarla ahí; si no, en la primera libre
    let targetSlot = pieceId;
    if (state.boardSlots[targetSlot] !== null) {
      targetSlot = state.boardSlots.findIndex((s: any) => s === null);
    }
    if (targetSlot !== -1) {
      this.selectedJigsawPiece = null;
      this.selectedJigsawSlot = null;
      this.audioService.playPiecePlaced();
      this.socketService.placeJigsawPiece(this.roomState.code, pieceId, targetSlot);
      this.cdr.detectChanges();
    }
  }

  onJigsawSlotClick(slotIndex: number): void {
    if (!this.roomState?.jigsawPuzzleState) return;
    const state = this.roomState.jigsawPuzzleState;

    // Si ya hay una pieza en este slot y se hace clic, retirarla a la bandeja
    if (state.boardSlots[slotIndex] !== null) {
      this.audioService.playKeypadBeep();
      this.socketService.removeJigsawPiece(this.roomState.code, slotIndex);
      this.selectedJigsawPiece = null;
      this.selectedJigsawSlot = null;
      return;
    }

    // Si hay una pieza seleccionada de la bandeja, colocarla en este slot
    if (this.selectedJigsawPiece !== null) {
      const piece = this.selectedJigsawPiece;
      this.selectedJigsawPiece = null;
      this.selectedJigsawSlot = null;
      this.audioService.playPiecePlaced();
      this.socketService.placeJigsawPiece(this.roomState.code, piece, slotIndex);
      return;
    }

    // Si no hay pieza seleccionada, seleccionar este slot como objetivo
    this.selectedJigsawSlot = (this.selectedJigsawSlot === slotIndex) ? null : slotIndex;
    this.audioService.playKeypadBeep();
    this.cdr.detectChanges();
  }

  resetJigsaw(): void {
    if (!this.roomState) return;
    this.selectedJigsawPiece = null;
    this.selectedJigsawSlot = null;
    this.socketService.resetJigsaw(this.roomState.code);
  }

  getJigsawPieceStyle(pieceId: number, imageUrl?: string): any {
    const row = Math.floor(pieceId / 3);
    const col = pieceId % 3;
    const url = imageUrl || this.roomState?.scenario?.puzzleImage || '/assets/scenarios/reactor_puzzle.png';
    return {
      'background-image': `url('${url}')`,
      'background-size': '300% 300%',
      'background-position': `${col * 50}% ${row * 50}%`,
      'background-repeat': 'no-repeat'
    };
  }

  // --- Duelo Cibernético: Tres en Raya (TICTACTOE_VS) ---
  isMyTurnInTicTacToe(): boolean {
    if (!this.roomState?.ticTacToeState) return false;
    const state = this.roomState.ticTacToeState;
    if (state.isCompleted) return false;
    const mySymbol = this.getMyTicTacToeSymbol();
    return mySymbol === state.currentTurn;
  }

  getMyTicTacToeSymbol(): 'X' | 'O' | null {
    if (!this.roomState?.ticTacToeState) return null;
    const state = this.roomState.ticTacToeState;
    if (state.playerX.id === this.mySocketId) return 'X';
    if (state.playerO.id === this.mySocketId) return 'O';
    return null;
  }

  onTicTacToeCellClick(cellIndex: number): void {
    if (!this.roomState?.ticTacToeState) return;
    const state = this.roomState.ticTacToeState;
    if (state.isCompleted) return;

    if (state.board[cellIndex] !== null) {
      this.audioService.playErrorBuzz();
      return;
    }

    const mySymbol = this.getMyTicTacToeSymbol();
    if (mySymbol && mySymbol !== state.currentTurn) {
      this.audioService.playErrorBuzz();
      const turnName = state.currentTurn === 'X' ? state.playerX.name : state.playerO.name;
      this.showError(`⚠️ Turno de ${turnName} (${state.currentTurn})`);
      return;
    }

    this.audioService.playTicTacToeMove(state.currentTurn === 'X');
    this.socketService.moveTicTacToe(this.roomState.code, cellIndex);
  }

  resetTicTacToe(): void {
    if (!this.roomState) return;
    this.socketService.resetTicTacToe(this.roomState.code);
  }

  // --- Duelo Táctico: Piedra, Papel o Tijera (RPS_DUEL) ---
  chooseRps(choice: 'ROCK' | 'PAPER' | 'SCISSORS'): void {
    if (!this.roomState || !this.roomState.rpsState) return;
    const rps = this.roomState.rpsState;
    if (rps.isCompleted || rps.isRoundRevealed) return;

    this.audioService.playRpsPick();
    this.socketService.makeRpsChoice(this.roomState.code, choice);
  }

  resetRps(): void {
    if (!this.roomState) return;
    this.socketService.resetRps(this.roomState.code);
  }

  isMyTurnInRps(): boolean {
    if (!this.roomState?.rpsState) return false;
    const rps = this.roomState.rpsState;
    if (rps.isCompleted || rps.isRoundRevealed) return false;

    if (this.mySocketId === rps.player1.id && !rps.player1Choice) return true;
    if (this.mySocketId === rps.player2.id && !rps.player2Choice) return true;
    if (rps.player2.isBot && !rps.player1Choice) return true;
    return false;
  }

  getMyRpsChoice(): 'ROCK' | 'PAPER' | 'SCISSORS' | null {
    if (!this.roomState?.rpsState) return null;
    const rps = this.roomState.rpsState;
    if (this.mySocketId === rps.player1.id) return rps.player1Choice;
    if (this.mySocketId === rps.player2.id) return rps.player2Choice;
    return null;
  }

  // --- Banda Sonora Oficial de YouTube por Escenario ---
  updateYoutubeMusic(scenarioId?: string): void {
    if (this.isMusicMuted) return;
    const scId = scenarioId || this.roomState?.scenario?.id || this.selectedScenarioId || 'scenario_reactor';
    if (this.currentAmbientScenario === scId && this.currentYoutubeUrl) return;
    this.applySynchronizedMusic(undefined, undefined, 0);
  }

  // Sincronización exacta de música de misión para todos los agentes en la partida
  applySynchronizedMusic(videoId?: string, trackTitle?: string, startSeconds: number = 0): void {
    if (this.isMusicMuted) return;

    let vId = videoId;
    let tTitle = trackTitle;
    const scId = this.roomState?.scenario?.id || this.selectedScenarioId || 'scenario_reactor';

    if (!vId) {
      if (scId.includes('temple')) {
        vId = '1y5GnZb9J1k';
        tTitle = 'Egyptian Tomb Mysteries (Templo Ancestral)';
      } else if (scId.includes('space')) {
        vId = 'efeDcP2ncAo';
        tTitle = 'Deep Space Ambient Odyssey (Estación Espacial)';
      } else {
        vId = 'HXEife8Oor8';
        tTitle = 'Dark Industrial Cyberpunk (Reactor Nuclear)';
      }
    }

    this.currentAmbientScenario = scId;
    this.currentYoutubeTrackTitle = tTitle || 'Banda Sonora Oficial';

    const cleanStart = Math.max(0, Math.floor(startSeconds));
    const embedUrl = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&loop=1&playlist=${vId}&enablejsapi=1&start=${cleanStart}`;
    this.currentYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    // Salto directo en caso de que el iframe ya esté en ejecución
    setTimeout(() => {
      try {
        const iframe = document.getElementById('youtubeMusicFrame') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [cleanStart, true]
          }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'playVideo'
          }), '*');
        }
      } catch (e) {
        console.warn('YouTube postMessage error:', e);
      }
    }, 150);

    this.cdr.detectChanges();
  }

  quickJoinLobby(code: string): void {
    if (!this.playerName.trim()) {
      this.playerName = 'Agente_' + Math.floor(100 + Math.random() * 900);
    }
    this.roomCodeInput = code.toUpperCase().trim();
    this.joinRoom();
  }

  private checkRoomInviteUrl(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        this.roomCodeInput = roomParam.trim().toUpperCase();
        this.showSuccess(`¡Invitación para la sala ${this.roomCodeInput} detectada! Haz clic en Unirse para entrar juntos a la partida.`);
      }
    } catch (e) {
      console.warn('Error al verificar URL room:', e);
    }
  }

  toggleMusicMute(): void {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.currentYoutubeUrl = null;
    } else {
      this.currentAmbientScenario = '';
      this.updateYoutubeMusic(this.roomState?.scenario?.id || this.selectedScenarioId);
    }
    this.cdr.markForCheck();
  }

  toggleMusicMinimize(): void {
    this.isMusicMinimized = !this.isMusicMinimized;
    this.cdr.markForCheck();
  }

  // --- Ingreso Rápido como Invitado / Agente Temporal ---
  quickGuestLogin(): void {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const codename = `Agente_${randomNum}`;
    const profile: AgentProfile = {
      codename,
      avatar: this.selectedAvatar || '👨‍🚀',
      rank: 'Especialista',
      pin: '0000',
      missionsPlayed: 0,
      missionsWon: 0,
      xpPoints: 100 + this.challengesBonusXp,
      badges: ['Acceso Rápido'],
      lastLogin: new Date().toISOString(),
      isVerified: true
    };
    this.agentProfile = profile;
    this.playerName = codename;
    this.saveAgentProfileToDisk();
    this.audioService.playSuccessChime();
    this.showSuccess(`¡Identidad temporal concedida! Bienvenido, ${codename}`);
    this.updateYoutubeMusic(this.selectedScenarioId);
    this.cdr.markForCheck();
  }

  logoutAgent(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('escaperoom_agent_profile');
    }
    this.agentProfile = null;
    this.playerName = 'Agente_Alfa';
    this.selectedAvatar = '👨‍🚀';
    this.showSuccess('Sesión cerrada correctamente');
    this.cdr.markForCheck();
  }

  private loadSavedAgentProfile(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('escaperoom_agent_profile');
      if (raw) {
        this.agentProfile = JSON.parse(raw);
        if (this.agentProfile) {
          this.playerName = this.agentProfile.codename;
          this.selectedAvatar = this.agentProfile.avatar;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar perfil de agente:', e);
    }
  }

  private checkEmailActivationLink(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('verifyEmail');
      const code = params.get('verifyCode');

      if (email && code) {
        this.showSuccess(`Verificando enlace de activación para ${email}...`);
        this.socketService.verifyCode(email.trim().toLowerCase(), code.trim()).then(res => {
          if (res.success && res.user) {
            const u = res.user;
            const profile: AgentProfile = {
              email: u.email,
              isVerified: true,
              codename: u.codename,
              avatar: u.avatar || '👨‍🚀',
              rank: u.rank || 'Especialista',
              pin: '****',
              missionsPlayed: u.missionsPlayed || 0,
              missionsWon: u.missionsWon || 0,
              xpPoints: (u.xpPoints || 100) + this.challengesBonusXp,
              badges: ['Cuenta Gmail Verificada', 'Activado por Enlace'],
              lastLogin: new Date().toISOString(),
            };

            this.agentProfile = profile;
            this.playerName = profile.codename;
            this.selectedAvatar = profile.avatar;
            this.saveAgentProfileToDisk();
            this.audioService.playSuccessChime();
            this.showSuccess(`¡Sesión iniciada con éxito para ${profile.codename} desde el enlace de tu correo!`);

            // Limpiar los parámetros de la URL sin recargar la página
            window.history.replaceState({}, document.title, window.location.pathname);
            this.cdr.markForCheck();
          } else {
            this.showError(res.message || 'El enlace de activación ha expirado o es inválido');
          }
        }).catch(() => {
          this.showError('No se pudo verificar el enlace con el servidor');
        });
      }
    } catch (e) {
      console.warn('Error al leer enlace de activación:', e);
    }
  }

  private saveAgentProfileToDisk(): void {
    if (typeof window === 'undefined' || !this.agentProfile) return;
    localStorage.setItem('escaperoom_agent_profile', JSON.stringify(this.agentProfile));
  }

  // --- Persistencia y Reconexión Automática (F5) ---
  private checkAutoReconnection(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('escaperoom_active_match');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.roomCode && saved.playerName) {
          this.isAutoReconnecting = true;
          this.reconnectStatusMessage = `Reconectando automáticamente a la sala ${saved.roomCode}...`;
          this.playerName = saved.playerName;
          this.selectedAvatar = saved.avatar || this.selectedAvatar;
          
          setTimeout(() => {
            console.log('🔄 Intentando reconexión persistente:', saved);
            this.socketService.reconnectSession(saved.roomCode, saved.playerName, saved.avatar, saved.playerId);
          }, 800);
        }
      }
    } catch (e) {
      console.warn('Error al verificar sesión previa:', e);
    }
  }

  private saveActiveMatchSession(roomCode: string, scenarioId?: string): void {
    if (typeof window === 'undefined') return;
    const session = {
      roomCode,
      playerId: this.mySocketId,
      playerName: this.playerName,
      avatar: this.selectedAvatar,
      scenarioId
    };
    localStorage.setItem('escaperoom_active_match', JSON.stringify(session));
  }

  private clearActiveMatchSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('escaperoom_active_match');
  }

  leaveRoom(): void {
    if (this.roomState) {
      this.socketService.leaveRoom(this.roomState.code);
    }
    this.clearActiveMatchSession();
    this.roomState = null;
    this.audioService.stopAmbient();
    this.currentAmbientScenario = '';
    this.currentView = 'LANDING';
    this.cdr.markForCheck();
  }

  // --- Ambientación Sonora por Escenario ---
  private updateScenarioAmbient(scenarioId?: string): void {
    if (!scenarioId || this.currentAmbientScenario === scenarioId) return;
    this.currentAmbientScenario = scenarioId;

    if (scenarioId === 'scenario_reactor') {
      this.audioService.playReactorAmbient();
    } else if (scenarioId === 'scenario_temple') {
      this.audioService.playTempleAmbient();
    } else if (scenarioId === 'scenario_space') {
      this.audioService.playSpaceAmbient();
    }
  }

  // --- Mini-Retos de Entrada (Landing Page) ---
  solveChallenge1(): void {
    const clean = this.challenge1Input.trim().toUpperCase();
    if (clean === 'SOS') {
      this.challenge1Solved = true;
      this.challengesBonusXp += 250;
      this.audioService.playChallengeSuccess();
      this.showSuccess('¡Criptograma Resuelto! +250 XP de Bonificación desbloqueados');
    } else {
      this.audioService.playErrorBuzz();
      this.showError('Código incorrecto. Pista: 01010011 en ASCII representa la letra S.');
    }
  }

  onFrequencyChange(): void {
    if (Math.abs(this.frequencySlider - 432) <= 1) {
      if (!this.frequencyAligned) {
        this.frequencyAligned = true;
        this.challengesBonusXp += 250;
        this.audioService.playChallengeSuccess();
        this.showSuccess('¡Frecuencia de Resonancia 432 Hz Sintonizada! Filtro activado.');
      }
    } else {
      this.frequencyAligned = false;
    }
  }

  toggleSwitch(sw: 'A' | 'B' | 'C'): void {
    this.audioService.playKeypadBeep();
    if (sw === 'A') this.switchA = !this.switchA;
    if (sw === 'B') this.switchB = !this.switchB;
    if (sw === 'C') this.switchC = !this.switchC;

    // Patrón correcto: A=true, B=false, C=true (101)
    if (this.switchA && !this.switchB && this.switchC) {
      if (!this.bypassUnlocked) {
        this.bypassUnlocked = true;
        this.challengesBonusXp += 300;
        this.audioService.playChallengeSuccess();
        this.showSuccess('¡Bypass de Seguridad Activado! Acceso VIP concedido.');
      }
    }
  }

  // --- Métodos de Puntuación y Ranking Competitivo PvP ---
  getMyScore(): number {
    if (!this.roomState?.players) return 0;
    const pl = this.roomState.players.find(p => p.id === this.mySocketId);
    return pl?.score || 0;
  }

  getMyRank(): number {
    if (!this.roomState?.players) return 1;
    const pl = this.roomState.players.find(p => p.id === this.mySocketId);
    return pl?.rank || 1;
  }

  getRankBadge(rank: number = 1): string {
    if (rank === 1) return '🥇 1º';
    if (rank === 2) return '🥈 2º';
    if (rank === 3) return '🥉 3º';
    return `#${rank}`;
  }

  // --- Creación y Unión a Salas ---
  createRoom(): void {
    if (!this.playerName.trim()) {
      this.showError('Por favor ingresa tu nombre de agente');
      return;
    }
    if (this.agentProfile) {
      this.agentProfile.missionsPlayed++;
      this.saveAgentProfileToDisk();
    }
    this.socketService.createRoom(
      this.playerName.trim(),
      this.selectedAvatar,
      this.selectedScenarioId || undefined
    );
  }

  selectScenario(scenarioId: string): void {
    this.selectedScenarioId = scenarioId;
    this.updateYoutubeMusic(scenarioId);
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
    if (this.agentProfile) {
      this.agentProfile.missionsPlayed++;
      this.saveAgentProfileToDisk();
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
      this.showError('Debes conectar los 4 fusibles antes de transmitir tu secuencia');
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

  submitDecoder(): void {
    if (!this.roomState || !this.roomState.currentPuzzle || !this.decoderInput.trim()) return;
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      this.decoderInput.trim().toUpperCase()
    );
  }

  onValveSliderChange(): void {
    if (!this.roomState) return;
    this.socketService.updateValvePressure(this.roomState.code, this.myValvePressure);
  }

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

  submitMasterPhrase(): void {
    if (!this.roomState || !this.roomState.currentPuzzle || !this.masterPhraseInput.trim()) return;
    this.socketService.submitPuzzleAnswer(
      this.roomState.code,
      this.roomState.currentPuzzle.id,
      this.masterPhraseInput.trim().toUpperCase()
    );
  }

  requestHint(): void {
    if (!this.roomState || this.roomState.hintsRemaining <= 0) return;
    this.socketService.requestHint(this.roomState.code);
  }

  sendChat(): void {
    if (!this.chatInput.trim() || !this.roomState) return;
    this.socketService.sendChat(this.roomState.code, this.chatInput.trim());
    this.chatInput = '';
  }

  getScenarioThemeClass(): string {
    const scId = this.roomState?.scenario?.id || this.selectedScenarioId || 'scenario_reactor';
    if (scId.includes('temple')) return 'theme-temple';
    if (scId.includes('space')) return 'theme-space';
    return 'theme-reactor';
  }

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
    if (!this.isSoundEnabled) {
      this.audioService.stopAmbient();
    } else if (this.roomState?.status === 'PLAYING') {
      this.updateScenarioAmbient(this.roomState.scenario?.id);
    }
  }

  async openRecordsModal(): Promise<void> {
    const [matches, users] = await Promise.all([
      this.socketService.fetchLeaderboard(),
      this.socketService.fetchUsersLeaderboard()
    ]);
    this.leaderboardRecords = matches || [];
    this.userLeaderboardRecords = users || [];
    this.showRecordsModal = true;
    this.cdr.detectChanges();
  }

  closeRecordsModal(): void {
    this.showRecordsModal = false;
    this.cdr.detectChanges();
  }

  setRecordsModalTab(tab: 'USERS' | 'MATCHES'): void {
    this.recordsModalTab = tab;
    this.cdr.detectChanges();
  }

  private async preloadLeaderboard(): Promise<void> {
    try {
      const [matches, users] = await Promise.all([
        this.socketService.fetchLeaderboard(),
        this.socketService.fetchUsersLeaderboard()
      ]);
      this.leaderboardRecords = matches || [];
      this.userLeaderboardRecords = users || [];
      this.cdr.detectChanges();
    } catch (e) {
      console.warn('Leaderboard pre-fetch:', e);
    }
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

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = null, 4000);
  }
}
