import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteEditorComponent } from './note-editor.component';

describe('NoteEditorComponent', () => {
  let component: NoteEditorComponent;
  let fixture: ComponentFixture<NoteEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteEditorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NoteEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit save event with title and content', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.noteTitle.set('Test Note');
    component.noteContent.set('Test content');
    
    component.onSave();
    
    expect(saveSpy).toHaveBeenCalledWith({
      title: 'Test Note',
      content: 'Test content'
    });
  });

  it('should emit close event', () => {
    const closeSpy = spyOn(component.close, 'emit');
    
    component.onClose();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should populate fields when note is provided', () => {
    const mockNote: any = {
      id: '123',
      title: 'My Note',
      data: {
        content: {
          md: '# Hello World',
          html: '',
          json: null
        }
      }
    };
    
    component.note = mockNote;
    component.ngOnChanges();
    
    expect(component.noteTitle()).toBe('My Note');
    expect(component.noteContent()).toBe('# Hello World');
  });
});
