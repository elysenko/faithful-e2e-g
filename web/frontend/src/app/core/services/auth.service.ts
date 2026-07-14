import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, BackendAuthResponse, User } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

// Mirrors backend/prisma/seed derivePassword(): sha256(email + SEED_SECRET).slice(0,16).
// Lets "Demo Mode" sign in against the real seeded admin without a hardcoded password.
const DEMO_ADMIN_EMAIL = 'admin@example.com';
const SEED_SECRET = 'colossus-seed';

/**
 * Auth service wired to the NestJS backend at `${apiBase}/auth/*`.
 * The backend returns `{ user, token }`; we normalise that to `AuthResponse`
 * and persist the JWT + user in localStorage for the auth interceptor/guards.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = environment.apiBase;

  private _user = signal<User | null>(this.readStoredUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /** Authenticate against POST /api/auth/login. */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<BackendAuthResponse>(`${this.apiBase}/auth/login`, { email, password })
      .pipe(
        switchMap((res) => of(this.normalize(res))),
        tap((res) => this.persist(res)),
      );
  }

  /**
   * Register a new USER via POST /api/auth/register.
   * The backend requires a name and a password confirmation.
   */
  register(
    name: string,
    email: string,
    password: string,
    passwordconf: string,
  ): Observable<AuthResponse> {
    return this.http
      .post<BackendAuthResponse>(`${this.apiBase}/auth/register`, {
        name,
        email,
        password,
        passwordconf,
      })
      .pipe(
        switchMap((res) => of(this.normalize(res))),
        tap((res) => this.persist(res)),
      );
  }

  /** Demo bypass — signs in as the seeded ADMIN using the seed's derived password. */
  demoLogin(): void {
    from(this.deriveSeedPassword(DEMO_ADMIN_EMAIL))
      .pipe(switchMap((password) => this.login(DEMO_ADMIN_EMAIL, password)))
      .subscribe({
        next: () => this.router.navigate(['/recipes']),
        error: () => this.router.navigate(['/login']),
      });
  }

  /** Load the current user from GET /api/auth/me and refresh local state. */
  me(): Observable<User | null> {
    return this.http.get<User>(`${this.apiBase}/auth/me`).pipe(
      tap((user) => {
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this._user.set(user);
        }
      }),
    );
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

  /** Normalise the backend `{ user, token }` shape to the app's AuthResponse. */
  private normalize(res: BackendAuthResponse): AuthResponse {
    return { accessToken: res.token, user: res.user };
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

  /** Reproduces the backend seed's derivePassword() in the browser (SHA-256). */
  private async deriveSeedPassword(email: string): Promise<string> {
    const data = new TextEncoder().encode(email + SEED_SECRET);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, 16);
  }
}
