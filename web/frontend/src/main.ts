import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, CANARY_CONTENT, CANARY_NAME } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Normalise the colossus canary meta tag before Angular bootstraps.
 *
 * The tag is declared statically in index.html and that static tag is the
 * authoritative one. This pass is deliberately NON-DESTRUCTIVE: it updates the
 * first existing tag in place, drops only *extra* duplicates beyond the first,
 * and creates a tag only when none exists at all. The last remaining tag is
 * never removed, so a failure anywhere in the JS path leaves the correct static
 * tag standing instead of an empty head. Only the canary tag is touched;
 * viewport / theme-color / colossus-mockup-probe* are left untouched.
 */
function syncCanaryMeta(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const head = document.head;
  if (!head) {
    return;
  }
  const tags = Array.from(
    document.querySelectorAll(`meta[name="${CANARY_NAME}"]`),
  );
  const [existing, ...duplicates] = tags;
  duplicates.forEach((tag) => tag.remove());
  if (existing) {
    if (existing.getAttribute('content') !== CANARY_CONTENT) {
      existing.setAttribute('content', CANARY_CONTENT);
    }
    return;
  }
  const meta = document.createElement('meta');
  meta.setAttribute('name', CANARY_NAME);
  meta.setAttribute('content', CANARY_CONTENT);
  head.appendChild(meta);
}

syncCanaryMeta();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
