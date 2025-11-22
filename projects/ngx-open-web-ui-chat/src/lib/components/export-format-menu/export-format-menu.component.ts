import { Component, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation } from '../../i18n/translations';

export interface ExportMenuPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-export-format-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-format-menu.component.html',
  styleUrls: ['./export-format-menu.component.scss']
})
export class ExportFormatMenuComponent {
  public isOpen = input<boolean>(false);
  public position = input<ExportMenuPosition>({ x: 0, y: 0 });
  public translations = input<Translation>();
  
  public formatSelected = output<'json' | 'txt' | 'pdf'>();
  public closed = output<void>();
  
  private selectedIndex = signal(0);
  
  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    if (this.isOpen()) {
      this.closed.emit();
    }
  }
  
  @HostListener('document:keydown.arrowdown', ['$event'])
  public onArrowDown(event: KeyboardEvent): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.selectedIndex.update(i => (i + 1) % 3);
    }
  }
  
  @HostListener('document:keydown.arrowup', ['$event'])
  public onArrowUp(event: KeyboardEvent): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.selectedIndex.update(i => (i - 1 + 3) % 3);
    }
  }
  
  @HostListener('document:keydown.enter', ['$event'])
  public onEnterKey(event: KeyboardEvent): void {
    if (this.isOpen()) {
      event.preventDefault();
      const formats: ('json' | 'txt' | 'pdf')[] = ['json', 'txt', 'pdf'];
      this.selectFormat(formats[this.selectedIndex()]);
    }
  }
  
  public onOverlayClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }
  
  public selectFormat(format: 'json' | 'txt' | 'pdf'): void {
    this.formatSelected.emit(format);
  }
  
  public isSelected(index: number): boolean {
    return this.selectedIndex() === index;
  }
  
  public get jsonText(): string {
    return 'JSON';
  }
  
  public get txtText(): string {
    return 'TXT';
  }
  
  public get pdfText(): string {
    return 'PDF';
  }
}
