import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private api = inject(ApiService);

  getSettings(): Observable<any> {
    return this.api.get<any>('settings');
  }

  updateSettings(settings: Record<string, any>): Observable<any> {
    return this.api.post<any>('settings', { settings });
  }

  getBranches(): Observable<any> {
    return this.api.get<any>('branches');
  }
}
