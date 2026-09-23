import { Component, inject, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { AsyncPipe } from '@angular/common';
import { EmrAvatarModule } from '@elementar/components';
import { MatBadge } from '@angular/material/badge';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { FeedbackService } from '@shared/services/feedback.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-toolbar',
  standalone: true,
  imports: [
    MatDivider,
    AsyncPipe,
    EmrAvatarModule,
    MatBadge,
    MatIcon,
    MatIconButton,
    MatTooltip
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent implements OnInit{

  private readonly uiFeedback = inject(FeedbackService);

  constructor(private route:Router,){}

  fullName:any;
  role:any;

  ngOnInit(): void {
    this.fullName = localStorage.getItem('full_name');
     this.role = localStorage.getItem('roles');
  }

  logoutHead(){
    this.uiFeedback.confirm(
      'Sign out of ERIS?',
      'You will be returned to the sign-in page.',
      {
        icon: 'warning',
        confirmButtonText: 'Yes, sign out',
        cancelButtonText: 'Stay signed in',
      },
    ).then((result) => {
      if (result.isConfirmed) {
        this.uiFeedback.success(
          'Signed out successfully',
          'Your ERIS session has been closed.',
        ).then(() => {
          localStorage.clear();
          this.route.navigate(['/']);
        });
      }
    });
  }

}
