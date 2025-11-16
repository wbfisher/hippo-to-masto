import { BskyAgent } from '@atproto/api';
import { BlueskyPost } from './types';

export class BlueskyService {
  private agent: BskyAgent;
  private username: string;

  constructor(username: string) {
    this.agent = new BskyAgent({ service: 'https://public.api.bsky.app' });
    this.username = username;
  }

  async getRecentPosts(limit: number = 10): Promise<BlueskyPost[]> {
    try {
      const response = await this.agent.getAuthorFeed({
        actor: this.username,
        limit,
      });

      const posts: BlueskyPost[] = [];

      for (const item of response.data.feed) {
        if (item.post.author.handle !== this.username) {
          continue; // Skip reposts from other users
        }

        const post = item.post;
        const record = post.record as any;

        const blueskyPost: BlueskyPost = {
          uri: post.uri,
          cid: post.cid,
          text: record.text || '',
          createdAt: record.createdAt || post.indexedAt,
          author: {
            handle: post.author.handle,
            displayName: post.author.displayName,
          },
        };

        // Handle embedded images
        if (post.embed && post.embed.$type === 'app.bsky.embed.images#view') {
          const embedView = post.embed as any;
          if (embedView.images && Array.isArray(embedView.images)) {
            blueskyPost.embed = {
              images: embedView.images.map((img: any) => ({
                fullsize: img.fullsize,
                alt: img.alt,
              })),
            };
          }
        }

        posts.push(blueskyPost);
      }

      return posts;
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      throw error;
    }
  }
}
