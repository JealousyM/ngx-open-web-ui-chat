import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnChanges {
  @Input() public isOpen = false;
  @Input() public title?: string;
  @Input() public message?: string;
  @Input() public confirmText?: string;
  @Input() public cancelText?: string;
  @Input() public translations?: Translation;

  @Output() public confirmed = new EventEmitter<void>();
  @Output() public cancelled = new EventEmitter<void>();

  private previousFocusedElement: HTMLElement | null = null;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.previousFocusedElement = document.activeElement as HTMLElement;
        setTimeout(() => {
          const cancelButton = document.querySelector('.cancel-button') as HTMLElement;
          cancelButton?.focus();
        }, 0);
      } else if (changes['isOpen'].previousValue) {
        this.restoreFocus();
      }
    }
  }

  public onConfirm(): void {
    this.confirmed.emit();
  }

  public onCancel(): void {
    this.cancelled.emit();
  }

  public onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  public onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  private restoreFocus(): void {
    if (this.previousFocusedElement) {
      this.previousFocusedElement.focus();
      this.previousFocusedElement = null;
    }
  }
}
