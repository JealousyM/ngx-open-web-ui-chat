import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'demo-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-banner">
      <div class="container">
        <span class="icon">🚀</span>
        <div class="content">
          <strong>Interactive Demo</strong>
          <p>Test the ngx-open-web-ui-chat component with your OpenWebUI instance</p>
        </div>
        <div class="links">
          <a href="https://github.com/JealousyM/ngx-open-web-ui-chat" 
             target="_blank" 
             rel="noopener"
             class="btn btn-github">
            <span class="icon-github">⭐</span>
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/ngx-open-web-ui-chat" 
             target="_blank"
             rel="noopener" 
             class="btn btn-npm">
            📦 NPM
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .icon {
      font-size: 28px;
      animation: bounce 2s ease-in-out infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    
    .content {
      flex: 1;
      
      strong {
        font-size: 16px;
        display: block;
        margin-bottom: 2px;
        font-weight: 700;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        opacity: 0.95;
        font-weight: 400;
      }
    }
    
    .links {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .btn-github {
      .icon-github {
        font-size: 16px;
      }
    }
    
    @media (max-width: 768px) {
      .container {
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .content {
        flex: 1 1 100%;
        
        strong {
          font-size: 14px;
        }
        
        p {
          font-size: 12px;
        }
      }
      
      .links {
        flex: 1 1 100%;
        justify-content: center;
      }
      
      .btn {
        flex: 1;
        justify-content: center;
        font-size: 13px;
        padding: 6px 12px;
      }
    }
  `]
})
export class DemoBannerComponent {}

