import { Component, OnInit } from '@angular/core';
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
export class RecipesListComponent implements OnInit {
  loading = false;
  error = '';

  readonly recipes = this.recipeService.recipes;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    this.recipeService.load().subscribe({
      next: () => (this.loading = false),
      error: (err) => {
        this.error = err?.error?.message ?? 'Could not load recipes.';
        this.loading = false;
      },
    });
  }

  /** Short one-line preview from multi-line ingredients text. */
  preview(text: string): string {
    const first = (text || '').split('\n').filter((l) => l.trim()).slice(0, 3).join(' · ');
    return first.length > 90 ? first.slice(0, 90) + '…' : first;
  }

  count(text: string): number {
    return (text || '').split('\n').filter((l) => l.trim()).length;
  }
}
