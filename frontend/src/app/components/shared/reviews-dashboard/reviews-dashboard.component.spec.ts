import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewsDashboardComponent } from './reviews-dashboard.component';

describe('ReviewsDashboardComponent', () => {
  let component: ReviewsDashboardComponent;
  let fixture: ComponentFixture<ReviewsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
