import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'openwebui-error-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-banner.component.html',
  styleUrls: ['./error-banner.component.scss']
})
export class ErrorBannerComponent {
  public message = input.required<string>();
  public closeTitle = input<string>('Close');
  
  public close = output<void>();
  
  public onClose(event?: Event): void {
    event?.stopPropagation();
    this.close.emit();
  }
}
