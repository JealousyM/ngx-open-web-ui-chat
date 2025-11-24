import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextSelectionMenuComponent } from './text-selection-menu.component';
import { By } from '@angular/platform-browser';
import { translations } from '../../i18n/translations';

describe('TextSelectionMenuComponent', () => {
  let component: TextSelectionMenuComponent;
  let fixture: ComponentFixture<TextSelectionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextSelectionMenuComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TextSelectionMenuComponent);
    component = fixture.componentInstance;
    component.translations = translations.en; // Set default translations
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should position the menu correctly based on inputs', () => {
    component.x = 100;
    component.y = 200;
    fixture.detectChanges();
    
    const menu = fixture.debugElement.query(By.css('.selection-menu')).nativeElement;
    expect(menu.style.left).toBe('100px');
    expect(menu.style.top).toBe('200px');
  });

  it('should emit onAsk when Ask button is clicked', () => {
    jest.spyOn(component.onAsk, 'emit');
    const askBtn = fixture.debugElement.queryAll(By.css('.menu-item'))[0];
    askBtn.triggerEventHandler('click', null);
    expect(component.onAsk.emit).toHaveBeenCalled();
  });

  it('should emit onExplain when Explain button is clicked', () => {
    jest.spyOn(component.onExplain, 'emit');
    const explainBtn = fixture.debugElement.queryAll(By.css('.menu-item'))[1];
    explainBtn.triggerEventHandler('click', null);
    expect(component.onExplain.emit).toHaveBeenCalled();
  });

  it('should display Ask and Explain buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent).toContain('Ask');
    expect(buttons[1].nativeElement.textContent).toContain('Explain');
  });
});
