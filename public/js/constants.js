// 键盘按键常量
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;

// 方向常量
const FACE_LEFT = 0;
const FACE_RIGHT = 1;

// 游戏世界常量
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const MAX_OBJECTS = 25000;
const ENEMY_SPAWN_COUNT_PER_WAVE = 50;
const ENEMY_SPAWN_TIME_BETWEEN_WAVES = 5000; // ms

// 游戏状态常量
const GAME_STATE = {
  LOADING: 'loading',
  INTRO: 'intro',
  MAIN_MENU: 'main_menu',
  NAME_INPUT: 'name_input',
  LEADERBOARD: 'leaderboard',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};

// 介绍对话常量
const INTRO_DIALOGS = [
  {
    name: '引导者',
    avatar: 'avatar1.png',
    text: '欢迎来到"幸存者在线"的世界，这里曾经是一个繁荣的世界，但现在已经被亡灵占领。'
  },
  {
    name: '引导者',
    avatar: 'avatar1.png',
    text: '作为少数幸存者之一，你的任务是在这个危险的世界中生存下去。'
  },
  {
    name: '战士',
    avatar: 'avatar2.png',
    text: '你将使用你的武器与其他幸存者一起战斗，看谁能生存得更久。'
  },
  {
    name: '战士',
    avatar: 'avatar2.png',
    text: '消灭敌人，收集经验值，提升等级，解锁更强大的能力。但请记住，死亡是永久的。'
  },
  {
    name: '引导者',
    avatar: 'avatar1.png',
    text: '你准备好踏上这段危险的旅程了吗？让我们开始吧！'
  }
]; 