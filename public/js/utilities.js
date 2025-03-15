/**
 * 辅助函数集合
 */

// 线性插值函数
function lerp(from, to, degree = 1) {
  return from + degree * (to - from);
}

// 将像素字符串转换为数字
function pxStrToNumber(value) {
  return Number(value.replace('px', ''));
}

// 测量文本尺寸
function measureTextDimensions(text, context) {
  const measure = context.measureText(text);
  return {
    width: measure.width,
    height: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent
  };
}

// 创建图像对象
function makeImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

// 计算自某个日期开始的时间
function timeSince(startDate) {
  const epochStart = epoch(startDate);
  const currentEpoch = epoch(new Date());
  return {
    minutes: Math.floor((currentEpoch - epochStart) / 60),
    seconds: (currentEpoch - epochStart) % 60,
  };
}

// 将时间转换为时分秒格式
function formatTime(minutes, seconds) {
  return `${leftPad(minutes, 2, 0)}:${leftPad(seconds, 2, 0)}`;
}

// 转换时间戳为秒
function epoch(date) {
  return Math.floor(date / 1000);
}

// 左填充
function leftPad(toPad, length, padChar) {
  const toPadStr = String(toPad);
  const toPadLength = toPadStr.length;
  if (toPadLength >= length) return toPad;
  return `${String(padChar).repeat(length - toPadLength)}${toPad}`;
}

// 随机范围
function randomRange(from, to) {
  return Math.random() * (to - from) + from;
}

// 随机正负
function randomNegate(value) {
  const multipler = Math.random() > 0.5 ? -1 : 1;
  return value * multipler;
}

/**
 * 检查点是否在圆内
 */
function pointInCircle(pointX, pointY, circleX, circleY, circleRadius) {
  let distance =
    Math.pow(circleX - pointX, 2) +
    Math.pow(circleY - pointY, 2);

  return distance < Math.pow(circleRadius, 2);
}

/**
 * 显示或隐藏指定屏幕
 */
function showScreen(screenId) {
  // 隐藏所有屏幕
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // 显示指定屏幕
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
  }
}

/**
 * 加载进度条更新
 */
function updateLoadingProgress(percent) {
  const progressBar = document.querySelector('.loading-progress');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
}

/**
 * Fetch leaderboard data
 */
async function fetchLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error);
    return [];
  }
}

/**
 * Submit score to leaderboard
 */
async function submitScore(playerName, score, survivedTime) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerName, score, survivedTime })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to submit score:', error);
    return null;
  }
}

/**
 * Render leaderboard
 */
function renderLeaderboard(leaderboardData) {
  const leaderboardList = document.getElementById('leaderboard-list');
  if (!leaderboardList) return;
  
  leaderboardList.innerHTML = '';
  
  if (leaderboardData.length === 0) {
    leaderboardList.innerHTML = '<div class="leaderboard-empty">No leaderboard data</div>';
    return;
  }
  
  leaderboardData.forEach((entry, index) => {
    const leaderboardItem = document.createElement('div');
    leaderboardItem.className = 'leaderboard-item';
    
    leaderboardItem.innerHTML = `
      <div class="leaderboard-rank">${index + 1}</div>
      <div class="leaderboard-name">${entry.playerName}</div>
      <div class="leaderboard-score">${entry.score}</div>
      <div class="leaderboard-time">${entry.survivedTime}</div>
    `;
    
    leaderboardList.appendChild(leaderboardItem);
  });
}

function spawnCandy(game) {
  // 随机生成糖果的位置
  const x = Math.random() * (game.canvas.width - 50);
  const y = Math.random() * (game.canvas.height - 50);
  
  // 创建糖果对象
  const candy = new Candy(x, y);
  candy.image = game.images.eggImage;
  
  // 将糖果添加到游戏对象列表中
  game.objects.push(candy);
} 