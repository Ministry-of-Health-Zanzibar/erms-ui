import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TalentProfileComponent } from './talent-profile.component';
import { UserService } from '../../../services/users/user.service';
import { FeedbackService } from '@shared/services/feedback.service';

describe('TalentProfileComponent', () => {
  let component: TalentProfileComponent;
  let fixture: ComponentFixture<TalentProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['getMyProfile', 'updateMyProfile']);
    userService.getMyProfile.and.returnValue(of({
      data: {
        id: 7,
        first_name: 'Asha',
        middle_name: 'Ali',
        last_name: 'Hassan',
        email: 'asha@example.test',
        phone_no: '+255777000000',
        address: 'Zanzibar',
        gender: 'Female',
        date_of_birth: '1990-01-02',
        roles: ['ROLE HOSPITAL USER'],
        hospitals: [{ hospital_name: 'LUMUMBA Hospital', hospital_role: 'Doctor' }],
      },
    }));

    await TestBed.configureTestingModule({
      imports: [TalentProfileComponent],
      providers: [
        { provide: UserService, useValue: userService },
        {
          provide: FeedbackService,
          useValue: { error: jasmine.createSpy('error'), toast: jasmine.createSpy('toast') },
        },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TalentProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the authenticated user profile into the form', () => {
    expect(userService.getMyProfile).toHaveBeenCalled();
    expect(component.profileForm.controls.first_name.value).toBe('Asha');
    expect(component.profileForm.controls.email.value).toBe('asha@example.test');
    expect(component.roles).toEqual(['ROLE HOSPITAL USER']);
  });
});
