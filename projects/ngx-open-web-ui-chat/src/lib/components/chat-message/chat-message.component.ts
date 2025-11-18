import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ChatMessage } from '../../models/chat.model';
import { Translation } from '../../i18n/translations';
import { MessageActionsComponent } from '../message-actions/message-actions.component';
import { RegenerateMenuComponent } from '../regenerate-menu/regenerate-menu.component';
import { RatingFormComponent } from '../rating-form/rating-form.component';

@Component({
  selector: 'openwebui-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    MarkdownModule,
    MessageActionsComponent,
    RegenerateMenuComponent,
    RatingFormComponent
  ],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent {
  public message = input.required<ChatMessage>();
  public enableMarkdown = input<boolean>(true);
  public isLoading = input<boolean>(false);
  public isLatest = input<boolean>(false);
  public showRegenerateMenu = input<boolean>(false);
  public showRatingForm = input<boolean>(false);
  public initialRatingType = input<1 | -1>(1);
  public translations = input.required<Translation>();
  
  public continueResponse = output<ChatMessage>();
  public toggleRegenerateMenu = output<ChatMessage>();
  public openRatingForm = output<{ message: ChatMessage; rating: 1 | -1 }>();
  public customRegenerate = output<{ message: ChatMessage; input: string }>();
  public tryAgain = output<ChatMessage>();
  public moreConcise = output<ChatMessage>();
  public addDetails = output<ChatMessage>();
  public closeRatingForm = output<void>();
  public submitRating = output<{ message: ChatMessage; rating: number; tags: string[]; comment: string }>();
  
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  public onContinue(): void {
    this.continueResponse.emit(this.message());
  }
  
  public onToggleRegenerateMenu(): void {
    this.toggleRegenerateMenu.emit(this.message());
  }
  
  public onOpenRatingForm(rating: 1 | -1): void {
    this.openRatingForm.emit({ message: this.message(), rating });
  }
  
  public onCustomRegenerate(input: string): void {
    this.customRegenerate.emit({ message: this.message(), input });
  }
  
  public onTryAgain(): void {
    this.tryAgain.emit(this.message());
  }
  
  public onMoreConcise(): void {
    this.moreConcise.emit(this.message());
  }
  
  public onAddDetails(): void {
    this.addDetails.emit(this.message());
  }
  
  public onCloseRatingForm(): void {
    this.closeRatingForm.emit();
  }
  
  public onSubmitRating(data: { rating: number; tags: string[]; comment: string }): void {
    this.submitRating.emit({ message: this.message(), ...data });
  }
}
