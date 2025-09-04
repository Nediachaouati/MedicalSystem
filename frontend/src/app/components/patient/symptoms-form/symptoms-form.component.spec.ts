import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsFormComponent } from './symptoms-form.component';

describe('SymptomsFormComponent', () => {
  let component: SymptomsFormComponent;
  let fixture: ComponentFixture<SymptomsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymptomsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymptomsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
