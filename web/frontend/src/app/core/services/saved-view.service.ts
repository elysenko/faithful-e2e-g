import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecipeSort, SavedView } from '../models';

/** Payload accepted by POST /api/saved-views. */
export interface SavedViewInput {
  name: string;
  search?: string;
  sort?: RecipeSort;
}

/**
 * Saved view store wired to the NestJS backend at `${apiBase}/saved-views`.
 * `savedViews` holds the current user's saved views (oldest first, matching the
 * server ordering) and is refreshed on load() and after each mutation.
 */
@Injectable({ providedIn: 'root' })
export class SavedViewService {
  private readonly url = `${environment.apiBase}/saved-views`;

  readonly savedViews = signal<SavedView[]>([]);

  /** GET /api/saved-views — the current user's saved views; caches into the signal. */
  load(): Observable<SavedView[]> {
    return this.http
      .get<SavedView[]>(this.url)
      .pipe(tap((list) => this.savedViews.set(list)));
  }

  /**
   * POST /api/saved-views — create (or overwrite, names are unique per user) a
   * saved view, then merge it into the signal keeping the server's ordering.
   */
  create(input: SavedViewInput): Observable<SavedView> {
    const body: SavedViewInput = {
      name: input.name,
      search: input.search ?? '',
      sort: input.sort ?? 'newest',
    };

    return this.http.post<SavedView>(this.url, body).pipe(
      tap((view) =>
        this.savedViews.update((list) =>
          list.some((v) => v.id === view.id)
            ? list.map((v) => (v.id === view.id ? view : v))
            : [...list, view],
        ),
      ),
    );
  }

  /** DELETE /api/saved-views/:id — delete a saved view and drop it from the signal. */
  remove(id: string): Observable<unknown> {
    return this.http
      .delete(`${this.url}/${id}`)
      .pipe(tap(() => this.savedViews.update((list) => list.filter((v) => v.id !== id))));
  }

  constructor(private http: HttpClient) {}
}
