import { inject, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatMiniFabButton,
  MatIconButton,
  MatAnchor,
  MatButton,
} from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { FeedbackService } from '@shared/services/feedback.service';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { ReferralService } from '../../../../services/Referral/referral.service';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableToolbarComponent,
} from '@shared/ui';


@Component({
  selector: 'app-searchfollow-up',
  standalone: true,
  imports: [
     CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatIcon,
        VDividerComponent,
        MatTooltip,
        MatSlideToggleModule,
        FormsModule,
        EmrSegmentedModule,
        EmptyStateComponent,
        LoadingStateComponent,
        PageHeaderComponent,
        SectionCardComponent,
        StatusBadgeComponent,
        TableToolbarComponent,
  ],
  templateUrl: './searchfollow-up.component.html',
  styleUrl: './searchfollow-up.component.scss'
})
export class SearchfollowUpComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;
  errorMessage = '';
  totalItems = 0;
  pageSize = 25;
  currentPage = 1;
  searchTerm = '';
  private readonly searchChanged = new Subject<string>();

  displayedColumns: string[] = [
    'id',
    'patient_name',
    'case_type',
    'board_comments',
    'diagnoses',
    'status',
    'action'
    
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  referralsLetter: any;

  constructor(
    public permission: PermissionService,
    public referralService: ReferralService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
      .subscribe(() => {
        this.currentPage = 1;
        this.getReferrals();
      });
    this.getReferrals();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

   ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
  renew() {
    this.currentPage = 1;
    this.getReferrals();
  }

 getReferrals() {
  this.loading = true;
  this.errorMessage = '';

  this.referralService
    .getAllRefferal({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      has_followup: true,
    })
    .pipe(takeUntil(this.onDestroy))
    .subscribe(
      (response: any) => {
        this.loading = false;

        let dataToShow: any[] = [];

        if (response && Array.isArray(response.data)) {
          dataToShow = [...response.data];
        } else if (Array.isArray(response)) {
          dataToShow = [...response];
        } else {
          console.warn('Unexpected response format:', response);
          return;
        }

        dataToShow = dataToShow.map((item: any) => {
          const history = item.history;

          const diagnosesArray =
            item.diagnoses?.map((d: any) => d.diagnosis_name) || [];

          return {
            ...item,

            case_type: history?.case_type || 'N/A',
            board_comments: history?.board_comments || 'N/A',

            diagnosesArray,
            diagnoses: diagnosesArray.join(', ') || 'N/A',
          };
        });

        this.dataSource = new MatTableDataSource(dataToShow);
        this.totalItems = response.meta?.total ?? dataToShow.length;
      },
      (error) => {
        this.loading = false;
        console.error('Failed to load referrals.', error);
        this.errorMessage = error?.error?.message || 'Unable to load follow-up records. Please try again.';
      }
    );
}

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged.next(this.searchTerm);
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getReferrals();
  }

  limitWords(text: string, wordLimit: number = 8): string {
    if (!text) return 'N/A';

    const words = text.split(' ');
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(' ') + '...'
      : text;
  }

  getDiagnoses(diagnoses: any[]): string {
    if (!diagnoses || !diagnoses.length) return 'N/A';
    return diagnoses.map(d => d.diagnosis_name).join(', ');
  }

    viewfollowup(data: any) {
      if (data.is_recommendation_only) {
        this.uiFeedback.fire(
          'Not Available',
          'This case is a recommendation only. No follow-up exists.',
          'info'
        );
        return;
      }
    
      const id = data.referrals?.[0]?.referral_id;
      if (!id) return;
    
      this.router.navigate(['/pages/config/referrals/view-follow-up', id]);
    }
  
    public getUserRole(): any {
      return localStorage.getItem('roles');
    }
  
    public get isStaff(): boolean {
      return this.getUserRole() === 'ROLE STAFF';
    }
  
    public get isAdmin(): boolean {
      return this.getUserRole() === 'ROLE ADMIN';
    }

     canViewFollowup(element: any): boolean {
    if (element.status === 'Pending') {
      return false;
    }
  
    if (element.status === 'BoardedOut') {
      return element.hospitals?.some((h: any) => h?.hospital_id) ?? false;
    }
  
    return true;
  }
}
