class BotEscapeService {
  constructor() {
    this.botNames = [
      { name: 'Agente_Nova', avatar: '🤖' },
      { name: 'Cypher_Bot', avatar: '🧙‍♂️' },
      { name: 'Hacker_Zero', avatar: '🐱‍💻' },
      { name: 'Echo_Drone', avatar: '⚡' }
    ];
  }

  createBot(room) {
    const existingBotCount = room.players.filter(p => p.isBot).length;
    const botTemplate = this.botNames[existingBotCount % this.botNames.length];
    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      id: botId,
      name: `${botTemplate.name}`,
      avatar: botTemplate.avatar,
      isBot: true,
      isConnected: true
    };
  }

  // Si el bot necesita aportar su fragmento al chat colaborativo
  generateBotChatHelp(room, currentPuzzle) {
    if (!currentPuzzle) return null;

    if (currentPuzzle.type === 'RIDDLE') {
      return '🤖 [Bot]: "He procesado los datos del acertijo... la solución matemática es [ 7394 ]."';
    } else if (currentPuzzle.type === 'ASYNC_KEYPAD') {
      return '🤖 [Bot]: "Compañeros, mi fragmento de código indica: [ 9 ] y [ 4 ] para el teclado."';
    } else if (currentPuzzle.type === 'CABLE_SEQUENCE') {
      return '🤖 [Bot]: "¡Tengo los fusibles listos! Avisen cuando deba presionar el mío."';
    } else if (currentPuzzle.type === 'DECODER') {
      return '🤖 [Bot]: "Analizando la tabla ASCII... 01000001 corresponde a la letra A."';
    } else if (currentPuzzle.type === 'MASTER_PHRASE') {
      return '🤖 [Bot]: "Mi clave de autorización es: HUMANO-2026. Combínenla con las suyas."';
    }
    return null;
  }
}

module.exports = new BotEscapeService();
