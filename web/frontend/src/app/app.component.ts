import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

export const CANARY_NAME = 'colossus-canary';
export const CANARY_CONTENT = '2026-09-23T08:41Z';

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

  // The colossus-canary meta tag is normalised in main.ts, before bootstrap, so
  // the rendered head is correct even if the component tree never renders.
  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
