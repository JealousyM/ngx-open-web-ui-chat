import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-message-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-actions.component.html',
  styleUrls: ['./message-actions.component.scss']
})
export class MessageActionsComponent {
  public isLoading = input<boolean>(false);
  public isLatest = input<boolean>(false);
  public ratingValue = input<number | undefined>();
  public translations = input.required<Translation>();
  
  public continue = output<void>();
  public regenerate = output<void>();
  public rateGood = output<void>();
  public rateBad = output<void>();
  
  public onContinue(): void {
    this.continue.emit();
  }
  
  public onRegenerate(): void {
    this.regenerate.emit();
  }
  
  public onRateGood(): void {
    this.rateGood.emit();
  }
  
  public onRateBad(): void {
    this.rateBad.emit();
  }
}
