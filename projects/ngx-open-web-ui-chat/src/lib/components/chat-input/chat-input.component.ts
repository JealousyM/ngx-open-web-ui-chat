import { Component, input, output, signal, ViewChild, ElementRef } from '@angular/core';
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
export class ChatInputComponent {
  public isLoading = input<boolean>(false);
  public uploadedFiles = input<UploadedFile[]>([]);
  public translations = input.required<Translation>();
  
  public inputMessage = signal('');
  public showFileMenu = signal(false);
  
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  
  public sendMessage = output<string>();
  public stopGeneration = output<void>();
  public fileSelected = output<Event>();
  public removeFile = output<string>();
  
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
}
