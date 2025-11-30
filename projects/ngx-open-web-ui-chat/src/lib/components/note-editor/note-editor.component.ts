import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';
import { NoteItem } from '../../models/chat.model';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss']
})
export class NoteEditorComponent {
  @Input() public note: NoteItem | null = null;
  @Input() public translations?: Translation;
  
  @Output() public save = new EventEmitter<{ title: string; content: string }>();
  @Output() public close = new EventEmitter<void>();

  public noteTitle = signal('');
  public noteContent = signal('');
  public activeTab = signal<'write' | 'preview'>('write');

  public ngOnChanges() {
    if (this.note) {
      this.noteTitle.set(this.note.title);
      this.noteContent.set(this.note.data?.content?.md || '');
    } else {
      this.noteTitle.set('');
      this.noteContent.set('');
    }
  }

  public setActiveTab(tab: 'write' | 'preview') {
    this.activeTab.set(tab);
  }

  public insertFormatting(format: string) {
    const textarea = document.querySelector('.note-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.noteContent();
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText = '';
    let newCursorPos = 0;

    switch (format) {
      case 'bold':
        newText = `${before}**${selection || 'bold text'}**${after}`;
        newCursorPos = selection ? end + 4 : start + 2 + 9; // 9 is length of 'bold text'
        break;
      case 'italic':
        newText = `${before}_${selection || 'italic text'}_${after}`;
        newCursorPos = selection ? end + 2 : start + 1 + 11;
        break;
      case 'header':
        newText = `${before}### ${selection || 'Heading'}${after}`;
        newCursorPos = selection ? end + 4 : start + 4 + 7;
        break;
      case 'quote':
        newText = `${before}> ${selection || 'quote'}${after}`;
        newCursorPos = selection ? end + 2 : start + 2 + 5;
        break;
      case 'code':
        newText = `${before}\`${selection || 'code'}\`${after}`;
        newCursorPos = selection ? end + 2 : start + 1 + 4;
        break;
      case 'link':
        newText = `${before}[${selection || 'title'}](url)${after}`;
        newCursorPos = selection ? end + 7 : start + 1 + 5; // select 'url' part ideally, but simple cursor move for now
        break;
      case 'list-ul':
        newText = `${before}- ${selection || 'list item'}${after}`;
        newCursorPos = selection ? end + 2 : start + 2 + 9;
        break;
      case 'list-ol':
        newText = `${before}1. ${selection || 'list item'}${after}`;
        newCursorPos = selection ? end + 3 : start + 3 + 9;
        break;
      case 'task':
        newText = `${before}- [ ] ${selection || 'task item'}${after}`;
        newCursorPos = selection ? end + 6 : start + 6 + 9;
        break;
    }

    this.noteContent.set(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  public onSave() {
    this.save.emit({
      title: this.noteTitle(),
      content: this.noteContent()
    });
  }

  public onClose() {
    this.close.emit();
  }
}
