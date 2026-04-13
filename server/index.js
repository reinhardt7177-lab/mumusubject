// mumusubject - 서버 진입점
// Socket.io 기반 실시간 멀티플레이어 서버

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// 기본 라우트
app.get('/', (req, res) => {
  res.send('🎮 mumusubject 서버 실행 중...');
});

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log(`✅ 클라이언트 연결: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ 클라이언트 연결 해제: ${socket.id}`);
  });

  // 추후: 게임 이벤트 핸들러 추가
  // socket.on('playerMove', (data) => { ... });
  // socket.on('questComplete', (data) => { ... });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
