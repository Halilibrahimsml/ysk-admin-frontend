import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Aradığı sınıfın adını AppComponent olarak güncelledik:
import { AppComponent } from './app/app'; 

// Motoru AppComponent ile başlatıyoruz:
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
