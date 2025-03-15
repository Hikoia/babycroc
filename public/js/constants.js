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
    name: 'PM Wombat',
    avatar: 'avatar1.png',
    text: "Crikey, mate! You can't just go 'round grabbing our wildlife! How'd you like it if we pinched your bald eagle chicks? Take a baby crocodile, see how you go!"
  },
  {
    name: 'Sane Jones',
    avatar: 'avatar2.png',
    text: "A baby crocodile? If that's what it takes to make amends, I'll do it. In another life, another chance, I want to be remembered for helping Australia, not harming it. I'll catch those baby crocodile and show everyone I've changed. I promise."
  },
  {
    name: 'Sane Jones',
    avatar: 'avatar2.png',
    text: "MWGA!!! Makes Wombat Great Again!!!"
  }
]; 