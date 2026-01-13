import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-attach-webpage-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attach-webpage-modal.component.html',
  styleUrls: ['./attach-webpage-modal.component.scss']
})
export class AttachWebpageModalComponent {
  public isVisible = input<boolean>(false);
  public isProcessing = signal<boolean>(false);
  public webpageUrl = signal<string>('');
  public errorMessage = signal<string | null>(null);
  public translations = input<Translation>({} as Translation);
  
  @Output() webpageAttached = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  public onSubmit(): void {
    const url = this.webpageUrl().trim();
    if (!url) {
      this.errorMessage.set('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      this.errorMessage.set('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    this.errorMessage.set(null);
    this.isProcessing.set(true);
    
    // Emit event to parent component to handle the actual processing
    this.webpageAttached.emit({
      url: url,
      collectionName: '' // Empty collection name as per the API spec
    });
  }

  public onClose(): void {
    this.resetForm();
    this.modalClosed.emit();
  }

  public onBackdropClick(event: Event): void {
    // Close modal when clicking on backdrop (outside the modal content)
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Close modal with Escape key
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  public resetForm(): void {
    this.webpageUrl.set('');
    this.errorMessage.set(null);
    this.isProcessing.set(false);
  }
}