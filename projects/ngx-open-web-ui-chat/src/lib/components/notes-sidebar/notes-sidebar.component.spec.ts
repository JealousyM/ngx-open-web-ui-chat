import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotesSidebarComponent } from './notes-sidebar.component';
import { NoteItem } from '../../models/chat.model';

describe('NotesSidebarComponent', () => {
  let component: NotesSidebarComponent;
  let fixture: ComponentFixture<NotesSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesSidebarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit noteSelected when note is clicked', () => {
    const spy = spyOn(component.noteSelected, 'emit');
    const noteId = 'test-note-123';
    
    component.onNoteClick(noteId);
    
    expect(spy).toHaveBeenCalledWith(noteId);
  });

  it('should emit createNote when create button is clicked', () => {
    const spy = spyOn(component.createNote, 'emit');
    
    component.onCreateNote();
    
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteNote with correct ID', () => {
    const spy = spyOn(component.deleteNote, 'emit');
    const event = new Event('click');
    const noteId = 'test-note-123';
    
    component.onDeleteNote(noteId, event);
    
    expect(spy).toHaveBeenCalledWith(noteId);
  });

  it('should filter notes by search query', () => {
    const mockNotes: NoteItem[] = [
      {
        id: '1',
        title: 'Test Note',
        data: { content: { md: 'Hello world', html: '', json: null } },
        user_id: 'user1',
        meta: null,
        access_control: {},
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000
      },
      {
        id: '2',
        title: 'Another Note',
        data: { content: { md: 'Different content', html: '', json: null } },
        user_id: 'user1',
        meta: null,
        access_control: {},
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000
      }
    ];
    
    component.notes = mockNotes;
    component.searchQuery.set('test');
    
    const filtered = component.filteredNotes;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Test Note');
  });

  it('should format date correctly', () => {
    const today = Math.floor(Date.now() / 1000);
    
    const result = component.formatDate(today);
    
    expect(result).toContain('Today');
  });

  it('should truncate long note preview', () => {
    const longContent = 'a'.repeat(150);
    const mockNote: NoteItem = {
      id: '1',
      title: 'Test',
      data: { content: { md: longContent, html: '', json: null } },
      user_id: 'user1',
      meta: null,
      access_control: {},
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };
    
    const preview = component.getPreview(mockNote);
    
    expect(preview.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(preview).toContain('...');
  });
});
