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
      const recipe = this.recipeService.getById(this.recipeId);
      if (!recipe) {
        this.notFound = true;
        return;
      }
      this.form.patchValue({
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const value = this.form.value as { title: string; ingredients: string; steps: string };

    if (this.isEdit && this.recipeId) {
      this.recipeService.update(this.recipeId, value);
    } else {
      this.recipeService.create(value);
    }
    this.router.navigate(['/recipes']);
  }

  requestDelete(): void { this.confirmingDelete = true; }
  cancelDelete(): void { this.confirmingDelete = false; }

  confirmDelete(): void {
    if (this.recipeId) {
      this.recipeService.remove(this.recipeId);
    }
    this.router.navigate(['/recipes']);
  }
}
