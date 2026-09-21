import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  ENVIRONMENT,
  EnvironmentService,
  GlobalStore,
  PageTitleStrategyService
} from '@elementar/components';
import { environment } from '../environments/environment';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { authInterceptor } from '@core/authentication/auth.interceptor';
import { httpCacheInterceptor } from '@core/http-cache.interceptor';

export function initializeApp() {
  const envService = inject(EnvironmentService);
  const globalStore = inject(GlobalStore);
  return (): Promise<any> => new Promise((resolve, reject) => {
    globalStore.setPageTitle(envService.getValue('pageTitle'));
    resolve(true);
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpCacheInterceptor])),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(),
    provideAnimationsAsync(),
    provideStore(),
    provideNativeDateAdapter(),
    {
      provide: ENVIRONMENT,
      useValue: environment
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    },
    {
      provide: TitleStrategy,
      useClass: PageTitleStrategyService
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },

  ]
};
