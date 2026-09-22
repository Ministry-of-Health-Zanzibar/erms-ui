import { afterNextRender, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { EnvironmentService, PageLoadingBarComponent, ThemeManagerService } from '@elementar/components';
import { ScreenLoaderComponent } from '@layout/screen-loader/screen-loader.component';
import { ScreenLoaderService } from '@elementar/components';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { AnalyticsService } from '@elementar/components';
import { SeoService } from '@elementar/components';
import { InactivityTrackerService } from '@elementar/components';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ScreenLoaderComponent,
    PageLoadingBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private _themeManager = inject(ThemeManagerService);
  private _screenLoader = inject(ScreenLoaderService);
  private _analyticsService = inject(AnalyticsService);
  private _inactivityTracker = inject(InactivityTrackerService);
  private _seoService = inject(SeoService);
  private _envService = inject(EnvironmentService);
  private _platformId = inject(PLATFORM_ID);
  private _router = inject(Router);

  loadingText = signal('Application Loading');
  isLoginRoute = signal(true);

  constructor() {
    afterNextRender(() => {
      // Scroll a page to top if url changed
      this._router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd)
        )
        .subscribe((event) => {
          this.isLoginRoute.set(this.isSignInUrl(event.urlAfterRedirects));
          window.scrollTo({
            top: 0,
            left: 0
          });
          if (this.isLoginRoute()) {
            // Logout navigates to the sign-in route. Do not keep the global
            // screen loader over that page for an artificial delay.
            this._screenLoader.hide();
          }
        })
      ;

      this._analyticsService.trackPageViews();
      this._inactivityTracker.setupInactivityTimer()
        .subscribe(() => {
          // console.log('Inactive mode has been activated!');
          // this._inactivityTracker.reset();
        })
      ;
    });
  }

  ngOnInit(): void {
  //    if (localStorage.getItem('isLogin') === 'true') {
  //   this.inactivityService.startWatching();
  // }

    this._themeManager.setColorScheme(this._themeManager.getPreferredColorScheme());

    if (isPlatformBrowser(this._platformId)) {
      setTimeout(() => this.loadingText.set('Initializing Modules'), 1500);
    }

    this._seoService.trackCanonicalChanges(this._envService.getValue('siteUrl'));
  }

  private isSignInUrl(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0].replace(/\/$/, '');
    return path === '/auth' || path === '/auth/sign-in';
  }
  
}
