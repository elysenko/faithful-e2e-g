import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.css',
})
export class RecipeFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  confirmingDelete = false;

  recipeId: string | null = null;
  notFound = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      ingredients: ['', [Validators.required]],
      steps: ['', [Validators.required]],
    });
  }

  get isEdit(): boolean { return !!this.recipeId; }
  get title() { return this.form.get('title'); }
  get ingredients() { return this.form.get('ingredients'); }
  get steps() { return this.form.get('steps'); }

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    if (this.recipeId) {
      this.loading = true;
      this.recipeService.getById(this.recipeId).subscribe({
        next: (recipe) => {
          this.form.patchValue({
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
          });
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          if (err?.status === 404) {
            this.notFound = true;
          } else {
            this.errorMessage = err?.error?.message ?? 'Could not load the recipe.';
          }
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const value = this.form.value as { title: string; ingredients: string; steps: string };

    const request$ =
      this.isEdit && this.recipeId
        ? this.recipeService.update(this.recipeId, value)
        : this.recipeService.create(value);

    request$.subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not save the recipe.';
        this.loading = false;
      },
    });
  }

  requestDelete(): void { this.confirmingDelete = true; }
  cancelDelete(): void { this.confirmingDelete = false; }

  confirmDelete(): void {
    if (!this.recipeId) {
      this.router.navigate(['/recipes']);
      return;
    }
    this.loading = true;
    this.recipeService.remove(this.recipeId).subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not delete the recipe.';
        this.loading = false;
        this.confirmingDelete = false;
      },
    });
  }
}
