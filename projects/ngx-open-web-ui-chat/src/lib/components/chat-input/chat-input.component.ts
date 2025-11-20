import { Component, input, output, signal, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';
import { UploadedFile } from '../../models/chat.model';

@Component({
  selector: 'openwebui-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss']
})
export class ChatInputComponent implements AfterViewChecked {
  private canvasEmitted = false;
  public isLoading = input<boolean>(false);
  public uploadedFiles = input<UploadedFile[]>([]);
  public translations = input.required<Translation>();
  public isRecording = input<boolean>(false);
  public isTranscribing = input<boolean>(false);
  public recordingError = input<string | null>(null);
  public transcriptionError = input<string | null>(null);
  public messageText = input<string>('');
  
  public inputMessage = signal('');
  public showFileMenu = signal(false);
  
  constructor() {
    effect(() => {
      const text = this.messageText();
      if (text !== this.inputMessage()) {
        this.inputMessage.set(text);
      }
    });
  }
  
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('spectrogramCanvas') spectrogramCanvas?: ElementRef<HTMLCanvasElement>;
  
  public sendMessage = output<string>();
  public stopGeneration = output<void>();
  public fileSelected = output<Event>();
  public removeFile = output<string>();
  public startVoiceRecording = output<void>();
  public stopVoiceRecording = output<void>();
  public retryTranscription = output<void>();
  public clearRecordingError = output<void>();
  public clearTranscriptionError = output<void>();
  public spectrogramCanvasReady = output<HTMLCanvasElement>();
  
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  public toggleFileMenu(): void {
    this.showFileMenu.update(v => !v);
  }
  
  public triggerFileUpload(): void {
    this.showFileMenu.set(false);
    this.fileInput?.nativeElement.click();
  }
  
  public onFileSelected(event: Event): void {
    this.fileSelected.emit(event);
  }
  
  public onRemoveFile(fileId: string): void {
    this.removeFile.emit(fileId);
  }
  
  public onSendMessage(): void {
    const message = this.inputMessage().trim();
    if (message) {
      this.sendMessage.emit(message);
      this.inputMessage.set('');
    }
  }
  
  public onStopGeneration(): void {
    this.stopGeneration.emit();
  }
  
  public onKeyEnter(): void {
    if (!this.isLoading()) {
      this.onSendMessage();
    }
  }
  
  public onStartVoiceRecording(): void {
    this.startVoiceRecording.emit();
  }
  
  public onStopVoiceRecording(): void {
    this.stopVoiceRecording.emit();
  }
  
  public onRetryTranscription(): void {
    this.retryTranscription.emit();
  }
  
  public onClearRecordingError(): void {
    this.clearRecordingError.emit();
  }
  
  public onClearTranscriptionError(): void {
    this.clearTranscriptionError.emit();
  }
  
  public ngAfterViewChecked(): void {
    if (this.isRecording() && this.spectrogramCanvas && !this.canvasEmitted) {
      const canvas = this.spectrogramCanvas.nativeElement;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.spectrogramCanvasReady.emit(canvas);
        this.canvasEmitted = true;
      }
    } else if (!this.isRecording()) {
      this.canvasEmitted = false;
    }
  }
}
