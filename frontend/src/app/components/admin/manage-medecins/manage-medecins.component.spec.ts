import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageMedecinsComponent } from './manage-medecins.component';

describe('ManageMedecinsComponent', () => {
  let component: ManageMedecinsComponent;
  let fixture: ComponentFixture<ManageMedecinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageMedecinsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageMedecinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
