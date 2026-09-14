import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const CANARY_NAME = 'colossus-canary';
const CANARY_CONTENT = '2026-09-14T08:41Z';

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

  constructor(
    private auth: AuthService,
    private meta: Meta,
  ) {
    this.syncCanaryMeta();
  }

  /**
   * The canary meta tag is declared statically in index.html, but a stale
   * cached/regenerated shell can be served with an outdated (or duplicated)
   * value. Normalise it at runtime so every route renders exactly one
   * colossus-canary tag carrying the current timestamp. Other shell meta tags
   * (viewport, theme-color, colossus-mockup-probe*) are left untouched.
   */
  private syncCanaryMeta(): void {
    const selector = `name="${CANARY_NAME}"`;
    // removeTag only drops the first match, so loop until none remain.
    let guard = 0;
    while (this.meta.getTag(selector) && guard < 50) {
      this.meta.removeTag(selector);
      guard += 1;
    }
    this.meta.addTag({ name: CANARY_NAME, content: CANARY_CONTENT });
  }

  logout(): void {
    this.auth.logout();
  }
}
