import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, CANARY_CONTENT, CANARY_NAME } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Normalise the colossus canary meta tag before Angular bootstraps.
 *
 * The tag is declared statically in index.html, but a stale cached or
 * regenerated shell can be served with an outdated (or duplicated) value.
 * Running this here — rather than in a component constructor — means the head
 * is corrected even if the component tree never renders. Only the canary tag is
 * touched; viewport / theme-color / colossus-mockup-probe* are left untouched.
 */
function syncCanaryMeta(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const head = document.head;
  if (!head) {
    return;
  }
  document
    .querySelectorAll(`meta[name="${CANARY_NAME}"]`)
    .forEach((tag) => tag.remove());
  const meta = document.createElement('meta');
  meta.setAttribute('name', CANARY_NAME);
  meta.setAttribute('content', CANARY_CONTENT);
  head.appendChild(meta);
}

syncCanaryMeta();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
