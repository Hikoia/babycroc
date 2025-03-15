const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const geoip = require('geoip-lite');

// 初始化Express应用
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 配置静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// 数据库模型
const LeaderboardSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  survivedTime: { type: String, required: true },
  country: { type: String, default: 'Unknown' },
  date: { type: Date, default: Date.now }
});

// 如果使用MongoDB，请取消以下注释并配置
// mongoose.connect('mongodb://localhost:27017/survivors', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
// const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);

// 用于本地存储的内存排行榜（如果不使用MongoDB）
let leaderboardEntries = [];

// 游戏状态管理
const games = new Map(); // 存储所有游戏实例

// 生成唯一的游戏ID
function generateGameId() {
  return Math.random().toString(36).substring(2, 15);
}

// API路由
app.get('/api/leaderboard', (req, res) => {
  // 只返回前5名
  const sortedEntries = [...leaderboardEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  res.json(sortedEntries);
});

app.post('/api/leaderboard', (req, res) => {
  const { playerName, score, survivedTime } = req.body;
  
  // 如果使用MongoDB，请使用以下代码
  // const entry = new Leaderboard({ playerName, score, survivedTime });
  // entry.save((err, savedEntry) => {
  //   if (err) return res.status(500).json({ error: err.message });
  //   res.json(savedEntry);
  // });
  
  // 使用内存存储的排行榜
  const entry = { playerName, score, survivedTime, date: new Date() };
  leaderboardEntries.push(entry);
  res.json(entry);
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('Player connected: ' + socket.id);
  
  // 获取玩家IP和国家
  const ip = socket.handshake.address;
  const geo = geoip.lookup(ip) || { country: 'Unknown' };
  
  // 处理玩家加入
  socket.on('playerJoin', (playerData) => {
    console.log('Player joining game:', playerData.name);
    
    // 如果玩家已在某个游戏中，先将其移除
    for (const [gameId, game] of games) {
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        socket.leave(gameId);
        if (Object.keys(game.players).length === 0) {
          games.delete(gameId);
        }
      }
    }
    
    // 创建新的游戏实例
    const gameId = generateGameId();
    const gameState = {
      id: gameId,
      players: {},
      enemies: [],
      candies: []
    };
    
    // 将玩家添加到新的游戏实例
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      country: geo.country,
      x: Math.random() * 1000 + 500,
      y: Math.random() * 1000 + 500,
      health: 50,
      level: 1,
      xp: 0,
      score: 0,
      direction: 0,
      items: ['mic', 'discoball']
    };
    
    // 保存游戏实例
    games.set(gameId, gameState);
    
    // 将玩家加入到游戏房间
    socket.join(gameId);
    socket.gameId = gameId;
    
    // 发送游戏状态给玩家
    socket.emit('gameState', gameState);
  });
  
  // 处理玩家移动
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
    
    // 只向同一游戏实例的玩家广播更新
    socket.to(socket.gameId).emit('playerUpdate', {
      id: socket.id,
      x: player.x,
      y: player.y,
      direction: player.direction
    });
  });
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected: ' + socket.id);
    
    const gameState = games.get(socket.gameId);
    if (gameState && gameState.players[socket.id]) {
      // Remove player from game state
      delete gameState.players[socket.id];
      
      // If no players left, delete game instance
      if (Object.keys(gameState.players).length === 0) {
        games.delete(socket.gameId);
      } else {
        // Notify other players in the same game instance
        socket.to(socket.gameId).emit('playerLeft', socket.id);
      }
    }
  });
  
  // 处理分数提交
  socket.on('submitScore', (scoreData) => {
    const { playerName, score, survivedTime } = scoreData;
    // 将分数添加到排行榜
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

// 游戏循环 - 每100毫秒更新一次游戏状态
setInterval(() => {
  // 更新每个游戏实例
  for (const [gameId, gameState] of games) {
    // 在这里可以实现敌人AI，生成新敌人等
    
    // 只向该游戏实例的玩家广播更新
    io.to(gameId).emit('gameStateUpdate', gameState);
  }
}, 100);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 