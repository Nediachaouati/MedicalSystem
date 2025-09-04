import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSecretariesComponent } from './dashboard-secretaries.component';

describe('DashboardSecretariesComponent', () => {
  let component: DashboardSecretariesComponent;
  let fixture: ComponentFixture<DashboardSecretariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSecretariesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSecretariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
