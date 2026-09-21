import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatBadge } from '@angular/material/badge';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import {
  EmrAvatarModule,
  IconComponent,
  SoundEffectDirective,
  ThemeManagerService,
  LayoutApiService,
  EmrPopoverModule
} from '@elementar/components';
import { NotificationListComponent } from '@layout/header/_notifications/notification-list/notification-list.component';
import { AssistantSearchComponent } from '@layout/header/_assistant-search/assistant-search.component';
import Swal from 'sweetalert2';
import { InactivityService } from '../../../services/accountants/inactivity.service';
import { ConversationService } from '../../../services/conversation.service'; 
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

// Import both conversational stream pop-up channels
import { MkurugenziConversationComponent } from '../../../pages/referrals/mkurugenzi-conversation/mkurugenzi-conversation.component';
import { ConversationModalComponent } from '../../../pages/referrals/conversation-modal/conversation-modal.component'; // Verify your directory location

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    MatIconButton,
    AsyncPipe,
    MatFormField,
    MatInput,
    MatPrefix,
    MatBadge,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    EmrAvatarModule,
    MatDivider,
    MatButton,
    MatTooltip,
    MatDialogModule,
    NotificationListComponent,
    EmrPopoverModule,
    RouterLink,
    AssistantSearchComponent,
    IconComponent,
    MatAnchor,
    SoundEffectDirective,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    class: 'block w-full h-full',
  },
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected _themeManager = inject(ThemeManagerService);
  private _layoutApi = inject(LayoutApiService);
  private conversationService = inject(ConversationService);
  private dialog = inject(MatDialog);
  private route = inject(Router);
  private inactivityService = inject(InactivityService);
  
  isDark = this._themeManager.isDark();

  @Input()
  sidebarHidden = false;

  fullName: string | null = null;
  emails: string | null = null;
  role: string | null = null;
  hospitalInfo: any[] = [];
  hospitalName: string = '';
  hospitalRole: string = '';

  unreadCount: number = 0;
  notificationsList: any[] = [];
  private pollingSubscription!: Subscription;

  toggleSidebar(): void {
    if (!this.sidebarHidden) {
      this._layoutApi.hideSidebar('root');
    } else {
      this._layoutApi.showSidebar('root');
    }
    this.sidebarHidden = !this.sidebarHidden;
  }

  ngOnInit(): void {
    this.fullName = localStorage.getItem('full_name');
    this.emails = localStorage.getItem('email');
    this.role = localStorage.getItem('roles');

    const hospital = localStorage.getItem('hospital_info');
    this.hospitalInfo = hospital ? JSON.parse(hospital) : [];

    if (this.hospitalInfo.length > 0) {
      this.hospitalName = this.hospitalInfo[0].hospital_name;
      this.hospitalRole = this.hospitalInfo[0].hospital_role;
    }

    // Live consultation thread polling loop (Fires immediately, updates every 30 seconds)
    this.pollingSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.conversationService.getUnreadNotifications())
      )
      .subscribe({
        next: (res: any) => {
          if (res && res.statusCode === 200) {
            this.unreadCount = res.count || 0;
            this.notificationsList = res.notifications || [];
          }
        },
        error: (err) => console.error('Error fetching header notifications:', err)
      });
  }

  openNotificationChat(patientHistoryId: number): void {
    // 1. Mark target conversation thread records as read to update state references instantly
    this.conversationService.markAsRead(patientHistoryId).subscribe({
      next: () => {
        this.refreshNotifications();
        
        // 2. Selectively resolve the modal dialog matching the user role context
        const targetedModalComponent = (this.role === 'ROLE MKURUGENZI TIBA')
          ? MkurugenziConversationComponent 
          : ConversationModalComponent;

        // 3. Open selected component matching layout width parameters
        this.dialog.open(targetedModalComponent as ComponentType<any>, {
          width: '650px',
          maxWidth: '90vw',
          data: { patientHistoryId: patientHistoryId }
        });
      },
      error: (err) => console.error('Failed to mark conversation thread as read:', err)
    });
  }

  refreshNotifications(): void {
    this.conversationService.getUnreadNotifications().subscribe({
      next: (res: any) => {
        this.unreadCount = res.count || 0;
        this.notificationsList = res.notifications || [];
      },
      error: (err) => console.error('Error refreshing unread consultation context stack:', err)
    });
  }

  logoutHead() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to logout from this system',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Logout',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        this.route.navigate(['/auth/sign-in']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}
