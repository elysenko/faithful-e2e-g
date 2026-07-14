import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminOverviewRow, AdminServiceGroup } from '../models';

/**
 * Admin data for the mockup. Both `overview` and `serviceGroups` are mock data
 * signals the mockup_cleaner clears; the service_agent wires them to
 * `${apiBase}/admin/overview` and `${apiBase}/admin/settings`.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiBase = environment.apiBase;

  readonly overview = signal<AdminOverviewRow[]>([
    { userId: 'u-admin', email: 'admin@faithfulg.dev', recipeCount: 3 },
    { userId: 'u-user', email: 'demo@faithfulg.dev', recipeCount: 5 },
    { userId: 'u-2', email: 'maria@example.com', recipeCount: 2 },
    { userId: 'u-3', email: 'georgi@example.com', recipeCount: 0 },
  ]);

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
