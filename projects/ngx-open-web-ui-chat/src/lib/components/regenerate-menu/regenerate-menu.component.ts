import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-regenerate-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './regenerate-menu.component.html',
  styleUrls: ['./regenerate-menu.component.scss']
})
export class RegenerateMenuComponent {
  public isLoading = input<boolean>(false);
  public translations = input.required<Translation>();
  
  public customInput = signal('');
  
  public customRegenerate = output<string>();
  public tryAgain = output<void>();
  public moreConcise = output<void>();
  public addDetails = output<void>();
  
  public onCustomRegenerate(): void {
    const input = this.customInput().trim();
    if (input) {
      this.customRegenerate.emit(input);
      this.customInput.set('');
    }
  }
  
  public onTryAgain(): void {
    this.tryAgain.emit();
  }
  
  public onMoreConcise(): void {
    this.moreConcise.emit();
  }
  
  public onAddDetails(): void {
    this.addDetails.emit();
  }
}
