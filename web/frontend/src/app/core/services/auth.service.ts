import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

/**
 * Auth state for the mockup. Login/register/demoLogin operate against local
 * mock state so the SPA is fully navigable without a backend. The service_agent
 * stage rewires login()/register()/me() to real HTTP calls against `${apiBase}/auth/*`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = environment.apiBase;

  private _user = signal<User | null>(this.readStoredUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /** Mock login — accepts any credentials and infers role from the email. */
  login(email: string, _password: string): Observable<AuthResponse> {
    const role = email.trim().toLowerCase().startsWith('admin') ? 'ADMIN' : 'USER';
    const res: AuthResponse = {
      accessToken: this.mockToken(email),
      user: { id: 'u-' + role.toLowerCase(), email, role },
    };
    this.persist(res);
    return of(res);
  }

  /** Mock register — always creates a USER (admins exist only via seed). */
  register(email: string, _password: string): Observable<AuthResponse> {
    const res: AuthResponse = {
      accessToken: this.mockToken(email),
      user: { id: 'u-new', email, role: 'USER' },
    };
    this.persist(res);
    return of(res);
  }

  /** Demo bypass wired to the login page — signs in as a seeded ADMIN and lands on /recipes. */
  demoLogin(): void {
    const res: AuthResponse = {
      accessToken: this.mockToken('admin@faithfulg.dev'),
      user: { id: 'u-admin', email: 'admin@faithfulg.dev', role: 'ADMIN' },
    };
    this.persist(res);
    this.router.navigate(['/recipes']);
  }

  me(): Observable<User | null> {
    return of(this._user());
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('isAuthenticated');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    localStorage.setItem('isAuthenticated', 'true');
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private mockToken(email: string): string {
    return 'mock.' + btoa(email).replace(/=/g, '') + '.jwt';
  }
}
