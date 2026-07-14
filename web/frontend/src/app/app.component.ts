import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly allNav: NavItem[] = [
    { label: 'Recipes', path: '/recipes', icon: '📖' },
    { label: 'New', path: '/recipes/new', icon: '➕' },
    { label: 'Admin', path: '/admin', icon: '📊', adminOnly: true },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️', adminOnly: true },
  ];

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isAdmin = this.auth.isAdmin;
  readonly currentUser = this.auth.currentUser;

  readonly nav = computed(() =>
    this.allNav.filter((item) => !item.adminOnly || this.isAdmin()),
  );

  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
