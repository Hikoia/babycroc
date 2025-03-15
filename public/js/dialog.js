/**
 * 对话系统处理
 */
class DialogSystem {
  constructor() {
    this.dialogQueue = [];
    this.currentDialog = null;
    this.isPlaying = false;
    this.avatarElement = document.getElementById('dialog-avatar-img');
    this.nameElement = document.getElementById('dialog-name');
    this.textElement = document.getElementById('dialog-text');
    this.dialogBox = document.querySelector('.dialog-box');
    
    // 绑定点击事件
    if (this.dialogBox) {
      this.dialogBox.addEventListener('click', () => this.nextDialog());
    }
  }
  
  /**
   * 设置对话序列
   */
  setDialogs(dialogs) {
    this.dialogQueue = [...dialogs];
    this.currentDialog = null;
    this.isPlaying = false;
    return this;
  }
  
  /**
   * 开始对话
   */
  startDialogs(onComplete) {
    this.onComplete = onComplete;
    if (this.dialogQueue.length === 0) {
      if (this.onComplete) this.onComplete();
      return this;
    }
    
    this.isPlaying = true;
    this.showNextDialog();
    return this;
  }
  
  /**
   * 显示下一个对话
   */
  showNextDialog() {
    if (!this.isPlaying || this.dialogQueue.length === 0) {
      this.isPlaying = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    
    this.currentDialog = this.dialogQueue.shift();
    
    // 更新头像
    if (this.avatarElement && this.currentDialog.avatar) {
      this.avatarElement.src = `assets/${this.currentDialog.avatar}`;
    }
    
    // 更新名称
    if (this.nameElement) {
      this.nameElement.textContent = this.currentDialog.name || '';
    }
    
    // 更新文本（使用动画效果）
    if (this.textElement) {
      const textAnimation = new TextAnimation({
        element: this.textElement,
        text: this.currentDialog.text || '',
        speed: 30
      });
      textAnimation.start();
    }
  }
  
  /**
   * 处理点击事件，进入下一个对话
   */
  nextDialog() {
    if (!this.isPlaying) return;
    
    // 如果文本正在动画中，则立即显示完整文本
    if (this.textElement && this.currentDialog && 
        this.textElement.textContent !== this.currentDialog.text) {
      this.textElement.textContent = this.currentDialog.text;
      return;
    }
    
    // 否则，显示下一个对话
    this.showNextDialog();
  }
  
  /**
   * 跳过所有对话
   */
  skipAllDialogs() {
    this.isPlaying = false;
    this.dialogQueue = [];
    if (this.onComplete) this.onComplete();
  }
} 