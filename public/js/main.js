/**
 * 主入口文件
 * 负责管理游戏流程和界面切换
 */

// 初始化游戏状态
let currentState = GAME_STATE.LOADING;
let playerName = '';
let dialogSystem;

// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 初始化对话系统
  dialogSystem = new DialogSystem();
  
  // 绑定事件处理器
  bindEventHandlers();
  
  // 开始加载游戏资源
  loadGameResources();
});

/**
 * 绑定界面事件处理器
 */
function bindEventHandlers() {
  // 玩家名称输入界面 - 开始游戏按钮
  document.getElementById('start-game-button').addEventListener('click', () => {
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
  
  // 玩家名称输入界面 - 返回按钮
  document.getElementById('back-to-menu-button').addEventListener('click', () => {
    showMainMenu();
  });
  
  // 主菜单界面 - 进入游戏按钮
  document.getElementById('play-button').addEventListener('click', () => {
    showScreen('name-input');
    currentState = GAME_STATE.NAME_INPUT;
  });
  
  // 主菜单界面 - 排行榜按钮
  document.getElementById('leaderboard-button').addEventListener('click', () => {
    showLeaderboard();
  });
  
  // 排行榜界面 - 返回按钮
  document.getElementById('leaderboard-back-button').addEventListener('click', () => {
    showMainMenu();
  });
  
  // 游戏结束界面 - 再次游戏按钮
  document.getElementById('play-again-button').addEventListener('click', () => {
    startGame(playerName);
  });
  
  // 游戏结束界面 - 返回主菜单按钮
  document.getElementById('game-over-menu-button').addEventListener('click', () => {
    showMainMenu();
  });
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
  showScreen('main-menu');
  currentState = GAME_STATE.MAIN_MENU;
}

/**
 * 显示排行榜
 */
async function showLeaderboard() {
  showScreen('leaderboard-screen');
  currentState = GAME_STATE.LEADERBOARD;
  
  // 获取并渲染排行榜数据
  const leaderboardData = await fetchLeaderboard();
  renderLeaderboard(leaderboardData);
}

/**
 * 开始游戏
 */
function startGame(name) {
  // 隐藏其他界面
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // 初始化游戏
  game.init(name);
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