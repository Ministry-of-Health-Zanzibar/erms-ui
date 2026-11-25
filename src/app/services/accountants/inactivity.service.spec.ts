import { DOCUMENT } from '@angular/common';
import { NgZone } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthService } from '../authentication/auth.service';
import { SessionTimeoutDialogData } from '../../@shared/ui/session-timeout-dialog/session-timeout-dialog.component';

import { InactivityService } from './inactivity.service';

describe('InactivityService', () => {
  let service: InactivityService;
  let document: EventTarget & { visibilityState: string; defaultView: { localStorage: Storage } };
  let router: { url: string; events: Subject<unknown>; navigateByUrl: jasmine.Spy };
  let open: jasmine.Spy;
  let close: jasmine.Spy;
  let refreshSession: jasmine.Spy;
  let clearStorage: jasmine.Spy;

  beforeEach(() => {
    const storage = new Map([['isLogin', 'true'], ['token', 'Bearer test-token']]);
    clearStorage = jasmine.createSpy('clear').and.callFake(() => storage.clear());
    document = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
      defaultView: { localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        clear: clearStorage,
      } as unknown as Storage },
    });
    router = { url: '/pages/dashboard/basic', events: new Subject(), navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true) };
    close = jasmine.createSpy('close');
    open = jasmine.createSpy('open').and.returnValue({ close });
    refreshSession = jasmine.createSpy('refreshSession').and.returnValue(of({ statusCode: 200 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: document },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: { open } },
        { provide: AuthService, useValue: { refreshSession } },
      ],
    });
    service = TestBed.inject(InactivityService);
  });

  it('opens the final-minute warning and emits changing seconds inside Angular before signing out', fakeAsync(() => {
    service.startWatching();
    tick(9 * 60 * 1000 - 1);
    expect(open).not.toHaveBeenCalled();
    tick(1);
    const data = open.calls.mostRecent().args[1].data as SessionTimeoutDialogData;
    let remaining = -1;
    let emissionInsideAngular = false;
    const countdown = data.countdown$.subscribe(value => {
      remaining = value;
      emissionInsideAngular = NgZone.isInAngularZone();
    });
    expect(remaining).toBe(60);
    tick(1000);
    expect(remaining).toBe(59);
    expect(emissionInsideAngular).toBeTrue();
    tick(59000); flushMicrotasks();
    expect(clearStorage).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    expect(close).toHaveBeenCalledTimes(1);
    countdown.unsubscribe(); service.stopWatching();
  }));

  it('keeps counting during the warning until the user explicitly renews the session', fakeAsync(() => {
    service.startWatching(); tick(9 * 60 * 1000);
    const data = open.calls.mostRecent().args[1].data as SessionTimeoutDialogData;
    document.dispatchEvent(new Event('mousemove'));
    document.dispatchEvent(new Event('click'));
    tick(1000);
    expect(open).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    data.onRefresh();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(clearStorage).not.toHaveBeenCalled();
    tick(9 * 60 * 1000);
    expect(open).toHaveBeenCalledTimes(2);
    service.stopWatching(); flushMicrotasks();
  }));

  it('uses the remaining real time when returning from a background tab during the last minute', fakeAsync(() => {
    service.startWatching();
    const startedAt = Date.now();
    spyOn(Date, 'now').and.returnValue(startedAt + 9 * 60 * 1000 + 30000);
    document.dispatchEvent(new Event('visibilitychange'));
    const data = open.calls.mostRecent().args[1].data as SessionTimeoutDialogData;
    let remaining = -1;
    const countdown = data.countdown$.subscribe(value => remaining = value);
    expect(remaining).toBe(30);
    expect(clearStorage).not.toHaveBeenCalled();
    countdown.unsubscribe(); service.stopWatching(); flushMicrotasks();
  }));

  it('signs out without reopening the warning when returning after the session deadline', fakeAsync(() => {
    service.startWatching();
    const startedAt = Date.now();
    spyOn(Date, 'now').and.returnValue(startedAt + 10 * 60 * 1000 + 1);
    document.dispatchEvent(new Event('visibilitychange'));
    flushMicrotasks();
    expect(open).not.toHaveBeenCalled();
    expect(clearStorage).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    service.stopWatching();
  }));
});
