import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';
import { NoteItem } from '../../models/chat.model';

@Component({
  selector: 'app-notes-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-sidebar.component.html',
  styleUrls: ['./notes-sidebar.component.scss']
})
export class NotesSidebarComponent {
  @Input() public isOpen = false;
  @Input() public notes: NoteItem[] = [];
  @Input() public isLoading = false;
  @Input() public translations?: Translation;
  
  @Output() public noteSelected = new EventEmitter<string>();
  @Output() public createNote = new EventEmitter<void>();
  @Output() public deleteNote = new EventEmitter<string>();
  @Output() public close = new EventEmitter<void>();

  public searchQuery = signal('');

  public get filteredNotes(): NoteItem[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.notes;
    }
    
    return this.notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.data?.content?.md?.toLowerCase().includes(query)
    );
  }

  public onNoteClick(noteId: string): void {
    this.noteSelected.emit(noteId);
  }

  public onCreateNote(): void {
    this.createNote.emit();
  }

  public onDeleteNote(noteId: string, event: Event): void {
    event.stopPropagation();
    this.deleteNote.emit(noteId);
  }

  public onClose(): void {
    this.close.emit();
  }

  public formatDate(timestamp: number | string): string {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp > 100000000000000) {
      date = new Date(timestamp / 1000000);
    } else if (timestamp > 10000000000) {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp * 1000);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.translations?.today || 'Today';
    } else if (diffDays === 1) {
      return this.translations?.yesterday || 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} ${this.translations?.daysAgo || 'days ago'}`;
    } else {
      return date.toLocaleDateString();
    }
  }

  public getPreview(note: NoteItem): string {
    const content = note.data?.content?.md || '';
    const maxLength = 100;
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  }
}
