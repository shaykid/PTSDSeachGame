const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(
  process.env.REACT_APP_SIGNALING_PORT ?? process.env.SIGNALING_PORT ?? 3001,
);

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Signaling server is running.\n');
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();

const send = (socket, payload) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const getRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { host: null, guest: null, offer: null });
  }
  return rooms.get(roomId);
};

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (error) {
      return;
    }

    const { type, roomId } = message;
    if (!roomId) return;

    const room = getRoom(roomId);

    if (type === 'host') {
      room.host = ws;
      ws.roomId = roomId;
      ws.role = 'host';
      if (room.guest) {
        send(room.host, { type: 'peerJoined' });
        if (room.offer) {
          send(room.guest, { type: 'offer', offer: room.offer });
        }
      }
      return;
    }

    if (type === 'join') {
      if (room.guest && room.guest.readyState === WebSocket.OPEN) {
        send(ws, { type: 'roomFull' });
        return;
      }

      room.guest = ws;
      ws.roomId = roomId;
      ws.role = 'guest';
      if (room.host) {
        send(room.host, { type: 'peerJoined' });
      }
      if (room.offer) {
        send(room.guest, { type: 'offer', offer: room.offer });
      }
      return;
    }

    if (type === 'offer') {
      room.offer = message.offer;
      if (room.guest) {
        send(room.guest, { type: 'offer', offer: message.offer });
      }
      return;
    }

    if (type === 'answer') {
      if (room.host) {
        send(room.host, { type: 'answer', answer: message.answer });
      }
      return;
    }

    if (type === 'iceCandidate') {
      const target = ws.role === 'host' ? room.guest : room.host;
      send(target, { type: 'iceCandidate', candidate: message.candidate });
    }
  });

  ws.on('close', () => {
    const { roomId, role } = ws;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (role === 'host') {
      room.host = null;
      room.offer = null;
      send(room.guest, { type: 'peerLeft' });
    } else if (role === 'guest') {
      room.guest = null;
      send(room.host, { type: 'peerLeft' });
    }

    if (!room.host && !room.guest) {
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server listening on ${PORT}`);
});
