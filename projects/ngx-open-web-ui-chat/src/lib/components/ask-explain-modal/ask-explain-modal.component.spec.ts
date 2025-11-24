import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AskExplainModalComponent } from './ask-explain-modal.component';
import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { translations } from '../../i18n/translations';

describe('AskExplainModalComponent', () => {
  let component: AskExplainModalComponent;
  let fixture: ComponentFixture<AskExplainModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AskExplainModalComponent, MarkdownModule.forRoot(), FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AskExplainModalComponent);
    component = fixture.componentInstance;
    component.translations = translations.en; // Set default translations
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct title for explain mode', () => {
    component.mode = 'explain';
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css('h3')).nativeElement;
    expect(title.textContent).toContain('Explain');
  });

  it('should display correct title for ask mode', () => {
    component.mode = 'ask';
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css('h3')).nativeElement;
    expect(title.textContent).toContain('Ask');
  });

  it('should emit onClose when close button is clicked', () => {
    jest.spyOn(component.onClose, 'emit');
    const closeBtn = fixture.debugElement.query(By.css('.close-btn'));
    closeBtn.triggerEventHandler('click', null);
    expect(component.onClose.emit).toHaveBeenCalled();
  });

  it('should emit onClose when overlay is clicked', () => {
    jest.spyOn(component.onClose, 'emit');
    const overlay = fixture.debugElement.query(By.css('.modal-overlay'));
    overlay.triggerEventHandler('click', null);
    expect(component.onClose.emit).toHaveBeenCalled();
  });

  it('should not emit onClose when content is clicked', () => {
    jest.spyOn(component.onClose, 'emit');
    const content = fixture.debugElement.query(By.css('.modal-content'));
    content.triggerEventHandler('click', new Event('click'));
    expect(component.onClose.emit).not.toHaveBeenCalled();
  });

  it('should show input in ask mode when no response', () => {
    component.mode = 'ask';
    component.response = '';
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input).toBeTruthy();
  });

  it('should not show input in explain mode', () => {
    component.mode = 'explain';
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input).toBeFalsy();
  });

  it('should emit onAsk with question when submit button is clicked', () => {
    component.mode = 'ask';
    fixture.detectChanges();
    
    jest.spyOn(component.onAsk, 'emit');
    component.question = 'Test question';
    fixture.detectChanges();
    
    const sendBtn = fixture.debugElement.query(By.css('.send-btn'));
    sendBtn.triggerEventHandler('click', null);
    
    expect(component.onAsk.emit).toHaveBeenCalledWith('Test question');
  });

  it('should disable send button when question is empty', () => {
    component.mode = 'ask';
    component.question = '';
    fixture.detectChanges();
    
    const sendBtn = fixture.debugElement.query(By.css('.send-btn'));
    expect(sendBtn.nativeElement.disabled).toBe(true);
  });

  it('should show loading indicator when isLoading is true', () => {
    component.isLoading = true;
    fixture.detectChanges();
    const loader = fixture.debugElement.query(By.css('.loading-indicator'));
    expect(loader).toBeTruthy();
  });

  it('should show response when response is provided', () => {
    component.response = 'Test response';
    fixture.detectChanges();
    const markdown = fixture.debugElement.query(By.css('markdown'));
    expect(markdown).toBeTruthy();
  });
});
