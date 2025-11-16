import { BskyAgent } from '@atproto/api';
import { createRestAPIClient, mastodon } from 'masto';
import { StateManager } from './state';

export class SyncService {
  private blueskyAgent: BskyAgent;
  private mastodonClient: mastodon.rest.Client;
  private stateManager: StateManager;
  private blueskyHandle: string;

  constructor(
    private mastodonUrl: string,
    private mastodonAccessToken: string,
    blueskyHandle: string = 'internethippo.bsky.social'
  ) {
    this.blueskyAgent = new BskyAgent({ service: 'https://bsky.social' });
    this.blueskyHandle = blueskyHandle;
    this.stateManager = new StateManager();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Mastodon client...');

    // Create authenticated Mastodon client
    this.mastodonClient = createRestAPIClient({
      url: this.mastodonUrl,
      accessToken: this.mastodonAccessToken,
    });

    // Verify credentials
    try {
      const account = await this.mastodonClient.v1.accounts.verifyCredentials();
      console.log(`Mastodon client initialized successfully as @${account.username}`);
    } catch (error) {
      console.error('Failed to verify Mastodon credentials:', error);
      throw error;
    }
  }

  async syncPosts(): Promise<void> {
    try {
      console.log(`Fetching posts from @${this.blueskyHandle}...`);

      // Get the user's posts from Bluesky
      const response = await this.blueskyAgent.getAuthorFeed({
        actor: this.blueskyHandle,
        limit: 10,
      });

      if (!response.data.feed || response.data.feed.length === 0) {
        console.log('No posts found');
        return;
      }

      const posts = response.data.feed;
      const lastSyncedUri = this.stateManager.getLastSyncedPostUri();

      // Find new posts (posts after the last synced one)
      let newPosts = posts;
      if (lastSyncedUri) {
        const lastSyncedIndex = posts.findIndex(p => p.post.uri === lastSyncedUri);
        if (lastSyncedIndex !== -1) {
          newPosts = posts.slice(0, lastSyncedIndex);
        }
      }

      if (newPosts.length === 0) {
        console.log('No new posts to sync');
        return;
      }

      console.log(`Found ${newPosts.length} new post(s) to sync`);

      // Post to Mastodon in reverse order (oldest first)
      for (let i = newPosts.length - 1; i >= 0; i--) {
        const post = newPosts[i];
        await this.postToMastodon(post);

        // Update state after each successful post
        this.stateManager.updateLastSyncedPost(post.post.uri);

        // Small delay between posts to avoid rate limiting
        await this.sleep(2000);
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error syncing posts:', error);
      throw error;
    }
  }

  private async postToMastodon(feedPost: any): Promise<void> {
    const post = feedPost.post;
    const record = post.record as any;

    let statusText = record.text || '';

    // Add link to original post
    const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;
    statusText += `\n\n🔗 ${postUrl}`;

    console.log(`Posting to Mastodon: "${statusText.substring(0, 50)}..."`);

    try {
      // Handle images if present
      const mediaIds: string[] = [];
      if (post.embed?.images && post.embed.images.length > 0) {
        for (const image of post.embed.images) {
          try {
            const mediaId = await this.uploadImageToMastodon(image.fullsize || image.thumb);
            if (mediaId) {
              mediaIds.push(mediaId);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }

      await this.mastodonClient.v1.statuses.create({
        status: statusText,
        visibility: 'public',
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      });

      console.log('Posted successfully to Mastodon');
    } catch (error) {
      console.error('Error posting to Mastodon:', error);
      throw error;
    }
  }

  private async uploadImageToMastodon(imageUrl: string): Promise<string | null> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Convert blob to buffer
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Upload to Mastodon
      const attachment = await this.mastodonClient.v2.media.create({
        file: new Blob([buffer]),
      });

      return attachment.id;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startPolling(intervalMinutes: number = 2): Promise<void> {
    console.log(`Starting polling every ${intervalMinutes} minute(s)...`);

    // Initial sync
    await this.syncPosts();

    // Poll at interval
    setInterval(async () => {
      try {
        await this.syncPosts();
      } catch (error) {
        console.error('Error during polling sync:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}
