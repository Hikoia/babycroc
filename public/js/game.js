/**
 * 游戏主要类
 */
class Game {
  constructor() {
    // 基本配置
    this.canvas = document.getElementById('canvas');
    this.canvasContainer = document.getElementById('canvas-container');
    this.context = this.canvas ? this.canvas.getContext('2d') : null;
    this.targetFps = 60;
    this.gameRunning = false;
    this.gameIntervalId = null;
    this.levelRunStart = null;
    this.playerName = '';
    
    // 游戏元素
    this.player = null;
    this.otherPlayers = {};
    this.objects = [];
    this.enemiesDestroyed = 0;
    this.gameId = null; // 添加游戏ID
    
    // 输入状态
    this.input = {
      right: false,
      left: false,
      up: false,
      down: false,
    };
    
    // 触控相关状态
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchThreshold = 30; // 触控移动阈值
    this.isTouching = false;
    
    // 网络相关
    this.socket = null;
    
    // 资源加载
    this.images = {
      playerImageLeft: makeImage('/images/player-1.L.png'),
      playerImageLeft2: makeImage('/images/player-2.L.png'),
      playerImageRight: makeImage('/images/player-1.png'),
      playerImageRight2: makeImage('/images/player-2.png'),
      momcrocImageLeft: makeImage('/images/momcroc-1.L.png'),
      momcrocImageLeft2: makeImage('/images/momcroc-2.L.png'),
      momcrocImageRight: makeImage('/images/momcroc-1.png'),
      momcrocImageRight2: makeImage('/images/momcroc-2.png'),
      babycrocImage1: makeImage('/images/babycroc-1.png'),
      babycrocImage2: makeImage('/images/babycroc-2.png'),
      eggDroppedImage: makeImage('/images/egg-dropped.png'),
      eggImage: makeImage('/images/egg.png'),
      iphoneImage: makeImage('/images/iphone.png'),
      floorImage: makeImage('/images/floor.png')
    };
    
    // 绑定按键事件
    this.bindKeyEvents();
    
    // 绑定触控事件
    this.bindTouchEvents();
    
    this.lastScoreTime = null; // 添加计时器用于计算分数
    this.SCORE_INTERVAL = 1000; // 每秒检查一次
    this.SCORE_PER_SECOND = 1; // 每秒增加1分
  }
  
  /**
   * 初始化游戏
   */
  init(playerName) {
    // 先清理之前的状态
    this.cleanup();
    this.stopGame();
    
    // 设置新的状态
    this.playerName = playerName;
    this.gameRunning = false;
    this.gameIntervalId = null;
    this.levelRunStart = Date.now();
    this.lastEnemySpawnTime = Date.now();
    this.enemiesDestroyed = 0;
    this.objects = [];
    this.otherPlayers = {};
    this.player = null;
    
    // 重置输入状态
    this.input = {
      right: false,
      left: false,
      up: false,
      down: false,
    };
    
    // 初始化Socket.io连接
    this.initSocketConnection();
    
    // 显示游戏画布
    this.canvasContainer.classList.remove('hidden');
    
    if (this.player) {
      this.player.score = 0;
    }
    
    return this;
  }
  
  /**
   * 初始化Socket.io连接
   */
  initSocketConnection() {
    // 如果已经有连接，先断开
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // 创建新的连接
    this.socket = io();
    
    // 连接事件
    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      
      // 加入游戏
      this.socket.emit('playerJoin', {
        name: this.playerName
      });
    });
    
    // 接收游戏状态
    this.socket.on('gameState', (gameState) => {
      // 保存游戏ID
      this.gameId = gameState.id;
      
      // 创建本地玩家
      const playerData = gameState.players[this.socket.id];
      if (playerData) {
        this.createPlayer(playerData.x, playerData.y);
      }
      
      // 加载其他玩家
      for (const playerId in gameState.players) {
        if (playerId !== this.socket.id) {
          this.addOtherPlayer(gameState.players[playerId]);
        }
      }
      
      // 开始游戏循环
      this.startGame();
    });
    
    // 玩家加入
    this.socket.on('playerJoined', (playerData) => {
      this.addOtherPlayer(playerData);
    });
    
    // 玩家离开
    this.socket.on('playerLeft', (playerId) => {
      if (this.otherPlayers[playerId]) {
        // 从游戏对象列表中移除
        const index = this.objects.indexOf(this.otherPlayers[playerId]);
        if (index !== -1) {
          this.objects.splice(index, 1);
        }
        // 从其他玩家列表中移除
        delete this.otherPlayers[playerId];
      }
    });
    
    // 玩家更新
    this.socket.on('playerUpdate', (playerData) => {
      if (playerData.id !== this.socket.id && this.otherPlayers[playerData.id]) {
        const otherPlayer = this.otherPlayers[playerData.id];
        otherPlayer.x = playerData.x;
        otherPlayer.y = playerData.y;
        
        if (playerData.direction !== undefined) {
          otherPlayer.setDirection(playerData.direction);
        }
      }
    });
    
    // 游戏状态更新
    this.socket.on('gameStateUpdate', (gameState) => {
      // 更新敌人和物品等
    });
  }
  
  /**
   * 绑定按键事件
   */
  bindKeyEvents() {
    if (!this.canvas) return; // 如果 canvas 不存在则返回
    
    window.addEventListener('keydown', (e) => {
      if (e.keyCode === KEY_LEFT) {
        this.input.left = true;
        if (this.player) {
          this.player.setDirection(FACE_LEFT);
          this.sendPlayerMovement();
        }
      } else if (e.keyCode === KEY_RIGHT) {
        this.input.right = true;
        if (this.player) {
          this.player.setDirection(FACE_RIGHT);
          this.sendPlayerMovement();
        }
      } else if (e.keyCode === KEY_UP) {
        this.input.up = true;
        this.sendPlayerMovement();
      } else if (e.keyCode === KEY_DOWN) {
        this.input.down = true;
        this.sendPlayerMovement();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.keyCode === KEY_LEFT) {
        this.input.left = false;
        this.sendPlayerMovement();
      } else if (e.keyCode === KEY_RIGHT) {
        this.input.right = false;
        this.sendPlayerMovement();
      } else if (e.keyCode === KEY_UP) {
        this.input.up = false;
        this.sendPlayerMovement();
      } else if (e.keyCode === KEY_DOWN) {
        this.input.down = false;
        this.sendPlayerMovement();
      }
    });
  }
  
  /**
   * 发送玩家移动信息到服务器
   */
  sendPlayerMovement() {
    if (!this.socket || !this.player) return;
    
    this.socket.emit('playerMove', {
      left: this.input.left,
      right: this.input.right,
      up: this.input.up,
      down: this.input.down,
      direction: this.player.direction
    });
  }
  
  /**
   * 创建玩家
   */
  createPlayer(x, y) {
    this.player = new Player(x, y);
    this.objects.push(this.player);
  }
  
  /**
   * 添加其他玩家
   */
  addOtherPlayer(playerData) {
    const otherPlayer = new OtherPlayer(
      playerData.id,
      playerData.name,
      playerData.x, 
      playerData.y
    );
    
    this.otherPlayers[playerData.id] = otherPlayer;
    this.objects.push(otherPlayer);
  }
  
  /**
   * 开始游戏
   */
  startGame() {
    this.gameRunning = true;
    
    // 初始化游戏时间和分数计时器
    this.levelRunStart = Date.now();
    this.lastEnemySpawnTime = Date.now();
    this.lastScoreTime = Date.now();
    
    // 立即生成第一波敌人
    this.spawnEnemies();
    
    // 开始游戏循环
    this.gameIntervalId = setInterval(() => {
      this.gameLoop();
    }, 1000 / this.targetFps);
  }
  
  /**
   * 停止游戏
   */
  stopGame() {
    this.gameRunning = false;
    if (this.gameIntervalId) {
      clearInterval(this.gameIntervalId);
      this.gameIntervalId = null;
    }
  }
  
  /**
   * 游戏循环
   */
  gameLoop() {
    if (!this.gameRunning) {
      this.stopGame();
      return;
    }

    // 处理游戏结束状态
    if (this.player && this.player.health <= 0) {
      this.handleGameOver();
      return;
    }
    
    // 更新生存时间分数
    this.updateSurvivalScore();
    
    // 定期生成敌人
    this.spawnEnemies();
    
    // 每5秒检查一次是否需要生成新的球
    if (Date.now() - (this.lastBallSpawnTime || 0) > 5000) {
      this.spawnCollectibleBall();
      this.lastBallSpawnTime = Date.now();
    }
    
    // 更新游戏对象
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      if (object) {
        object.update();
        if (object.destroyed) {
          this.objects.splice(i, 1);
          i--;
        }
      }
    }
    
    // 绘制游戏
    this.draw();
  }
  
  /**
   * 生成敌人
   */
  spawnEnemies() {
    // 检查是否应该生成新一波敌人
    if (!this.lastEnemySpawnTime) {
      this.lastEnemySpawnTime = Date.now();
      return;
    }
    
    const ENEMY_SPAWN_TIME_BETWEEN_WAVES = 3000; // 3秒生成一波
    const ENEMY_SPAWN_COUNT_PER_WAVE = 15; // 每波15个敌人
    const MAX_OBJECTS = 500; // 最大对象数量限制
    
    if (Date.now() - this.lastEnemySpawnTime < ENEMY_SPAWN_TIME_BETWEEN_WAVES) {
      return;
    }
    
    if (this.objects.length > MAX_OBJECTS) {
      return;
    }
    
    // 如果玩家存在，在玩家周围生成敌人
    if (this.player) {
      // 计算生成位置的基准点（玩家位置）
      const baseX = this.player.x;
      const baseY = this.player.y;
      
      for (let i = 0; i < ENEMY_SPAWN_COUNT_PER_WAVE; i++) {
        // 在玩家周围的圆形区域随机生成敌人
        const radius = randomRange(900, 1200);
        const angle = randomRange(0, Math.PI * 2);
        const randX = baseX + Math.sin(angle) * radius;
        const randY = baseY + Math.cos(angle) * radius;
        
        const enemy = new Enemy(randX, randY);
        enemy.baseSpeed = 0.8; // 修改基础速度
        enemy.speed = enemy.baseSpeed; // 设置当前速度
        this.objects.push(enemy);
      }
      
      this.lastEnemySpawnTime = Date.now();
    }
  }
  
  /**
   * 清理游戏状态
   */
  cleanup() {
    // 清理所有游戏对象
    this.objects = [];
    // 清理其他玩家
    this.otherPlayers = {};
    // 清理玩家实例
    this.player = null;
    // 重置游戏状态
    this.gameRunning = false;
    this.enemiesDestroyed = 0;
    this.levelRunStart = null;
    this.lastEnemySpawnTime = null;
    // 重置输入状态
    this.input = {
      right: false,
      left: false,
      up: false,
      down: false,
    };
    this.lastScoreTime = null;
  }
  
  /**
   * 重新开始游戏
   */
  restart() {
    // 停止当前游戏循环
    this.stopGame();
    
    // 清理当前游戏状态
    this.cleanup();
    
    // 重新加入游戏
    if (this.socket) {
      this.socket.emit('playerJoin', {
        name: this.playerName
      });
    }
  }
  
  /**
   * 处理游戏结束
   */
  handleGameOver() {
    if (!this.gameRunning) return;
    
    const survivedTime = (Date.now() - this.levelRunStart) / 1000;
    const score = this.player ? this.player.score : 0; // 直接使用玩家的 score
    
    // 提交分数
    this.submitPlayerScore(score, survivedTime);
    
    // 停止游戏
    this.stopGame();
    
    // 显示游戏结束界面
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').textContent = score;
    document.getElementById('survived-time').textContent = Math.floor(survivedTime);
  }
  
  /**
   * 提交玩家分数
   */
  submitPlayerScore(score, survivedTime) {
    if (this.socket) {
      this.socket.emit('submitScore', {
        playerName: this.playerName,
        score,
        survivedTime
      });
    }
  }
  
  /**
   * 绘制游戏
   */
  draw() {
    // 清除画布
    this.resetCanvas();
    
    // 绘制背景
    if (this.images.floorImage && this.images.floorImage.complete && this.images.floorImage.naturalWidth !== 0) {
      const bgPattern = this.context.createPattern(this.images.floorImage, 'repeat');
      this.context.fillStyle = bgPattern;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // 如果图片未加载，使用纯色背景
      this.context.fillStyle = '#222222';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制游戏对象
    for (const object of this.objects) {
      if (object) {
        object.draw();
      }
    }
    
    // 绘制界面
    this.drawUI();
  }
  
  /**
   * 绘制用户界面
   */
  drawUI() {
    if (!this.player || !this.levelRunStart) return;
    
    // 计算游戏时间
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - this.levelRunStart) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    // 计算最高愤怒层数
    const maxRageLevel = Math.max(0, ...this.objects
      .filter(obj => obj instanceof Enemy && obj.isEnraged)
      .map(enemy => enemy.rageLevel)
    );
    
    // 绘制状态栏
    const text = `❤️: ${this.player.health} 💀: ${this.enemiesDestroyed} 🏆: ${this.player.score} ⏱️: ${leftPad(minutes, 2, 0)}:${leftPad(seconds, 2, 0)} ${maxRageLevel > 0 ? `🔥×${maxRageLevel}` : ''}`;
    
    // 保存当前上下文状态
    this.context.save();
    
    // 设置固定位置（相对于视口）
    const viewportX = -pxStrToNumber(this.canvasContainer.style.left);
    const viewportY = -pxStrToNumber(this.canvasContainer.style.top);
    const viewportWidth = window.innerWidth;
    
    // 设置文本样式
    this.context.font = '16px monospace';
    this.context.fillStyle = 'white';
    this.context.textAlign = 'center';
    
    // 绘制半透明背景
    const textWidth = this.context.measureText(text).width;
    const padding = 10;
    const bgHeight = 25;
    
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillRect(
      viewportX + (viewportWidth - textWidth) / 2 - padding,
      viewportY + 10,
      textWidth + padding * 2,
      bgHeight
    );
    
    // 绘制文本
    this.context.fillStyle = 'white';
    this.context.fillText(
      text,
      viewportX + viewportWidth / 2,
      viewportY + 27
    );
    
    // 恢复上下文状态
    this.context.restore();
  }
  
  /**
   * 清除画布
   */
  resetCanvas() {
    this.context.clearRect(
      0, 0, this.canvas.width, this.canvas.height
    );
    
    this.context.beginPath();
    this.context.fillStyle = 'black';
    this.context.fillRect(
      0, 0, this.canvas.width, this.canvas.height
    );
  }
  
  /**
   * UI位置辅助方法
   */
  guiPosition(x, y, cb) {
    const xOffset = pxStrToNumber(this.canvasContainer.style.left);
    const yOffset = pxStrToNumber(this.canvasContainer.style.top);
    
    cb(x - xOffset, y - yOffset);
  }
  
  /**
   * UI顶部中间位置辅助方法
   */
  guiTopMiddle(cb) {
    const xCenter = window.innerWidth / 2;
    this.guiPosition(xCenter, 50, cb);
  }
  
  /**
   * 聚焦相机到指定位置
   */
  focusCameraOn(targetX, targetY) {
    const xOffset = pxStrToNumber(this.canvasContainer.style.left);
    const xCenter = window.innerWidth / 2;
    const yOffset = pxStrToNumber(this.canvasContainer.style.top);
    const yCenter = window.innerHeight / 2;
    
    this.canvasContainer.style.left = `${lerp(
      xOffset,
      this.boundXToCanvas(-(targetX - xCenter)),
      0.1
    )}px`;
    
    this.canvasContainer.style.top = `${lerp(
      yOffset,
      this.boundYToCanvas(-(targetY - yCenter)),
      0.1
    )}px`;
  }
  
  /**
   * 限制X坐标到画布范围
   */
  boundXToCanvas(x) {
    const leftBound = 0;
    const rightBound = this.canvas.width - window.innerWidth;
    return Math.max(-rightBound, Math.min(leftBound, x));
  }
  
  /**
   * 限制Y坐标到画布范围
   */
  boundYToCanvas(y) {
    const topBound = 0;
    const bottomBound = this.canvas.height - window.innerHeight;
    return Math.max(-bottomBound, Math.min(topBound, y));
  }
  
  // 添加生成球的方法
  spawnCollectibleBall() {
    const MAX_BALLS = 10; // 场上最多10个球
    const currentBalls = this.objects.filter(obj => obj instanceof CollectibleBall).length;
    
    if (currentBalls < MAX_BALLS) {
      this.objects.push(new CollectibleBall());
    }
  }
  
  // 添加生存时间分数更新方法
  updateSurvivalScore() {
    if (!this.player || !this.lastScoreTime) return;
    
    const now = Date.now();
    const timePassed = now - this.lastScoreTime;
    
    if (timePassed >= this.SCORE_INTERVAL) {
      // 计算应该增加的分数（可能跨越多个计分间隔）
      const intervals = Math.floor(timePassed / this.SCORE_INTERVAL);
      const scoreToAdd = intervals * this.SCORE_PER_SECOND;
      
      this.player.score += scoreToAdd;
      this.lastScoreTime = now;
    }
  }

  /**
   * 绑定触控事件
   */
  bindTouchEvents() {
    if (!this.canvas) return; // 如果 canvas 不存在则返回
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.isTouching = true;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isTouching) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      
      // 重置所有方向
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
      
      // 根据滑动方向设置移动
      if (Math.abs(deltaX) > this.touchThreshold) {
        if (deltaX > 0) {
          this.input.right = true;
          if (this.player) {
            this.player.setDirection(FACE_RIGHT);
          }
        } else {
          this.input.left = true;
          if (this.player) {
            this.player.setDirection(FACE_LEFT);
          }
        }
      }
      
      if (Math.abs(deltaY) > this.touchThreshold) {
        if (deltaY > 0) {
          this.input.down = true;
        } else {
          this.input.up = true;
        }
      }
      
      this.sendPlayerMovement();
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isTouching = false;
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
      this.sendPlayerMovement();
    });
  }
}

/**
 * 玩家类
 */
class Player {
  constructor(x, y) {
    this.leftAnimation = new Animation([
      { time: 12, image: game.images.playerImageLeft },
      { time: 12, image: game.images.playerImageLeft2 },
    ]);
    this.rightAnimation = new Animation([
      { time: 12, image: game.images.playerImageRight },
      { time: 12, image: game.images.playerImageRight2 },
    ]);
    this.idle = true;
    this.x = x;
    this.y = y;
    this.width = 30 * 2;
    this.height = 33 * 2;
    this.health = 50;
    this.speed = 3;
    this.score = 0;
    this.items = [new MicWeapon()];
    this.setDirection(FACE_LEFT);
  }

  update() {
    // 保存移动前的位置
    const prevX = this.x;
    const prevY = this.y;
    
    // 处理玩家移动
    if (game.input.right) this.x += this.speed;
    if (game.input.left) this.x -= this.speed;
    if (game.input.up) this.y -= this.speed;
    if (game.input.down) this.y += this.speed;
    
    // 限制玩家在游戏世界范围内
    this.x = Math.max(this.width / 2, Math.min(WORLD_WIDTH - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(WORLD_HEIGHT - this.height / 2, this.y));
    
    this.idle = !game.input.right && !game.input.left && 
               !game.input.up && !game.input.down;
    
    // 聚焦相机
    game.focusCameraOn(this.x, this.y);
    
    // 更新动画
    this.animation.update(this.idle);
    
    // 更新物品
    this.items.forEach(item => item.update());
  }

  draw() {
    // 绘制武器
    this.items.forEach(item => item.draw());
    
    // 绘制玩家
    const image = this.animation.image();
    if (image) {
      image.width = this.width;
      image.height = this.height;
      game.context.drawImage(
        image,
        this.x - (this.width / 2.0),
        this.y - (this.height / 2.0),
        this.width, this.height
      );
    }
    
    // 绘制玩家名称
    game.context.font = '14px Arial';
    game.context.fillStyle = 'white';
    game.context.textAlign = 'center';
    game.context.fillText(game.playerName, this.x, this.y - this.height / 2 - 10);
    game.context.textAlign = 'left';
  }

  setDirection(direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.animation = this.direction === FACE_LEFT ? this.leftAnimation : this.rightAnimation;
    this.animation.reset();
  }
}

/**
 * 其他玩家类
 */
class OtherPlayer {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.leftAnimation = new Animation([
      { time: 12, image: game.images.playerImageLeft },
      { time: 12, image: game.images.playerImageLeft2 },
    ]);
    this.rightAnimation = new Animation([
      { time: 12, image: game.images.playerImageRight },
      { time: 12, image: game.images.playerImageRight2 },
    ]);
    this.idle = true;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.width = 30 * 2;
    this.height = 33 * 2;
    this.direction = FACE_LEFT;
    this.animation = this.leftAnimation;
  }

  update() {
    // 检测移动状态
    this.idle = this.x === this.prevX && this.y === this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;
    
    // 更新动画
    this.animation.update(this.idle);
  }

  draw() {
    // 绘制玩家
    const image = this.animation.image();
    if (image) {
      image.width = this.width;
      image.height = this.height;
      game.context.drawImage(
        image,
        this.x - (this.width / 2.0),
        this.y - (this.height / 2.0),
        this.width, this.height
      );
    }
    
    // 绘制玩家名称
    game.context.font = '14px Arial';
    game.context.fillStyle = 'white';
    game.context.textAlign = 'center';
    game.context.fillText(this.name, this.x, this.y - this.height / 2 - 10);
    game.context.textAlign = 'left';
  }

  setDirection(direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.animation = this.direction === FACE_LEFT ? this.leftAnimation : this.rightAnimation;
    this.animation.reset();
  }
}

/**
 * 敌人类
 */
class Enemy {
  constructor(x, y) {
    this.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.leftAnimation = new Animation([
      { time: 100, image: game.images.momcrocImageLeft },
      { time: 100, image: game.images.momcrocImageLeft2 },
    ]);
    this.rightAnimation = new Animation([
      { time: 100, image: game.images.momcrocImageRight },
      { time: 100, image: game.images.momcrocImageRight2 },
    ]);
    this.idle = false;
    this.x = x;
    this.prevX = x;
    this.y = y;
    this.prevY = y;
    this.width = 30 * 2;
    this.height = 33 * 2;
    this.baseSpeed = 0.4;  // 基础速度
    this.speed = this.baseSpeed;
    this.health = 3;
    this.attackStrength = 1;
    this.attackSpeed = 500; // ms
    this.lastAttackTime = Date.now();
    this.destroyed = false;
    this.isEnraged = false;  // 是否处于愤怒状态
    this.enrageEndTime = 0;  // 愤怒状态结束时间
    this.rageLevel = 0;      // 愤怒层数
    this.setDirection(FACE_LEFT);
  }

  // 修改愤怒状态方法
  enrage() {
    this.isEnraged = true;
    this.rageLevel += 1;  // 增加愤怒层数
    this.speed = this.baseSpeed * (1 + (this.rageLevel * 0.5));  // 每层增加50%速度
    this.enrageEndTime = Date.now() + 5000;  // 5秒后恢复
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    // 处理死亡状态
    if (this.health <= 0) {
      this.destroy();
      return;
    }

    // 更新愤怒状态
    if (this.isEnraged && Date.now() > this.enrageEndTime) {
      this.isEnraged = false;
      this.rageLevel = 0;  // 重置愤怒层数
      this.speed = this.baseSpeed;
    }

    // 向最近的玩家移动
    let nearestPlayer = game.player;
    let nearestDistance = Infinity;
    
    // 计算到本地玩家的距离
    if (game.player) {
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      nearestDistance = Math.sqrt(dx * dx + dy * dy);
    }
    
    // 检查其他玩家是否更近
    for (const playerId in game.otherPlayers) {
      const otherPlayer = game.otherPlayers[playerId];
      const dx = otherPlayer.x - this.x;
      const dy = otherPlayer.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestDistance) {
        nearestPlayer = otherPlayer;
        nearestDistance = distance;
      }
    }
    
    // 如果有玩家，向其移动
    if (nearestPlayer) {
      const dx = nearestPlayer.x - this.x;
      const dy = nearestPlayer.y - this.y;
      const angle = Math.atan2(dy, dx);
      
      this.x += this.speed * Math.cos(angle);
      this.y += this.speed * Math.sin(angle);
      
      // 处理攻击状态
      let attacking = false;
      const msSinceLastAttack = Date.now() - this.lastAttackTime;
      
      if (msSinceLastAttack > this.attackSpeed) {
        attacking = true;
        this.lastAttackTime = Date.now();
      }
      
      // 设置方向
      this.setDirection(this.x > this.prevX ? FACE_RIGHT : FACE_LEFT);
      
      // 更新动画
      this.animation.update(this.idle);
      
      // 攻击本地玩家
      if (nearestPlayer === game.player && attacking && 
          Math.abs(dx) < 40 && Math.abs(dy) < 40) {
        game.player.health = Math.max(game.player.health - this.attackStrength, 0);
      }
    }
  }

  draw() {
    const image = this.animation.image();
    if (image) {
      image.width = this.width;
      image.height = this.height;
      game.context.drawImage(
        image, 
        this.x - (this.width / 2.0),
        this.y - (this.height / 2.0),
        this.width, this.height
      );
    }
  }

  setDirection(direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.animation = this.direction === FACE_LEFT ? this.leftAnimation : this.rightAnimation;
    this.animation.reset();
  }

  hit(strength) {
    this.health -= strength;
    game.objects.push(
      new DamageTakenText(
        strength, this.x, this.y
      )
    );
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    game.enemiesDestroyed += 1;
    game.objects.push(new Candy(this.x, this.y));
  }
}

/**
 * 糖果类（经验值道具）
 */
class Candy {
  constructor(x, y) {
    this.image = game.images.eggDroppedImage;
    this.x = x;
    this.y = y;
    this.attractRadius = 200;
    this.pickupRadius = 50;
    this.scoreValue = 20; // 每个糖果值20分
    this.destroyed = false;
  }

  update() {
    if (this.destroyed) return;

    if (game.player && pointInCircle(this.x, this.y, game.player.x, game.player.y, this.pickupRadius)) {
      this.pickup();
      return;
    }

    if (game.player && pointInCircle(this.x, this.y, game.player.x, game.player.y, this.attractRadius)) {
      this.x = lerp(this.x, game.player.x, 0.1);
      this.y = lerp(this.y, game.player.y, 0.1);
    }
  }

  draw() {
    if (this.image) {
      game.context.drawImage(
        this.image,
        this.x - (this.image.width / 2),
        this.y - (this.image.height / 2),
        this.image.width, this.image.height
      );
    }
  }

  pickup() {
    if (this.destroyed) return;
    this.destroyed = true;
    // 增加玩家分数
    if (game.player) {
      game.player.score = (game.player.score || 0) + this.scoreValue;
      // 创建分数提示文本
      game.objects.push(
        new ScoreText(
          `+${this.scoreValue}`,
          this.x,
          this.y
        )
      );

      // 10%概率触发愤怒状态
      if (Math.random() < 0.1) {
        game.objects.forEach(obj => {
          if (obj instanceof Enemy) {
            obj.enrage();
          }
        });
      }
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
  }
}

/**
 * 伤害文本类
 */
class DamageTakenText {
  constructor(text, x, y) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.framesCount = 0;
    this.growAnimationFrames = 40;
    this.fadeAnimationFrames = 60;
    this.fontSize = 10;
    this.fontOpacity = 1;
    this.growToSize = 32;
    this.fillStyle = 'white';
    this.strokeColor = 'black';
    this.destroyed = false;
  }

  update() {
    this.y -= 0.5;
    
    if (this.framesCount < this.growAnimationFrames) {
      this.fontSize = lerp(this.fontSize, this.growToSize, 0.4);
    } else if (this.framesCount < this.growAnimationFrames + this.fadeAnimationFrames) {
      this.fontOpacity = lerp(this.fontOpacity, 0, 0.25);
    } else {
      this.destroyed = true;
    }
    
    this.framesCount += 1;
  }

  draw() {
    // 保存当前上下文状态
    game.context.save();
    
    // 设置字体和样式
    game.context.font = `${this.fontSize}px monospace`;
    game.context.fillStyle = this.fillStyle;
    game.context.strokeStyle = this.strokeColor;
    game.context.globalAlpha = this.fontOpacity;
    
    // 绘制文本
    game.context.fillText(this.text, this.x, this.y);
    
    // 恢复上下文状态
    game.context.restore();
  }
}

/**
 * 武器基类
 */
class Weapon {
  constructor(speed, animationFrames, strength) {
    this.attackSpeed = speed; // ms
    this.attackAnimationFrames = animationFrames;
    this.attackStrength = strength;
    this.lastAttackTime = Date.now();
    this.attacking = false;
    this.attackFramesPassed = 0;
    this.updateFramesPassed = 0;
  }

  update() {
    const msSinceLastAttack = Date.now() - this.lastAttackTime;
    
    if (msSinceLastAttack > this.attackSpeed) {
      this.attacking = true;
      this.lastAttackTime = Date.now();
    }
    
    if (this.attacking) {
      this.attackFramesPassed += 1;
      if (this.attackFramesPassed >= this.attackAnimationFrames) {
        this.attacking = false;
        this.attackFramesPassed = 0;
      }
    }
    
    this.updateFramesPassed += 1;
  }

  draw() {}

  firstAttackFrame() {
    return this.attacking && this.attackFramesPassed === 1;
  }
}

/**
 * 麦克风武器
 */
class MicWeapon extends Weapon {
  constructor() {
    const attackSpeed = 1000; // ms
    const attackAnimationFrames = 5;
    const attackStrength = 1;
    super(attackSpeed, attackAnimationFrames, attackStrength);
    this.level = 8;
    this.radius = 100;
    this.image = game.images.iphoneImage;
    this.angle = 0;
    this.enemiesHit = {};
    this.x = 0;
    this.y = 0;
  }

  update() {
    if (!game.player) return;
    
    this.angle = (this.angle + (0.02 * this.level)) % 360; // 降低旋转速度
    this.x = game.player.x + Math.sin(this.angle) * this.radius;
    this.y = game.player.y + Math.cos(this.angle) * this.radius;
    
    for (const object of game.objects) {
      if (object instanceof Enemy) {
        if (
          object.id in this.enemiesHit &&
          ((new Date()) - this.enemiesHit[object.id]) < this.attackSpeed
        ) {
          continue;
        }

        if (
          this.x > object.x - 50 &&
          this.x < object.x + 50 &&
          this.y > object.y - 50 &&
          this.y < object.y + 50
        ) {
          object.hit(this.attackStrength);
          this.enemiesHit[object.id] = new Date();
        }
      }
    }
  }

  draw() {
    if (!game.player || !this.image) return;
    
    // 保存上下文
    game.context.save();
    
    // 绘制连接线
    game.context.beginPath();
    game.context.moveTo(game.player.x, game.player.y);
    game.context.lineTo(this.x, this.y);
    game.context.closePath();
    game.context.stroke();
    
    // 绘制麦克风
    game.context.translate(10, 0);
    game.context.setTransform(-1, 0, 0, -1, this.x, this.y);
    game.context.rotate(-this.angle);
    game.context.drawImage(
      this.image,
      -this.image.width / 2, -this.image.height / 2
    );
    
    // 恢复上下文
    game.context.restore();
  }
}

/**
 * 可收集的球
 */
class CollectibleBall {
  constructor() {
    this.animation = new Animation([
      { time: 12, image: game.images.babycrocImage1 },
      { time: 12, image: game.images.babycrocImage2 },
    ]);
    // 在地图范围内随机生成
    this.x = randomRange(0, WORLD_WIDTH);
    this.y = randomRange(0, WORLD_HEIGHT);
    this.scoreValue = 100; // 收集后获得的分数
    this.radius = 40; // 碰撞检测半径
    this.destroyed = false;
  }

  update() {
    if (this.destroyed) return;
    
    this.animation.update();
    
    // 检查是否被玩家收集
    if (game.player && pointInCircle(game.player.x, game.player.y, this.x, this.y, this.radius)) {
      this.collect();
    }
  }

  draw() {
    const image = this.animation.image();
    if (image) {
      game.context.drawImage(
        image,
        this.x - (image.width / 3.2),
        this.y - (image.height / 3.2),
        image.width / 2.0, 
        image.height / 2.0
      );
    }
  }

  collect() {
    if (this.destroyed) return;
    this.destroyed = true;
    // 增加玩家分数
    if (game.player) {
      game.player.score = (game.player.score || 0) + this.scoreValue;
      // 创建分数提示文本
      game.objects.push(
        new ScoreText(
          `+${this.scoreValue}`, 
          this.x, 
          this.y
        )
      );

      // 10%概率触发愤怒状态
      if (Math.random() < 0.1) {
        game.objects.forEach(obj => {
          if (obj instanceof Enemy) {
            obj.enrage();
          }
        });
      }
    }
  }
}

/**
 * 分数提示文本
 */
class ScoreText {
  constructor(text, x, y) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.lifespan = 60; // 持续60帧
    this.destroyed = false;
  }

  update() {
    this.lifespan--;
    this.y -= 1; // 向上飘动
    if (this.lifespan <= 0) {
      this.destroyed = true;
    }
  }

  draw() {
    game.context.save();
    game.context.fillStyle = '#FFD700'; // 金色
    game.context.font = '20px Arial';
    game.context.textAlign = 'center';
    game.context.fillText(this.text, this.x, this.y);
    game.context.restore();
  }
}

// 创建全局游戏实例
const game = new Game(); 