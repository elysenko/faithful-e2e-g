import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models';

type RecipeInput = Pick<Recipe, 'title' | 'ingredients' | 'steps'>;

/**
 * Recipe store wired to the NestJS backend at `${apiBase}/recipes`.
 * `recipes` holds the current user's recipes (newest first) and is refreshed
 * from the server on load() and after each mutation.
 */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly apiBase = environment.apiBase;
  private readonly url = `${environment.apiBase}/recipes`;

  readonly recipes = signal<Recipe[]>([]);

  /** GET /api/recipes — the current user's recipes; caches into the signal. */
  load(): Observable<Recipe[]> {
    return this.http
      .get<Recipe[]>(this.url)
      .pipe(tap((list) => this.recipes.set(list)));
  }

  /** GET /api/recipes/:id — a single owned recipe (404 if not owned). */
  getById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.url}/${id}`);
  }

  /** POST /api/recipes — create a recipe, then prepend it to the signal. */
  create(input: RecipeInput): Observable<Recipe> {
    return this.http
      .post<Recipe>(this.url, input)
      .pipe(tap((recipe) => this.recipes.update((list) => [recipe, ...list])));
  }

  /** PATCH /api/recipes/:id — update a recipe and refresh the signal entry. */
  update(id: string, input: RecipeInput): Observable<Recipe> {
    return this.http
      .patch<Recipe>(`${this.url}/${id}`, input)
      .pipe(
        tap((updated) =>
          this.recipes.update((list) => list.map((r) => (r.id === id ? updated : r))),
        ),
      );
  }

  /** DELETE /api/recipes/:id — delete a recipe and drop it from the signal. */
  remove(id: string): Observable<unknown> {
    return this.http
      .delete(`${this.url}/${id}`)
      .pipe(tap(() => this.recipes.update((list) => list.filter((r) => r.id !== id))));
  }

  constructor(private http: HttpClient) {}
}
