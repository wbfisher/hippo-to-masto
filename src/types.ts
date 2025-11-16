export interface BlueskyPost {
  uri: string;
  cid: string;
  text: string;
  createdAt: string;
  author: {
    handle: string;
    displayName?: string;
  };
  embed?: {
    images?: Array<{
      fullsize: string;
      alt?: string;
    }>;
  };
}

export interface AppState {
  lastSeenUri?: string;
  lastSeenAt?: string;
}

export interface Config {
  blueskyUsername: string;
  mastodonInstance: string;
  mastodonAccessToken: string;
  pollInterval: number;
}
