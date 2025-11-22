import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatHistoryHeaderComponent } from './chat-history-header.component';
import { getTranslation } from '../../../i18n/translations';

describe('ChatHistoryHeaderComponent', () => {
  let component: ChatHistoryHeaderComponent;
  let fixture: ComponentFixture<ChatHistoryHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatHistoryHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatHistoryHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit newChat event when new chat button is clicked', () => {
    const newChatSpy = jest.spyOn(component.newChat, 'emit');
    
    const button = fixture.nativeElement.querySelector('.new-chat-btn');
    button.click();
    
    expect(newChatSpy).toHaveBeenCalled();
  });

  it('should emit search event when search button is clicked', () => {
    const searchSpy = jest.spyOn(component.search, 'emit');
    
    const button = fixture.nativeElement.querySelector('.search-btn');
    button.click();
    
    expect(searchSpy).toHaveBeenCalled();
  });

  it('should display translated text when translations are provided', () => {
    const translations = getTranslation('en');
    component.translations = translations;
    fixture.detectChanges();
    
    const newChatBtn = fixture.nativeElement.querySelector('.new-chat-btn .btn-label');
    expect(newChatBtn.textContent).toBe('New Chat');
  });

  it('should display default text when translations are not provided', () => {
    component.translations = undefined;
    fixture.detectChanges();
    
    const newChatBtn = fixture.nativeElement.querySelector('.new-chat-btn .btn-label');
    expect(newChatBtn.textContent).toBe('New Chat');
  });

  it('should have proper ARIA labels for accessibility', () => {
    const newChatBtn = fixture.nativeElement.querySelector('.new-chat-btn');
    const searchBtn = fixture.nativeElement.querySelector('.search-btn');
    
    expect(newChatBtn.getAttribute('aria-label')).toBe('Create new chat');
    expect(searchBtn.getAttribute('aria-label')).toBe('Search chats');
  });

  it('should render SVG icons for both buttons', () => {
    const newChatSvg = fixture.nativeElement.querySelector('.new-chat-btn svg');
    const searchSvg = fixture.nativeElement.querySelector('.search-btn svg');
    
    expect(newChatSvg).toBeTruthy();
    expect(searchSvg).toBeTruthy();
  });

  it('should use translations for different languages', () => {
    const spanishTranslations = getTranslation('es');
    component.translations = spanishTranslations;
    fixture.detectChanges();
    
    const newChatBtn = fixture.nativeElement.querySelector('.new-chat-btn .btn-label');
    expect(newChatBtn.textContent).toBe('Nuevo Chat');
  });
});
