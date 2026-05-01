import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { catchError, of } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeFr, 'fr');
registerLocaleData(localePt, 'pt');

function initTranslations(translate: TranslateService) {
  return () => {
    const savedLanguage = localStorage.getItem('language') || 'es';
    translate.setDefaultLang(savedLanguage);
    return translate.use(savedLanguage).toPromise();
  };
}

function initAuth(authService: AuthService) {
  return () => authService.me().pipe(catchError(() => of(null)));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([csrfInterceptor, errorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',      // nombre de la cookie que Laravel emite
        headerName: 'X-XSRF-TOKEN',    // header que Laravel espera recibir
      })
    ),

    importProvidersFrom(
      TranslateModule.forRoot({
        loader: provideTranslateHttpLoader({
          prefix: './assets/i18n/',
          suffix: '.json'
        })
      })
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => initAuth(auth),
      deps: [AuthService],
      multi: true,
    }
  ]
};