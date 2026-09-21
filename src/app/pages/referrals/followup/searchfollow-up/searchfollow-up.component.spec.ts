import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchfollowUpComponent } from './searchfollow-up.component';

describe('SearchfollowUpComponent', () => {
  let component: SearchfollowUpComponent;
  let fixture: ComponentFixture<SearchfollowUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchfollowUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchfollowUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
