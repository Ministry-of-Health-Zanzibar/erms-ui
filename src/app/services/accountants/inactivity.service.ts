import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  fromEvent,
  merge,
  Subscription,
  take,
} from 'rxjs';
import { AuthService } from '../authentication/auth.service';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogData,
} from '../../@shared/ui/session-timeout-dialog/session-timeout-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  private readonly idleTimeoutMs = 10 * 60 * 1000;
  private readonly warningDurationMs = 60 * 1000;
  private readonly idleDurationSeconds = 10 * 60;
  private readonly warningDurationSeconds = 60;
  private readonly activityEvents = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
  ] as const;

  private readonly sessionCountdownSubject = new BehaviorSubject<number>(this.idleDurationSeconds);
  private readonly countdownSubject = new BehaviorSubject<number>(this.warningDurationSeconds);
  private readonly refreshingSubject = new BehaviorSubject<boolean>(false);

  private activitySubscription?: Subscription;
  private navigationSubscription?: Subscription;
  private visibilitySubscription?: Subscription;
  private warningTriggerTimer: ReturnType<typeof setTimeout> | null = null;
  private warningLogoutTimer: ReturnType<typeof setTimeout> | null = null;
  private warningCountdownTimer: ReturnType<typeof setInterval> | null = null;
  private warningDialogRef?: MatDialogRef<SessionTimeoutDialogComponent>;
  private sessionDeadline = 0;
  private warningTriggerDeadline = 0;
  private warningDeadline = 0;
  private monitoring = false;
  private warningOpen = false;
  private logoutInProgress = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly dialog: MatDialog,
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  /** Start the browser-only inactivity monitor once for the application lifetime. */
  startWatching(): void {
    if (!isPlatformBrowser(this.platformId) || this.monitoring) {
      return;
    }

    this.monitoring = true;

    const activity$ = merge(
      ...this.activityEvents.map((eventName) => fromEvent(this.document, eventName)),
    );

    this.activitySubscription = activity$
      .pipe(debounceTime(250))
      .subscribe(() => this.handleActivity());

    this.visibilitySubscription = fromEvent(this.document, 'visibilitychange')
      .subscribe(() => this.handleVisibilityChange());

    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncWithRoute(event.urlAfterRedirects));

    this.syncWithRoute(this.router.url);
  }

  /** Stop the monitor when the host application is being torn down. */
  stopWatching(): void {
    this.activitySubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
    this.visibilitySubscription?.unsubscribe();
    this.activitySubscription = undefined;
    this.navigationSubscription = undefined;
    this.visibilitySubscription = undefined;
    this.monitoring = false;
    this.closeWarning();
  }

  private handleActivity(): void {
    if (!this.shouldMonitor() || this.warningOpen) {
      return;
    }

    this.resetTimer();
  }

  private handleVisibilityChange(): void {
    if (this.document.visibilityState !== 'visible' || !this.shouldMonitor()) {
      return;
    }

    if (this.warningOpen) {
      this.ngZone.run(() => this.updateCountdown());
      return;
    }

    if (this.sessionDeadline > 0 && Date.now() >= this.sessionDeadline) {
      this.ngZone.run(() => this.forceLogout());
      return;
    }

    // Timers can be throttled while a tab is hidden. Check the deadline when
    // the user returns so the warning still appears at the correct time.
    if (this.warningTriggerDeadline > 0 && Date.now() >= this.warningTriggerDeadline) {
      this.ngZone.run(() => this.openWarning());
    }
  }

  private syncWithRoute(url: string): void {
    if (this.isAuthenticationRoute(url) || !this.isAuthenticated()) {
      this.closeWarning();
      return;
    }

    if (!this.warningOpen) {
      this.resetTimer();
    }
  }

  private resetTimer(): void {
    this.closeWarning();

    if (!this.shouldMonitor()) {
      return;
    }

    this.sessionDeadline = Date.now() + this.idleTimeoutMs;
    this.warningTriggerDeadline = this.sessionDeadline - this.warningDurationMs;
    this.sessionCountdownSubject.next(this.idleDurationSeconds);
    this.warningTriggerTimer = setTimeout(() => {
      this.warningTriggerTimer = null;
      this.warningTriggerDeadline = 0;
      this.ngZone.run(() => this.openWarning());
    }, this.idleTimeoutMs - this.warningDurationMs);
  }

  private openWarning(): void {
    if (!this.shouldMonitor() || this.warningOpen) {
      return;
    }

    const remainingMs = this.sessionDeadline - Date.now();
    if (remainingMs <= 0) {
      this.forceLogout();
      return;
    }

    this.warningOpen = true;
    this.warningDeadline = Math.min(
      this.sessionDeadline,
      Date.now() + this.warningDurationMs,
    );
    this.sessionCountdownSubject.next(Math.ceil(remainingMs / 1000));
    this.countdownSubject.next(Math.ceil((this.warningDeadline - Date.now()) / 1000));

    this.warningLogoutTimer = setTimeout(() => {
      this.ngZone.run(() => this.forceLogout());
    }, this.warningDeadline - Date.now());

    this.warningCountdownTimer = setInterval(() => {
      this.ngZone.run(() => this.updateCountdown());
    }, 250);

    const data: SessionTimeoutDialogData = {
      sessionCountdown$: this.sessionCountdownSubject.asObservable(),
      countdown$: this.countdownSubject.asObservable(),
      refreshing$: this.refreshingSubject.asObservable(),
      sessionDurationSeconds: this.idleDurationSeconds,
      warningDurationSeconds: this.warningDurationSeconds,
      onRefresh: () => this.refreshSession(),
      onLogout: () => this.forceLogout(),
    };

    this.warningDialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      width: 'min(430px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      disableClose: true,
      panelClass: 'session-timeout-dialog-panel',
      data,
    });
  }

  private updateCountdown(): void {
    if (!this.warningOpen) {
      return;
    }

    const secondsLeft = Math.max(
      0,
      Math.ceil((this.warningDeadline - Date.now()) / 1000),
    );
    const sessionSecondsLeft = Math.max(
      0,
      Math.ceil((this.sessionDeadline - Date.now()) / 1000),
    );

    this.sessionCountdownSubject.next(sessionSecondsLeft);
    this.countdownSubject.next(secondsLeft);

    if (secondsLeft === 0) {
      this.forceLogout();
    }
  }

  private refreshSession(): void {
    if (!this.warningOpen || this.refreshingSubject.value || !this.isAuthenticated()) {
      return;
    }

    this.refreshingSubject.next(true);

    this.authService.refreshSession()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.refreshingSubject.next(false);
          this.resetTimer();
        },
        error: () => {
          this.refreshingSubject.next(false);
          this.forceLogout();
        },
      });
  }

  private forceLogout(): void {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    this.closeWarning();
    this.getStorage()?.clear();

    this.ngZone.run(() => {
      this.router.navigateByUrl('/auth/sign-in').finally(() => {
        this.logoutInProgress = false;
      });
    });
  }

  private closeWarning(): void {
    this.warningOpen = false;
    this.clearTimers();
    this.sessionCountdownSubject.next(this.idleDurationSeconds);
    this.countdownSubject.next(this.warningDurationSeconds);
    this.refreshingSubject.next(false);

    const dialogRef = this.warningDialogRef;
    this.warningDialogRef = undefined;
    dialogRef?.close();
  }

  private clearTimers(): void {
    if (this.warningTriggerTimer !== null) {
      clearTimeout(this.warningTriggerTimer);
      this.warningTriggerTimer = null;
    }

    if (this.warningLogoutTimer !== null) {
      clearTimeout(this.warningLogoutTimer);
      this.warningLogoutTimer = null;
    }

    if (this.warningCountdownTimer !== null) {
      clearInterval(this.warningCountdownTimer);
      this.warningCountdownTimer = null;
    }

    this.sessionDeadline = 0;
    this.warningTriggerDeadline = 0;
    this.warningDeadline = 0;
  }

  private shouldMonitor(): boolean {
    return this.monitoring && this.isAuthenticated() && !this.isAuthenticationRoute(this.router.url);
  }

  private isAuthenticated(): boolean {
    const storage = this.getStorage();
    return storage?.getItem('isLogin') === 'true' && Boolean(storage.getItem('token'));
  }

  private getStorage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage || null;
    } catch {
      return null;
    }
  }

  private isAuthenticationRoute(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0].replace(/\/$/, '');
    return path === '' || path === '/auth' || path.startsWith('/auth/');
  }
}
