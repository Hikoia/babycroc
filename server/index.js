const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const geoip = require('geoip-lite');
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});

// 用於存儲遊戲狀態
const games = new Map();
let leaderboardEntries = [];

// 生成唯一的遊戲ID
function generateGameId() {
  return Math.random().toString(36).substring(2, 15);
}

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// API路由
app.get('/api/leaderboard', (req, res) => {
  // 只返回前5名
  const sortedEntries = [...leaderboardEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  res.json(sortedEntries);
});

// 處理所有路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket 連接處理
io.on('connection', (socket) => {
  console.log('Player connected: ' + socket.id);
  
  // 獲取玩家IP和國家
  const ip = socket.handshake.address;
  const geo = geoip.lookup(ip) || { country: 'Unknown' };
  
  // 處理玩家加入
  socket.on('playerJoin', (playerData) => {
    console.log('Player joining game:', playerData.name);
    
    // 如果玩家已在某個遊戲中，先將其移除
    for (const [gameId, game] of games) {
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        socket.leave(gameId);
        if (Object.keys(game.players).length === 0) {
          games.delete(gameId);
        }
      }
    }
    
    // 創建新的遊戲實例
    const gameId = generateGameId();
    const gameState = {
      id: gameId,
      players: {},
      enemies: [],
      candies: []
    };
    
    // 將玩家添加到新的遊戲實例
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      country: geo.country,
      x: Math.random() * 1000 + 500,
      y: Math.random() * 1000 + 500,
      health: 50,
      score: 0,
      direction: 0
    };
    
    // 保存遊戲實例
    games.set(gameId, gameState);
    
    // 將玩家加入到遊戲房間
    socket.join(gameId);
    socket.gameId = gameId;
    
    // 發送遊戲狀態給玩家
    socket.emit('gameState', gameState);
  });
  
  // 處理玩家移動
  socket.on('playerMove', (movement) => {
    const gameState = games.get(socket.gameId);
    if (!gameState || !gameState.players[socket.id]) return;
    
    const player = gameState.players[socket.id];
    
    // 更新玩家位置
    if (movement.left) player.x -= 3;
    if (movement.right) player.x += 3;
    if (movement.up) player.y -= 3;
    if (movement.down) player.y += 3;
    
    if (movement.direction !== undefined) {
      player.direction = movement.direction;
    }
    
    // 只向同一遊戲實例的玩家廣播更新
    socket.to(socket.gameId).emit('playerUpdate', {
      id: socket.id,
      x: player.x,
      y: player.y,
      direction: player.direction
    });
  });
  
  // 處理玩家斷開連接
  socket.on('disconnect', () => {
    console.log('Player disconnected: ' + socket.id);
    
    const gameState = games.get(socket.gameId);
    if (gameState && gameState.players[socket.id]) {
      // 從遊戲狀態中移除玩家
      delete gameState.players[socket.id];
      
      // 如果沒有玩家了，刪除遊戲實例
      if (Object.keys(gameState.players).length === 0) {
        games.delete(socket.gameId);
      } else {
        // 通知同一遊戲實例中的其他玩家
        socket.to(socket.gameId).emit('playerLeft', socket.id);
      }
    }
  });
  
  // 處理分數提交
  socket.on('submitScore', (scoreData) => {
    const { playerName, score, survivedTime } = scoreData;
    // 將分數添加到排行榜
    const entry = {
      playerName,
      score,
      survivedTime,
      country: geo.country,
      date: new Date()
    };
    leaderboardEntries.push(entry);
    // 通知所有玩家排行榜已更新
    io.emit('leaderboardUpdated');
  });
});

// 遊戲循環 - 每100毫秒更新一次遊戲狀態
setInterval(() => {
  // 更新每個遊戲實例
  for (const [gameId, gameState] of games) {
    // 在這裡可以實現敵人AI，生成新敵人等
    
    // 只向該遊戲實例的玩家廣播更新
    io.to(gameId).emit('gameStateUpdate', gameState);
  }
}, 100);

// 啟動服務器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// 為 Vercel 環境導出必要的模塊
module.exports = app; 