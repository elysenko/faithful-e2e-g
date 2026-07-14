import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOverviewRow, AdminServiceGroup } from '../models';

/**
 * Admin data service.
 * `overview` is wired to the live backend at `${apiBase}/admin/overview`.
 * `serviceGroups` remains a client-side informational view of the backing
 * services (the backend exposes no admin/settings API), configured via infra env.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiBase = environment.apiBase;

  readonly overview = signal<AdminOverviewRow[]>([]);

  /** GET /api/admin/overview — one row per user with their recipe count. */
  loadOverview(): Observable<AdminOverviewRow[]> {
    return this.http
      .get<AdminOverviewRow[]>(`${this.apiBase}/admin/overview`)
      .pipe(tap((rows) => this.overview.set(rows)));
  }

  readonly serviceGroups = signal<AdminServiceGroup[]>([
    {
      service: 'postgresql',
      label: 'PostgreSQL Database',
      description: 'Primary datastore connection used by the API.',
      configured: true,
      settings: [
        { key: 'POSTGRES_HOST', value: 'postgres', configured: true },
        { key: 'POSTGRES_PORT', value: '5432', configured: true },
        { key: 'POSTGRES_DB', value: 'app', configured: true },
        { key: 'POSTGRES_USER', value: 'app', configured: true },
        { key: 'POSTGRES_PASSWORD', value: '••••••••', configured: true, masked: true },
      ],
    },
    {
      service: 'minio',
      label: 'MinIO Object Storage',
      description: 'Optional object storage for recipe images and attachments.',
      configured: false,
      settings: [
        { key: 'MINIO_ENDPOINT', value: '', configured: false },
        { key: 'MINIO_ACCESS_KEY', value: '', configured: false },
        { key: 'MINIO_SECRET_KEY', value: '', configured: false, masked: true },
        { key: 'MINIO_BUCKET', value: '', configured: false },
      ],
    },
  ]);

  constructor(private http: HttpClient) {}

  getOverview(): AdminOverviewRow[] {
    return this.overview();
  }

  getServiceGroups(): AdminServiceGroup[] {
    return this.serviceGroups();
  }

  saveService(service: string, values: Record<string, string>): void {
    this.serviceGroups.update((groups) =>
      groups.map((g) => {
        if (g.service !== service) return g;
        const settings = g.settings.map((s) => ({
          ...s,
          value: values[s.key] ?? s.value,
          configured: !!(values[s.key] ?? s.value),
        }));
        return { ...g, settings, configured: settings.every((s) => s.configured) };
      }),
    );
  }
}
