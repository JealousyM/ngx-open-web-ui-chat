import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatSession, ChatCompletionRequest, OpenWebUIChatConfig } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class OpenWebUIService {
  private config = signal<OpenWebUIChatConfig | undefined>(undefined);
  private messageStream$?: Subject<string>;

  configure(config: OpenWebUIChatConfig): void {
    this.config.set(config);
    if (config.debug) {
      console.log('[OpenWebUI] Service configured:', { ...config, apiKey: '***' });
    }
  }

  createNewChat(): Observable<ChatSession> {
    this.debugLog('Creating new chat session');
    const url = `${this.config()?.endpoint?.replace(/\/$/, '')}/api/v1/chats/new`;
    
    return new Observable<ChatSession>(observer => {
      fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          chat:{
            models: [this.config()?.modelId],
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          observer.next(data as ChatSession);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Create chat error:', error);
          observer.error(error);
        });
    });
  }

  sendMessage(message: string, chatId?: string, conversationHistory?: Array<{ role: string; content: string }>): Observable<string> {
    this.debugLog('Sending message:', message);
    
    // Создаем новый Subject для каждого сообщения
    this.messageStream$ = new Subject<string>();
    
    const url = `${this.config()?.endpoint?.replace(/\/$/, '')}/api/chat/completions`;
    
    const messages = conversationHistory && conversationHistory.length > 0 
      ? [...conversationHistory, { role: 'user', content: message }]
      : [{ role: 'user', content: message }];
    
    const request: ChatCompletionRequest = {
      model: this.config()!.modelId,
      messages,
      stream: true
    };

    if (chatId) {
      (request as any).chat_id = chatId;
    }

    this.streamCompletion(url, request);
    return this.messageStream$.asObservable();
  }

  private streamCompletion(url: string, request: ChatCompletionRequest): void {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config()?.apiKey}`
      },
      body: JSON.stringify(request)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.body;
      })
      .then(body => {
        if (!body) {
          throw new Error('No response body');
        }
        
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = (): void => {
          reader.read().then(({ done, value }) => {
            if (done) {
              this.messageStream$?.complete();
              this.debugLog('Stream completed');
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    this.messageStream$?.next(content);
                  }
                } catch (e) {
                  this.debugLog('Error parsing stream data:', e);
                }
              }
            }

            processStream();
          }).catch(error => {
            this.debugLog('Stream error:', error);
            this.messageStream$?.error(error);
          });
        };

        processStream();
      })
      .catch(error => {
        this.debugLog('Fetch error:', error);
        this.messageStream$?.error(error);
      });
  }

  private debugLog(...args: any[]): void {
    if (this.config()?.debug) {
      console.log('[OpenWebUI]', ...args);
    }
  }

  getMessageStream(): Observable<string> {
    if (!this.messageStream$) {
      this.messageStream$ = new Subject<string>();
    }
    return this.messageStream$.asObservable();
  }

  async getModels(): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching models list');
    const url = `${cfg.endpoint?.replace(/\/$/, '')}/api/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    this.debugLog('Models fetched:', data);
    return data;
  }
}


