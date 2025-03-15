/**
 * 游戏主要类
 */
class Game {
  constructor() {
    // 基本配置
    this.canvas = document.getElementById('canvas');
    this.canvasContainer = document.getElementById('canvas-container');
    this.context = this.canvas.getContext('2d');
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
    
    // 输入状态
    this.input = {
      right: false,
      left: false,
      up: false,
      down: false,
    };
    
    // 网络相关
    this.socket = null;
    
    // 资源加载
    this.images = {
      playerImageLeft: makeImage('/images/player-1.L.png'),
      playerImageLeft2: makeImage('/images/player-2.L.png'),
      playerImageRight: makeImage('/images/player-1.png'),
      playerImageRight2: makeImage('/images/player-2.png'),
      skeletonImageLeft: makeImage('/images/skeleton-1.L.png'),
      skeletonImageLeft2: makeImage('/images/skeleton-2.L.png'),
      skeletonImageRight: makeImage('/images/skeleton-1.png'),
      skeletonImageRight2: makeImage('/images/skeleton-2.png'),
      ballImage1: makeImage('/images/ball-1.png'),
      ballImage2: makeImage('/images/ball-2.png'),
      candyDroppedImage: makeImage('/images/candy-dropped.png'),
      candyImage: makeImage('/images/candy.png'),
      micImage: makeImage('/images/mic.png'),
      floorImage: makeImage('/images/floor.png')
    };
    
    // 绑定按键事件
    this.bindKeyEvents();
  }
  
  /**
   * 初始化游戏
   */
  init(playerName) {
    this.playerName = playerName;
    
    // 初始化Socket.io连接
    this.initSocketConnection();
    
    // 显示游戏画布
    this.canvasContainer.classList.remove('hidden');
    
    return this;
  }
  
  /**
   * 初始化Socket.io连接
   */
  initSocketConnection() {
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
    if (this.gameRunning) return;
    
    this.gameRunning = true;
    this.levelRunStart = new Date();
    this.gameIntervalId = setInterval(
      () => this.gameLoop(), 1000 / this.targetFps
    );
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
    
    // 生成敌人
    this.spawnEnemies();
    
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
    }
    
    const ENEMY_SPAWN_TIME_BETWEEN_WAVES = 5000; // 5秒生成一波
    const ENEMY_SPAWN_COUNT_PER_WAVE = 10; // 每波10个敌人
    const MAX_OBJECTS = 500; // 最大对象数量限制
    
    if (Date.now() - this.lastEnemySpawnTime < ENEMY_SPAWN_TIME_BETWEEN_WAVES) {
      return;
    }
    
    if (this.objects.length > MAX_OBJECTS) {
      return;
    }
    
    // 如果玩家存在，在玩家周围生成敌人
    if (this.player) {
      for (let i = 0; i < ENEMY_SPAWN_COUNT_PER_WAVE; i++) {
        const radius = randomRange(900, 1200);
        const angle = randomRange(0, Math.PI * 2);
        const randX = this.player.x + Math.sin(angle) * radius;
        const randY = this.player.y + Math.cos(angle) * radius;
        this.objects.push(new Enemy(randX, randY));
      }
      
      this.lastEnemySpawnTime = Date.now();
    }
  }
  
  /**
   * 处理游戏结束
   */
  handleGameOver() {
    this.stopGame();
    
    // 计算分数和存活时间
    const timer = timeSince(this.levelRunStart);
    const survivedTime = formatTime(timer.minutes, timer.seconds);
    const finalScore = this.enemiesDestroyed * 10 + (timer.minutes * 60 + timer.seconds);
    
    // 更新游戏结束界面
    document.getElementById('survived-time').textContent = survivedTime;
    document.getElementById('final-score').textContent = finalScore;
    
    // 提交分数
    this.submitPlayerScore(finalScore, survivedTime);
    
    // 显示游戏结束界面
    showScreen('game-over');
    
    // 隐藏游戏画布
    this.canvasContainer.classList.add('hidden');
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
    if (!this.player) return;
    
    // 计算游戏时间
    const timer = timeSince(this.levelRunStart);
    
    // 绘制状态栏
    const texts = [
      `❤️: ${this.player.health}` +
      ` 💀: ${this.enemiesDestroyed}` +
      ` LV${this.player.level}` +
      ` ${leftPad(timer.minutes, 2, 0)}:${leftPad(timer.seconds, 2, 0)}`,
    ];
    
    const measures = texts.map(text => measureTextDimensions(text, this.context));
    
    this.guiTopMiddle((x, y) => {
      const width = Math.max(...measures.map(measure => measure.width));
      const height = measures.reduce((acc, measure) => acc + measure.height, 0);
      
      this.context.fillStyle = 'white';
      this.context.fillRect(
        x - (width / 2) - 10, y - height + 10,
        width + 20, height * 2 - 20
      );
      
      this.context.font = `24px monospace`;
      this.context.fillStyle = 'black';
      
      for (const [index, text] of texts.entries()) {
        this.context.fillText(
          text,
          x - (width / 2),
          y + (index * 30) + 10,
        );
      }
    });
    
    // 绘制经验条
    this.guiPosition(0, 0, (x, y) => {
      const currentXp = this.player.xp - this.player.prevLevelXp;
      const nextLevelXp = this.player.nextLevelXp - this.player.prevLevelXp;
      const percentage = !currentXp ? 0 : currentXp / nextLevelXp;
      
      this.context.fillStyle = 'black';
      this.context.fillRect(x, y, window.innerWidth, 26);
      
      this.context.fillStyle = 'blue';
      this.context.fillRect(
        x + 2, y + 2,
        (window.innerWidth - 4) * percentage,
        22
      );
    });
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
    this.level = 1;
    this.width = 30 * 2;
    this.height = 33 * 2;
    this.health = 50;
    this.speed = 3;
    this.items = [new MicWeapon(), new DiscoBallWeapon()];
    this.xp = 0;
    this.nextLevelXp = 10;
    this.prevLevelXp = 0;
    this.setDirection(FACE_LEFT);
  }

  update() {
    // 处理玩家移动
    if (game.input.right) this.x += this.speed;
    if (game.input.left) this.x -= this.speed;
    if (game.input.up) this.y -= this.speed;
    if (game.input.down) this.y += this.speed;
    
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

  gainXp(xp) {
    this.xp += xp;
    if (this.xp >= this.nextLevelXp) this.levelUp();
  }

  levelUp() {
    this.level += 1;
    this.prevLevelXp = this.nextLevelXp;
    this.nextLevelXp = this.nextLevelXp * 2.5;
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
      { time: 100, image: game.images.skeletonImageLeft },
      { time: 100, image: game.images.skeletonImageLeft2 },
    ]);
    this.rightAnimation = new Animation([
      { time: 100, image: game.images.skeletonImageRight },
      { time: 100, image: game.images.skeletonImageRight2 },
    ]);
    this.idle = false;
    this.x = x;
    this.prevX = x;
    this.y = y;
    this.prevY = y;
    this.width = 30 * 2;
    this.height = 33 * 2;
    this.speed = 0.4;
    this.health = 3;
    this.attackStrength = 1;
    this.attackSpeed = 500; // ms
    this.lastAttackTime = Date.now();
    this.destroyed = false;
    this.setDirection(FACE_LEFT);
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    // 处理死亡状态
    if (this.health <= 0) {
      this.destroy();
      return;
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
    this.image = game.images.candyDroppedImage;
    this.x = x;
    this.y = y;
    this.attractRadius = 200;
    this.pickupRadius = 50;
    this.xp = 1;
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
    this.destroy();
    if (game.player) {
      game.player.gainXp(this.xp);
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
 * 迪斯科球武器
 */
class DiscoBallWeapon extends Weapon {
  constructor() {
    const attackSpeed = 14000; // ms
    const attackAnimationFrames = 5;
    super(attackSpeed, attackAnimationFrames);
    this.level = 4;
  }

  spawnCount() {
    return this.level;
  }

  update() {
    super.update();
    if (this.firstAttackFrame()) {
      const spawnCount = this.spawnCount();
      for (var i = 0; i < spawnCount; i++) {
        setTimeout(() => {
          game.objects.push(
            new DiscoPool()
          );
        }, i * (700 + randomRange(0, 100)));
      }
    }
  }

  draw() {}
}

/**
 * 迪斯科球效果
 */
class DiscoPool extends Weapon {
  constructor() {
    const speed = 2000;
    const animationFrames = 5;
    const strength = 1;
    super(speed, animationFrames, strength);
    this.updateFrames = 60 * 10;
    this.animation = new Animation([
      { time: 12, image: game.images.ballImage1 },
      { time: 12, image: game.images.ballImage2 },
    ]);
    this.x = game.player.x + randomRange(-300, 300);
    this.y = game.player.y + randomRange(-300, 300);
    this.fillStyle = 'rgb(225, 180, 255)';
    this.opacity = 0.7;
    this.radius = 80;
    this.destroyed = false;
  }

  update() {
    super.update();
    this.animation.update();
    
    if (this.updateFramesPassed > this.updateFrames) {
      this.destroyed = true;
    }
    
    this.opacity = lerp(this.opacity, 0, 0.002);

    if (this.firstAttackFrame()) {
      // 检查敌人是否在范围内
      for (const object of game.objects) {
        if (object instanceof Enemy) {
          if (!pointInCircle(object.x, object.y, this.x, this.y, this.radius)) continue;
          object.hit(this.attackStrength);
        }
      }
    }
  }

  draw() {
    // 保存上下文
    game.context.save();
    
    // 设置样式
    game.context.fillStyle = this.fillStyle;
    game.context.globalAlpha = this.opacity;
    
    // 绘制圆形
    game.context.beginPath();
    game.context.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, Math.PI * 2);
    game.context.fill();
    
    // 恢复上下文
    game.context.restore();

    // 绘制动画
    const image = this.animation.image();
    if (image) {
      game.context.drawImage(
        image,
        this.x - (image.width / 3.2),
        this.y - 140,
        image.width / 2.0, image.height / 2.0
      );
    }
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
    this.image = game.images.micImage;
    this.angle = 0;
    this.enemiesHit = {};
    this.x = 0;
    this.y = 0;
  }

  update() {
    if (!game.player) return;
    
    this.angle = (this.angle + (0.05 * this.level)) % 360;
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

// 创建全局游戏实例
const game = new Game(); 