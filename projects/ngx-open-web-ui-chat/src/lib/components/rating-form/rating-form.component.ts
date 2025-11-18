import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';

@Component({
  selector: 'openwebui-rating-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-form.component.html',
  styleUrls: ['./rating-form.component.scss']
})
export class RatingFormComponent {
  public translations = input.required<Translation>();
  public initialRating = input.required<1 | -1>();
  public currentRating = input<number>(5);
  public currentTags = input<string[]>([]);
  public currentComment = input<string>('');
  
  public ratingValue = signal(5);
  public selectedTags = signal<string[]>([]);
  public comment = '';
  
  public close = output<void>();
  public submit = output<{ rating: number; tags: string[]; comment: string }>();
  
  constructor() {
    effect(() => {
      this.ratingValue.set(this.currentRating());
      this.selectedTags.set([...this.currentTags()]);
      this.comment = this.currentComment();
    });
  }
  
  get ratingNumbers(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  
  get ratingTags(): string[] {
    const t = this.translations();
    
    if (this.initialRating() === 1) {
      return [
        t.ratingTagAccurate ?? 'Accurate information',
        t.ratingTagFollowed ?? 'Followed instructions perfectly',
        t.ratingTagCreativity ?? 'Showcased creativity',
        t.ratingTagPositive ?? 'Positive attitude',
        t.ratingTagAttention ?? 'Attention to detail',
        t.ratingTagThorough ?? 'Thorough explanation',
        t.ratingTagOther ?? 'Other'
      ];
    } else {
      return [
        t.ratingTagDontLikeStyle ?? "Don't like the style",
        t.ratingTagTooVerbose ?? 'Too verbose',
        t.ratingTagNotHelpful ?? 'Not helpful',
        t.ratingTagNotFactual ?? 'Not factually correct',
        t.ratingTagDidntFollow ?? "Didn't fully follow instructions",
        t.ratingTagRefused ?? "Refused when it shouldn't have",
        t.ratingTagLazy ?? 'Being lazy',
        t.ratingTagOther ?? 'Other'
      ];
    }
  }
  
  public isRatingDisabled(num: number): boolean {
    if (this.initialRating() === 1) {
      return num <= 5;
    } else {
      return num >= 6;
    }
  }
  
  public setRating(num: number): void {
    if (!this.isRatingDisabled(num)) {
      this.ratingValue.set(num);
    }
  }
  
  public toggleTag(tag: string): void {
    this.selectedTags.update(tags => {
      if (tags.includes(tag)) {
        return tags.filter(t => t !== tag);
      } else {
        return [...tags, tag];
      }
    });
  }
  
  public isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }
  
  public onClose(): void {
    this.close.emit();
  }
  
  public onSubmit(): void {
    this.submit.emit({
      rating: this.ratingValue(),
      tags: this.selectedTags(),
      comment: this.comment
    });
  }
}
