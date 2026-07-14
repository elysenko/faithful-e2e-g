import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AdminServiceGroup } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  readonly groups = this.adminService.serviceGroups;

  /** One FormGroup per service, keyed by service name. */
  forms: Record<string, FormGroup> = {};
  savedService: string | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
  ) {
    for (const group of this.groups()) {
      const controls: Record<string, unknown> = {};
      for (const s of group.settings) {
        controls[s.key] = [s.masked ? '' : s.value];
      }
      this.forms[group.service] = this.fb.group(controls);
    }
  }

  save(group: AdminServiceGroup): void {
    const raw = this.forms[group.service].value as Record<string, string>;
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== '' && v != null) values[k] = v;
    }
    this.adminService.saveService(group.service, values);
    this.savedService = group.service;
  }
}
