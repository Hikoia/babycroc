const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

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

// API路由
app.get('/api/leaderboard', (req, res) => {
  // 如果使用MongoDB，请使用以下代码
  // Leaderboard.find().sort({ score: -1 }).limit(10).exec((err, entries) => {
  //   if (err) return res.status(500).json({ error: err.message });
  //   res.json(entries);
  // });
  
  // 使用内存存储的排行榜
  const sortedEntries = [...leaderboardEntries].sort((a, b) => b.score - a.score).slice(0, 10);
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

// 游戏状态
const gameState = {
  players: {},
  enemies: [],
  candies: []
};

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('玩家已连接: ' + socket.id);
  
  // 处理玩家加入
  socket.on('playerJoin', (playerData) => {
    console.log('玩家加入游戏:', playerData.name);
    
    // 将玩家添加到游戏状态
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      x: Math.random() * 1000 + 500,  // 随机位置
      y: Math.random() * 1000 + 500,
      health: 50,
      level: 1,
      xp: 0,
      score: 0,
      direction: 0,  // FACE_LEFT
      items: ['mic', 'discoball']
    };
    
    // 将当前游戏状态发送给新加入的玩家
    socket.emit('gameState', gameState);
    
    // 通知其他玩家有新玩家加入
    socket.broadcast.emit('playerJoined', gameState.players[socket.id]);
  });
  
  // 处理玩家移动
  socket.on('playerMove', (movement) => {
    const player = gameState.players[socket.id];
    if (!player) return;
    
    // 更新玩家位置
    if (movement.left) player.x -= 3;
    if (movement.right) player.x += 3;
    if (movement.up) player.y -= 3;
    if (movement.down) player.y += 3;
    
    // 设置方向
    if (movement.direction !== undefined) {
      player.direction = movement.direction;
    }
    
    // 将更新后的位置广播给所有玩家
    io.emit('playerUpdate', {
      id: socket.id,
      x: player.x,
      y: player.y,
      direction: player.direction
    });
  });
  
  // 处理玩家攻击
  socket.on('playerAttack', (attackData) => {
    // 在这里处理玩家攻击逻辑
    // 例如，检查是否击中敌人等
  });
  
  // 处理玩家得分提交
  socket.on('submitScore', (scoreData) => {
    const { playerName, score, survivedTime } = scoreData;
    
    // 将分数添加到排行榜
    const entry = { playerName, score, survivedTime, date: new Date() };
    leaderboardEntries.push(entry);
    
    // 通知所有玩家排行榜已更新
    io.emit('leaderboardUpdated');
  });
  
  // 处理玩家断开连接
  socket.on('disconnect', () => {
    console.log('玩家断开连接: ' + socket.id);
    
    // 从游戏状态中移除玩家
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      
      // 通知其他玩家有玩家离开
      socket.broadcast.emit('playerLeft', socket.id);
    }
  });
});

// 游戏循环 - 每100毫秒更新一次游戏状态
setInterval(() => {
  // 在这里可以实现敌人AI，生成新敌人等
  
  // 将更新后的游戏状态广播给所有玩家
  io.emit('gameStateUpdate', gameState);
}, 100);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 