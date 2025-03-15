/**
 * 动画处理类
 */
class Animation {
  constructor(frames) {
    this.frames = frames || [];
    this.currentIndex = 0;
    this.framesPassed = 0;
  }

  image() {
    if (this.frames.length === 0) return null;
    return this.frames[this.currentIndex].image;
  }

  reset() {
    this.currentIndex = 0;
    this.framesPassed = 0;
  }

  update(isIdle = false) {
    if (isIdle) {
      this.reset();
      return;
    }

    if (this.frames.length === 0) return;
    
    const currentFrame = this.frames[this.currentIndex];
    if (this.framesPassed >= currentFrame.time) {
      this.next();
    }
    this.framesPassed += 1;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.frames.length;
    this.framesPassed = 0;
  }
}

/**
 * 动画精灵图辅助类
 */
class SpriteAnimation {
  constructor(options) {
    this.spriteSheet = options.spriteSheet;
    this.frameWidth = options.frameWidth;
    this.frameHeight = options.frameHeight;
    this.frames = options.frames || 1;
    this.framesPerRow = options.framesPerRow || this.frames;
    this.frameRate = options.frameRate || 12;
    this.loop = options.loop !== undefined ? options.loop : true;
    
    this.currentFrame = 0;
    this.framesPassed = 0;
    this.isPlaying = false;
    this.onComplete = options.onComplete;
  }
  
  start() {
    this.isPlaying = true;
    this.currentFrame = 0;
    this.framesPassed = 0;
    return this;
  }
  
  stop() {
    this.isPlaying = false;
    return this;
  }
  
  update() {
    if (!this.isPlaying) return;
    
    if (this.framesPassed >= this.frameRate) {
      this.currentFrame++;
      this.framesPassed = 0;
      
      if (this.currentFrame >= this.frames) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames - 1;
          this.isPlaying = false;
          if (this.onComplete) this.onComplete();
        }
      }
    }
    
    this.framesPassed++;
  }
  
  draw(ctx, x, y, width, height) {
    if (!this.spriteSheet) return;
    
    const row = Math.floor(this.currentFrame / this.framesPerRow);
    const col = this.currentFrame % this.framesPerRow;
    
    const sourceX = col * this.frameWidth;
    const sourceY = row * this.frameHeight;
    
    ctx.drawImage(
      this.spriteSheet,
      sourceX, sourceY,
      this.frameWidth, this.frameHeight,
      x, y,
      width || this.frameWidth, height || this.frameHeight
    );
  }
}

/**
 * 文本动画效果
 */
class TextAnimation {
  constructor(options) {
    this.fullText = options.text || '';
    this.element = options.element;
    this.speed = options.speed || 50; // 每个字符的毫秒数
    this.delay = options.delay || 0;
    this.onComplete = options.onComplete;
    
    this.currentIndex = 0;
    this.timeoutId = null;
    this.isPlaying = false;
  }
  
  start() {
    if (this.isPlaying) return this;
    
    this.isPlaying = true;
    this.currentIndex = 0;
    
    if (this.element) {
      this.element.textContent = '';
    }
    
    if (this.delay > 0) {
      setTimeout(() => this.typeNextCharacter(), this.delay);
    } else {
      this.typeNextCharacter();
    }
    
    return this;
  }
  
  stop() {
    this.isPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.element) {
      this.element.textContent = this.fullText;
    }
    
    if (this.onComplete) {
      this.onComplete();
    }
    
    return this;
  }
  
  typeNextCharacter() {
    if (!this.isPlaying) return;
    
    if (this.currentIndex < this.fullText.length) {
      if (this.element) {
        this.element.textContent += this.fullText.charAt(this.currentIndex);
      }
      
      this.currentIndex++;
      this.timeoutId = setTimeout(() => this.typeNextCharacter(), this.speed);
    } else {
      this.isPlaying = false;
      if (this.onComplete) this.onComplete();
    }
  }
}

/**
 * 淡入淡出动画
 */
class FadeAnimation {
  constructor(options) {
    this.element = options.element;
    this.duration = options.duration || 1000; // 毫秒
    this.type = options.type || 'in'; // 'in' 或 'out'
    this.onComplete = options.onComplete;
    
    this.startTime = 0;
    this.isPlaying = false;
  }
  
  start() {
    if (this.isPlaying) return this;
    
    this.isPlaying = true;
    this.startTime = Date.now();
    
    // 设置初始状态
    if (this.element) {
      this.element.style.opacity = this.type === 'in' ? '0' : '1';
      this.element.style.display = 'block';
    }
    
    this.animate();
    return this;
  }
  
  stop() {
    this.isPlaying = false;
    
    if (this.element) {
      this.element.style.opacity = this.type === 'in' ? '1' : '0';
      if (this.type === 'out') {
        this.element.style.display = 'none';
      }
    }
    
    if (this.onComplete) {
      this.onComplete();
    }
    
    return this;
  }
  
  animate() {
    if (!this.isPlaying) return;
    
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    if (this.element) {
      this.element.style.opacity = this.type === 'in' ? progress : 1 - progress;
    }
    
    if (progress < 1) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.isPlaying = false;
      
      if (this.type === 'out' && this.element) {
        this.element.style.display = 'none';
      }
      
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }
} 