/**
 * Back Button Component for Silas Car Rentals
 * Provides consistent back button functionality across all pages
 */

class BackButton {
  constructor(options = {}) {
    this.options = {
      text: options.text || '← Back',
      position: options.position || 'top-left',
      style: options.style || 'default',
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.createButton();
    this.addStyles();
    this.bindEvents();
  }
  
  createButton() {
    // Create button element
    this.button = document.createElement('button');
    this.button.className = `back-button back-button--${this.options.style}`;
    this.button.innerHTML = this.options.text;
    this.button.setAttribute('aria-label', 'Go back to previous page');
    this.button.setAttribute('type', 'button');
    
    // Add to page
    this.addToPage();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .back-button {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        background: rgba(13, 17, 22, 0.9);
        color: #e8edf2;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .back-button:hover {
        background: rgba(13, 17, 22, 1);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .back-button:active {
        transform: translateY(0);
      }
      
      @media (max-width: 768px) {
        .back-button {
          top: 10px;
          left: 10px;
          padding: 6px 12px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  addToPage() {
    // Add button to body
    document.body.appendChild(this.button);
  }
  
  bindEvents() {
    this.button.addEventListener('click', () => {
      window.history.back();
    });
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only add back button if page doesn't have one
  const hasBackButton = document.querySelector('.back-button') || 
                       document.querySelector('[onclick*="history.back"]') ||
                       document.querySelector('[onclick*="window.history"]');
  
  if (!hasBackButton) {
    new BackButton();
  }
});
