import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// 1. HTTP İstemcisini dahil ediyoruz
import { provideHttpClient } from '@angular/common/http'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // 2. Sisteme internet iznini veriyoruz
    provideHttpClient() 
  ]
};
