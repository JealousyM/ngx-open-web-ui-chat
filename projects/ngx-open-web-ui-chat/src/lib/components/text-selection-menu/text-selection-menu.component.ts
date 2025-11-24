import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-text-selection-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-selection-menu.component.html',
  styleUrls: ['./text-selection-menu.component.scss']
})
export class TextSelectionMenuComponent {
  @Input() public x = 0;
  @Input() public y = 0;
  @Input() public translations!: Translation;
  @Output() public onAsk = new EventEmitter<void>();
  @Output() public onExplain = new EventEmitter<void>();
}
