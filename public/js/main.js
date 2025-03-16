/**
 * 主入口文件
 * 负责管理游戏流程和界面切换
 */

// Initialize game state
let currentState = GAME_STATE.LOADING;
let playerName = '';
let dialogSystem = null;

// When document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dialog system
  dialogSystem = new DialogSystem();
  
  // Bind event handlers
  bindEventHandlers();
  
  // Start loading game resources
  loadGameResources();

  const startButton = document.getElementById('start-game-button');
  const playerNameInput = document.getElementById('player-name');
  const loginScreen = document.getElementById('login-screen');
  const easterEgg = document.getElementById('easter-egg');
  const easterEggCloseButton = document.getElementById('easter-egg-close');
  const authorInfo = document.getElementById('author-info');
  const authorInfoCloseButton = document.getElementById('author-info-close');

  // 添加彩蛋关闭按钮事件
  easterEggCloseButton.addEventListener('click', () => {
    easterEgg.classList.add('hidden');
    playerNameInput.value = ''; // 清空输入
    playerNameInput.focus(); // 聚焦到输入框
  });
  
  // 添加作者信息关闭按钮事件
  authorInfoCloseButton.addEventListener('click', () => {
    authorInfo.classList.add('hidden');
    playerNameInput.value = ''; // 清空输入
    playerNameInput.focus(); // 聚焦到输入框
  });

  startButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    
    // 检查是否触发彩蛋
    if (playerName.toLowerCase() === 'wombat') {
      easterEgg.classList.remove('hidden');
      return;
    }
    
    // 检查是否触发作者信息彩蛋
    if (playerName.toLowerCase() === 'author') {
      authorInfo.classList.remove('hidden');
      return;
    }
    
    if (playerName) {
      loginScreen.classList.add('hidden');
      game.init(playerName);
    }
  });

  // 添加回车键支持
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const playerName = playerNameInput.value.trim();
      
      // 检查是否触发彩蛋
      if (playerName.toLowerCase() === 'wombat') {
        easterEgg.classList.remove('hidden');
        return;
      }
      
      // 检查是否触发作者信息彩蛋
      if (playerName.toLowerCase() === 'author') {
        authorInfo.classList.remove('hidden');
        return;
      }
      
      if (playerName) {
        loginScreen.classList.add('hidden');
        game.init(playerName);
      }
    }
  });
});

/**
 * 绑定界面事件处理器
 */
function bindEventHandlers() {
  // 彩蛋关闭按钮
  const easterEggCloseButton = document.getElementById('easter-egg-close');
  if (easterEggCloseButton) {
    easterEggCloseButton.addEventListener('click', () => {
      const easterEgg = document.getElementById('easter-egg');
      easterEgg.classList.add('hidden');
      const nameInput = document.getElementById('player-name');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    });
  }
  
  // 作者信息关闭按钮
  const authorInfoCloseButton = document.getElementById('author-info-close');
  if (authorInfoCloseButton) {
    authorInfoCloseButton.addEventListener('click', () => {
      const authorInfo = document.getElementById('author-info');
      authorInfo.classList.add('hidden');
      const nameInput = document.getElementById('player-name');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    });
  }

  // 主菜单界面按钮
  const playButton = document.getElementById('play-button');
  const leaderboardButton = document.getElementById('leaderboard-button');
  
  if (playButton) {
    playButton.addEventListener('click', () => {
      showScreen('name-input');
      currentState = GAME_STATE.NAME_INPUT;
    });
  }
  
  if (leaderboardButton) {
    leaderboardButton.addEventListener('click', () => {
      showLeaderboard();
    });
  }
  
  // 玩家名称输入界面按钮
  const startGameButton = document.getElementById('start-game-button');
  const backToMenuButton = document.getElementById('back-to-menu-button');
  
  if (startGameButton) {
    startGameButton.addEventListener('click', () => {
      const nameInput = document.getElementById('player-name');
      playerName = nameInput.value.trim();
      
      if (playerName) {
        startGame(playerName);
      } else {
        // 如果没有输入名字，提供默认名字
        playerName = 'Player' + Math.floor(Math.random() * 1000);
        nameInput.value = playerName;
      }
    });
  }
  
  if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => {
      showMainMenu();
    });
  }
  
  // 排行榜界面按钮
  const leaderboardBackButton = document.getElementById('leaderboard-back-button');
  if (leaderboardBackButton) {
    leaderboardBackButton.addEventListener('click', () => {
      showMainMenu();
    });
  }
  
  // 游戏结束界面按钮
  const gameOverMenuButton = document.getElementById('game-over-menu-button');
  const restartButton = document.getElementById('restart-button');
  
  if (gameOverMenuButton) {
    gameOverMenuButton.addEventListener('click', () => {
      // 隐藏游戏结束界面
      document.getElementById('game-over-screen').classList.add('hidden');
      // 显示主菜单
      showMainMenu();
    });
  }
  
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      // 隐藏游戏结束界面
      document.getElementById('game-over-screen').classList.add('hidden');
      // 重新开始游戏
      game.restart();
    });
  }
}

/**
 * 加载游戏资源
 */
async function loadGameResources() {
  // 这里可以加载游戏所需的资源
  // 例如图片、音频等
  
  // 模拟加载进度
  const totalSteps = 10;
  for (let i = 1; i <= totalSteps; i++) {
    updateLoadingProgress(i * 10);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 加载完成后，显示开场白
  startIntro();
}

/**
 * 开始游戏介绍
 */
function startIntro() {
  showScreen('intro-screen');
  currentState = GAME_STATE.INTRO;
  
  // 设置并开始对话
  dialogSystem
    .setDialogs(INTRO_DIALOGS)
    .startDialogs(() => {
      // 对话结束后显示主菜单
      showMainMenu();
    });
}

/**
 * 显示主菜单
 */
function showMainMenu() {
  // 清理游戏状态
  if (game) {
    game.cleanup();
    game.stopGame();
    // 隐藏游戏画布
    game.canvasContainer.classList.add('hidden');
    // 断开socket连接
    if (game.socket) {
      game.socket.disconnect();
      game.socket = null;
    }
  }
  
  // 隐藏其他界面
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('name-input').classList.add('hidden');
  document.getElementById('leaderboard-screen').classList.add('hidden');
  
  // 显示主菜单
  showScreen('main-menu');
  currentState = GAME_STATE.MAIN_MENU;
}

/**
 * Show leaderboard
 */
async function showLeaderboard() {
  showScreen('leaderboard-screen');
  currentState = GAME_STATE.LEADERBOARD;
  
  try {
    const response = await fetch('/api/leaderboard');
    const entries = await response.json();
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      
      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = `#${index + 1}`;
      
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = entry.playerName;
      
      const country = document.createElement('span');
      country.className = 'country';
      country.textContent = entry.country;
      
      const score = document.createElement('span');
      score.className = 'score';
      score.textContent = `Score: ${entry.score}`;
      
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = `Time: ${entry.survivedTime}s`;
      
      row.appendChild(rank);
      row.appendChild(name);
      row.appendChild(country);
      row.appendChild(score);
      row.appendChild(time);
      
      leaderboardList.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

/**
 * 开始游戏
 */
function startGame(playerName) {
  // 检查是否触发彩蛋
  const easterEgg = document.getElementById('easter-egg');
  if (playerName.toLowerCase() === 'wombat') {
    easterEgg.classList.remove('hidden');
    return;
  }
  
  // 检查是否触发作者信息彩蛋
  const authorInfo = document.getElementById('author-info');
  if (playerName.toLowerCase() === 'author') {
    authorInfo.classList.remove('hidden');
    return;
  }

  // 隐藏其他界面
  document.getElementById('name-input').classList.add('hidden');
  document.getElementById('main-menu').classList.add('hidden');
  
  // 初始化并开始游戏
  game.init(playerName);
  currentState = GAME_STATE.PLAYING;
}

/**
 * 处理窗口调整大小
 */
window.addEventListener('resize', () => {
  // 如果游戏正在运行，需要调整画布大小
  if (currentState === GAME_STATE.PLAYING) {
    // 可以在这里处理画布大小调整
  }
}); 