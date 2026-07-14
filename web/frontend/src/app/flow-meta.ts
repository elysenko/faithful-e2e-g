import { Route } from '@angular/router';

/**
 * Flow-graph metadata attached to each route via `data.flow`.
 * Consumed by the colossus flow-graph extractor and the runtime navbar.
 */
export interface FlowMeta {
  flowId: string;
  node: string;
  label?: string;
  entry?: boolean;
  edgesTo?: string[];
  showInNavbar?: boolean;
  /** navbar visibility scope: 'all' users, 'admin' only, or 'none' */
  scope?: 'all' | 'admin' | 'none';
}

export type FlowRoute = Route & { data?: { flow?: FlowMeta } & Record<string, unknown> };
