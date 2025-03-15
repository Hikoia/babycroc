/**
 * Dialog System Handler
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
    this.isAnimating = false;
    this.currentTextAnimation = null;
    this.lastClickTime = 0;
    this.clickCooldown = 500;
    
    // Bind click event
    if (this.dialogBox) {
      this.dialogBox.addEventListener('click', (e) => {
        e.preventDefault();  // Prevent default behavior
        e.stopPropagation();  // Stop event bubbling
        
        const currentTime = Date.now();
        // Check if within cooldown period
        if (currentTime - this.lastClickTime < this.clickCooldown) {
          return;
        }
        this.lastClickTime = currentTime;
        
        this.nextDialog();
      });
    }
  }
  
  /**
   * Set dialog sequence
   */
  setDialogs(dialogs) {
    this.dialogQueue = [...dialogs];
    this.currentDialog = null;
    this.isPlaying = false;
    this.isAnimating = false;
    if (this.currentTextAnimation) {
      this.currentTextAnimation.stop();
      this.currentTextAnimation = null;
    }
    return this;
  }
  
  /**
   * Start dialog sequence
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
   * Display next dialog
   */
  showNextDialog() {
    if (!this.isPlaying || this.dialogQueue.length === 0) {
      this.isPlaying = false;
      this.isAnimating = false;
      if (this.currentTextAnimation) {
        this.currentTextAnimation.stop();
        this.currentTextAnimation = null;
      }
      if (this.onComplete) this.onComplete();
      return;
    }
    
    this.currentDialog = this.dialogQueue.shift();
    
    // Update avatar
    if (this.avatarElement && this.currentDialog.avatar) {
      this.avatarElement.src = `assets/${this.currentDialog.avatar}`;
    }
    
    // Update name
    if (this.nameElement) {
      this.nameElement.textContent = this.currentDialog.name || '';
    }
    
    // Update text with animation
    if (this.textElement) {
      this.isAnimating = true;
      this.currentTextAnimation = new TextAnimation({
        element: this.textElement,
        text: this.currentDialog.text || '',
        speed: 30,
        onComplete: () => {
          this.isAnimating = false;
          this.currentTextAnimation = null;
        }
      });
      this.currentTextAnimation.start();
    }
  }
  
  /**
   * Handle click event and proceed to next dialog
   */
  nextDialog() {
    if (!this.isPlaying) return;
    
    if (this.isAnimating && this.currentTextAnimation) {
      this.currentTextAnimation.complete();
      this.isAnimating = false;
      return;
    }
    
    // Otherwise, show next dialog
    this.showNextDialog();
  }
  
  /**
   * Skip all remaining dialogs
   */
  skipAllDialogs() {
    this.isPlaying = false;
    this.isAnimating = false;
    if (this.currentTextAnimation) {
      this.currentTextAnimation.stop();
      this.currentTextAnimation = null;
    }
    this.dialogQueue = [];
    if (this.onComplete) this.onComplete();
  }
} 