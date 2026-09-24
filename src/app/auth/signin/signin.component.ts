import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatError,
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { HDividerComponent } from '@elementar/components';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '@core/authentication/auth.service';
import { GlobalConstants } from '@shared/global-constants';
import { FeedbackService } from '@shared/services/feedback.service';
import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { InactivityService } from '../../services/accountants/inactivity.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatIcon,
    MatIconButton,
    MatSuffix,
    HDividerComponent,
    ReactiveFormsModule,
    MatError,
    MatTooltip,
    MatProgressSpinnerModule,
  ],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit {
  loginForm: any = FormGroup;
  loading = false;
  passwordVisible: boolean = false;
  lang: 'en' | 'sw' = 'en';

  showSupport=false;
showChat=false;


  constructor(
    private formBuilder: FormBuilder,
    private route: Router,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private uiFeedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    this.loginFormData();
  }

  public loginFormData() {
    this.loginForm = this.formBuilder.group({
      email: new FormControl(null, [
        Validators.required,
        Validators.pattern(GlobalConstants.emailRegex),
      ]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  // Function to toggle password visibility
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  loginSubmit() {
    this.loading = true;
    this.authService.loginAuthenticate(this.loginForm.value).subscribe(
      (response) => {
        this.loading = false;
        if (response && response.error) {
          // console.log('Server returned an error:', response.error);
        } else {
          if (response.statusCode != 401 && response.data.statusCode == 200) {
            localStorage.setItem('token', `Bearer ${response.data.token}`);
            if (response.data.login_status === '1') {
              this.authService.setPermissions(response.data.permissions);
              localStorage.setItem('user_id', response.data.user_id);
              localStorage.setItem('full_name', response.data.full_name);
              localStorage.setItem('email', response.data.email);
              if (response.data.hospital_info) {
                localStorage.setItem(
                  'hospital_info',
                  JSON.stringify(response.data.hospital_info)
                );
              }

              localStorage.setItem(
                'roles',
                response.data.roles[0]?.name || 'Default Role'
              );
              localStorage.setItem(
                'all_roles',
                JSON.stringify(response.data.roles || [])
              );

              localStorage.setItem('isLogin', 'true');

              this.uiFeedback.toast('Login successful.', 'success');
              this.route.navigateByUrl('pages');
            } else {
              this.uiFeedback.toast('Please change your password first.', 'warning', 6000);
              this.route.navigateByUrl('auth/set-new-password');
            }
          } else {
            this.uiFeedback.toast(response.message || 'Unable to sign in.', 'error', 6000);
            this.route.navigateByUrl('/');
          }
        }
      },
      (error) => {
        this.loading = false;
        this.uiFeedback.fire({
          title: 'Warning!',
          text: GlobalConstants.genericErrorConnectFail,
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
    );
  }
}
