const express = require('express');
const http = require('http');
const cors = require('cors');
const os = require('os');
const { Server } = require('socket.io');
require('dotenv').config();

const setupEscapeSockets = require('./sockets/escapeSocket');
const puzzlesData = require('./data/puzzles.json');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupEscapeSockets(io);

// Endpoints REST de diagnóstico
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Escape Room Digital Colaborativo - Backend',
    levelsCount: puzzlesData.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/levels', (req, res) => {
  res.json(puzzlesData.map(lvl => ({
    id: lvl.id,
    roomNumber: lvl.roomNumber,
    title: lvl.title,
    subtitle: lvl.subtitle,
    puzzlesCount: lvl.puzzles.length
  })));
});

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ name, address: net.address });
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log('======================================================');
  console.log('🔐 Servidor Escape Room Colaborativo (Node.js + Socket.io)');
  console.log(`🚀 Local:    http://localhost:${PORT}`);
  localIps.forEach(ip => {
    console.log(`🌐 Red Wi-Fi (${ip.name}): http://${ip.address}:${PORT}`);
  });
  console.log(`📱 Frontend en red: http://${localIps[0]?.address || 'TU_IP'}:4200`);
  console.log(`🎯 Sincronización asimétrica lista`);
  console.log('======================================================\n');
});
