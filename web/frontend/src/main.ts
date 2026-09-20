import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, CANARY_CONTENT, CANARY_NAME } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Normalise the colossus canary meta tag before Angular bootstraps.
 *
 * The tag is declared statically in index.html and that static tag is the ONLY
 * authoritative source of the stamp. This pass therefore never rewrites the
 * content of an existing tag — a stale or older JS bundle must not be able to
 * downgrade a correctly server-rendered stamp. It only:
 *   - drops *extra* duplicates beyond the first (preferring to keep one whose
 *     content already matches the bundle's constant), so exactly one remains, and
 *   - creates the tag when none exists at all.
 * The last remaining tag is never removed, so a failure anywhere in the JS path
 * leaves the correct static tag standing instead of an empty head. Only the
 * canary tag is touched; viewport / theme-color / colossus-mockup-probe* are
 * left untouched.
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
  const preferred =
    tags.find((tag) => tag.getAttribute('content') === CANARY_CONTENT) ??
    tags[0];
  if (preferred) {
    // Keep exactly one tag and leave its content exactly as the server rendered it.
    tags.forEach((tag) => {
      if (tag !== preferred) {
        tag.remove();
      }
    });
    return;
  }
  const meta = document.createElement('meta');
  meta.setAttribute('name', CANARY_NAME);
  meta.setAttribute('content', CANARY_CONTENT);
  head.appendChild(meta);
}

syncCanaryMeta();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
