import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css',
})
export class AdminOverviewComponent {
  loading = false;
  error = '';

  readonly rows = this.adminService.overview;

  constructor(private adminService: AdminService) {}

  get totalUsers(): number { return this.rows().length; }
  get totalRecipes(): number { return this.rows().reduce((sum, r) => sum + r.recipeCount, 0); }
}
