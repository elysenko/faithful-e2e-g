import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models';

/**
 * Recipe store for the mockup. `recipes` is the mock data signal the
 * mockup_cleaner clears and the service_agent wires to `${apiBase}/recipes`.
 */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly apiBase = environment.apiBase;

  readonly recipes = signal<Recipe[]>([
    {
      id: 'r1',
      title: 'Banitsa',
      ingredients:
        '500g filo pastry\n400g Bulgarian sirene (white brine cheese)\n4 eggs\n200ml plain yogurt\n120g butter, melted\n1 tsp baking soda',
      steps:
        '1. Whisk eggs, crumbled sirene and yogurt with the baking soda.\n2. Brush each filo sheet with butter, spread the filling and roll loosely.\n3. Coil the rolls into a buttered round pan.\n4. Bake at 180°C for 40 minutes until deep golden.\n5. Rest 10 minutes before slicing.',
      createdAt: '2026-07-12T09:30:00.000Z',
      updatedAt: '2026-07-12T09:30:00.000Z',
    },
    {
      id: 'r2',
      title: 'Shopska Salad',
      ingredients:
        '3 ripe tomatoes\n2 cucumbers\n1 roasted red pepper\n1 small onion\n150g sirene, grated\nParsley, red wine vinegar, sunflower oil',
      steps:
        '1. Dice tomatoes, cucumbers, pepper and onion.\n2. Toss with vinegar, oil and salt.\n3. Blanket generously with grated sirene.\n4. Finish with chopped parsley.',
      createdAt: '2026-07-10T17:05:00.000Z',
      updatedAt: '2026-07-10T17:05:00.000Z',
    },
    {
      id: 'r3',
      title: 'Tarator (Cold Cucumber Soup)',
      ingredients:
        '500ml plain yogurt\n1 cucumber, finely diced\n2 cloves garlic\n2 tbsp walnuts, crushed\nFresh dill, sunflower oil, cold water',
      steps:
        '1. Whisk yogurt with cold water to a pourable soup.\n2. Stir in cucumber, crushed garlic and walnuts.\n3. Season with salt and dill.\n4. Chill 1 hour and serve cold.',
      createdAt: '2026-07-08T12:00:00.000Z',
      updatedAt: '2026-07-08T12:00:00.000Z',
    },
  ]);

  list(): Recipe[] {
    return this.recipes();
  }

  getById(id: string): Recipe | undefined {
    return this.recipes().find((r) => r.id === id);
  }

  create(input: Pick<Recipe, 'title' | 'ingredients' | 'steps'>): Recipe {
    const now = new Date(0).toISOString();
    const recipe: Recipe = { id: 'r-' + (this.recipes().length + 1), ...input, createdAt: now, updatedAt: now };
    this.recipes.update((list) => [recipe, ...list]);
    return recipe;
  }

  update(id: string, input: Pick<Recipe, 'title' | 'ingredients' | 'steps'>): void {
    this.recipes.update((list) => list.map((r) => (r.id === id ? { ...r, ...input } : r)));
  }

  remove(id: string): void {
    this.recipes.update((list) => list.filter((r) => r.id !== id));
  }
}
