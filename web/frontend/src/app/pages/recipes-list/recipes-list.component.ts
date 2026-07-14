import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recipes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipes-list.component.html',
  styleUrl: './recipes-list.component.css',
})
export class RecipesListComponent {
  // UI state flags kept for loading/error scaffolding the service_agent can drive.
  loading = false;
  error = '';

  readonly recipes = this.recipeService.recipes;

  constructor(private recipeService: RecipeService) {}

  /** Short one-line preview from multi-line ingredients text. */
  preview(text: string): string {
    const first = (text || '').split('\n').filter((l) => l.trim()).slice(0, 3).join(' · ');
    return first.length > 90 ? first.slice(0, 90) + '…' : first;
  }

  count(text: string): number {
    return (text || '').split('\n').filter((l) => l.trim()).length;
  }
}
