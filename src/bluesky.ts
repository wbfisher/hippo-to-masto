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

        // Skip replies - only include main posts
        if (record.reply) {
          continue;
        }

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

        // Handle embedded content
        if (post.embed) {
          const embedView = post.embed as any;

          // Handle images
          if (post.embed.$type === 'app.bsky.embed.images#view') {
            if (embedView.images && Array.isArray(embedView.images)) {
              blueskyPost.embed = {
                images: embedView.images.map((img: any) => ({
                  fullsize: img.fullsize,
                  alt: img.alt,
                })),
              };
            }
          }

          // Handle quote posts (record embed)
          if (post.embed.$type === 'app.bsky.embed.record#view') {
            const quotedPost = embedView.record;
            if (quotedPost && quotedPost.value) {
              blueskyPost.embed = {
                record: {
                  author: {
                    handle: quotedPost.author.handle,
                    displayName: quotedPost.author.displayName,
                  },
                  text: quotedPost.value.text || '',
                  uri: quotedPost.uri,
                },
              };
            }
          }

          // Handle quote posts with media (recordWithMedia)
          if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view') {
            const quotedPost = embedView.record?.record;
            const media = embedView.media;

            blueskyPost.embed = {};

            // Extract quoted record
            if (quotedPost && quotedPost.value) {
              blueskyPost.embed.record = {
                author: {
                  handle: quotedPost.author.handle,
                  displayName: quotedPost.author.displayName,
                },
                text: quotedPost.value.text || '',
                uri: quotedPost.uri,
              };
            }

            // Extract media (images)
            if (media && media.$type === 'app.bsky.embed.images#view' && media.images) {
              blueskyPost.embed.images = media.images.map((img: any) => ({
                fullsize: img.fullsize,
                alt: img.alt,
              }));
            }
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
