export interface GitCommitOptions {
  files?: string[];
  message: string;
  sign?: boolean;
  verify?: boolean;
}

export interface GitLogOptions {
  /** Read commits from specific path. */
  path?: string | string[];
  /** Start commits range. */
  from?: string;
  /** End commits range. */
  to?: string;
  /** Commits format. */
  format?: string;
  /** Get commits since specific date. */
  since?: Date | string;
  order?: Array<'author-date' | 'date' | 'topo'>;
  /** Get commits in reverse order. */
  reverse?: boolean
  /** Get merge commits or not. */
  merges?: boolean;
  /** Defaults to true */
  color?: boolean;
  decorate?: 'short' | 'full' | 'auto' | 'no' | boolean;
}

export interface GitRevParseOptions {
  /** Whether to abbreviate the reference name (e.g., branch or tag name). */
  abbrevRef?: boolean;
  /** Ensures that the provided input refers to an actual Git object. */
  verify?: boolean;
}

export interface GitTagOptions {
  name: string;
  message?: string;
  sign?: boolean;
}
