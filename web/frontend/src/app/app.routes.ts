import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// Every navigable UI state is reachable by URL so automated verification can land on it.
export const routes: Routes = ([
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['recipes-list', 'signup'], label: 'Login' } },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then((m) => m.SignupComponent),
    data: { flow: { flowId: 'signup', node: 'signup', edgesTo: ['recipes-list', 'login'], label: 'Sign up' } },
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./pages/recipes-list/recipes-list.component').then((m) => m.RecipesListComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipes-list', node: 'recipes-list', showInNavbar: true, scope: 'all', label: 'Recipes', edgesTo: ['recipe-create', 'recipe-edit'] } },
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipe-create', node: 'recipe-create', scope: 'all', label: 'New Recipe', edgesTo: ['recipes-list'] } },
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipe-edit', node: 'recipe-edit', scope: 'all', label: 'Edit Recipe', edgesTo: ['recipes-list'] } },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-overview/admin-overview.component').then((m) => m.AdminOverviewComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'admin-overview', node: 'admin-overview', showInNavbar: true, scope: 'admin', label: 'Admin', edgesTo: ['admin-settings'] } },
  },
  {
    path: 'admin/settings',
    loadComponent: () =>
      import('./pages/admin-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'admin-settings', node: 'admin-settings', showInNavbar: true, scope: 'admin', label: 'Settings', edgesTo: ['admin-overview'] } },
  },
  { path: '**', redirectTo: 'recipes' },
] satisfies FlowRoute[]) as Routes;
