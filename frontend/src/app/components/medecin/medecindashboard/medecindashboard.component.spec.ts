import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedecindashboardComponent } from './medecindashboard.component';

describe('MedecindashboardComponent', () => {
  let component: MedecindashboardComponent;
  let fixture: ComponentFixture<MedecindashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedecindashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedecindashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
