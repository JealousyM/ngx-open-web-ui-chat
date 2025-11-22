import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation } from '../../../i18n/translations';

@Component({
  selector: 'app-chat-history-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-history-header.component.html',
  styleUrls: ['./chat-history-header.component.scss']
})
export class ChatHistoryHeaderComponent {
  @Input() public translations?: Translation;
  
  @Output() public newChat = new EventEmitter<void>();
  @Output() public search = new EventEmitter<void>();

  public onNewChat(): void {
    this.newChat.emit();
  }

  public onSearch(): void {
    this.search.emit();
  }
}
