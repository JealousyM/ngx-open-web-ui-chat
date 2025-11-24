import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-ask-explain-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './ask-explain-modal.component.html',
  styleUrls: ['./ask-explain-modal.component.scss']
})
export class AskExplainModalComponent implements AfterViewChecked {
  @Input() public mode: 'ask' | 'explain' = 'explain';
  @Input() public response = '';
  @Input() public isLoading = false;
  @Input() public translations!: Translation;
  @Output() public onClose = new EventEmitter<void>();
  @Output() public onAsk = new EventEmitter<string>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  question = '';

  public get title(): string {
    return this.mode === 'ask' 
      ? (this.translations?.askQuestion || 'Ask')
      : (this.translations?.explain || 'Explain');
  }

  public get placeholder(): string {
    return this.translations?.askPlaceholder || 'Ask a question about the selected text...';
  }

  public submitQuestion(): void {
    if (this.question.trim() && !this.isLoading) {
      this.onAsk.emit(this.question);
    }
  }

  public ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
