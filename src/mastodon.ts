import { createRestAPIClient } from 'masto';
import { BlueskyPost } from './types';
import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export class MastodonService {
  private client: ReturnType<typeof createRestAPIClient>;

  constructor(instance: string, accessToken: string) {
    this.client = createRestAPIClient({
      url: instance,
      accessToken: accessToken,
    });
  }

  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  async postStatus(post: BlueskyPost): Promise<void> {
    try {
      let mediaIds: string[] = [];

      // Handle image attachments from main post
      if (post.embed?.images && post.embed.images.length > 0) {
        console.log(`Uploading ${post.embed.images.length} image(s) from main post...`);

        for (const image of post.embed.images) {
          try {
            const imageBuffer = await this.downloadImage(image.fullsize);
            const tempFilePath = path.join(tmpdir(), `bluesky-${Date.now()}.jpg`);
            await fs.writeFile(tempFilePath, imageBuffer);

            const attachment = await this.client.v2.media.create({
              file: new Blob([imageBuffer], { type: 'image/jpeg' }),
              description: image.alt || undefined,
            });

            mediaIds.push(attachment.id);

            // Clean up temp file
            await fs.unlink(tempFilePath).catch(() => {});
          } catch (imgError) {
            console.error('Error uploading image:', imgError);
          }
        }
      }

      // Handle image attachments from quoted post
      if (post.embed?.record?.images && post.embed.record.images.length > 0) {
        console.log(`Uploading ${post.embed.record.images.length} image(s) from quoted post...`);

        for (const image of post.embed.record.images) {
          try {
            const imageBuffer = await this.downloadImage(image.fullsize);
            const tempFilePath = path.join(tmpdir(), `bluesky-quoted-${Date.now()}.jpg`);
            await fs.writeFile(tempFilePath, imageBuffer);

            const attachment = await this.client.v2.media.create({
              file: new Blob([imageBuffer], { type: 'image/jpeg' }),
              description: image.alt || `Image from quoted post`,
            });

            mediaIds.push(attachment.id);

            // Clean up temp file
            await fs.unlink(tempFilePath).catch(() => {});
          } catch (imgError) {
            console.error('Error uploading quoted image:', imgError);
          }
        }
      }

      // Create the status text with link to original post
      // Extract the post ID from the URI (at://did:plc:.../app.bsky.feed.post/POST_ID)
      const postId = post.uri.split('/').pop();
      const blueskyUrl = `https://bsky.app/profile/${post.author.handle}/post/${postId}`;

      let statusText = post.text;

      // Handle quote posts - embed the quoted content
      if (post.embed?.record) {
        const quoted = post.embed.record;
        const quotedPostId = quoted.uri.split('/').pop();
        const quotedUrl = `https://bsky.app/profile/${quoted.author.handle}/post/${quotedPostId}`;
        const displayName = quoted.author.displayName || quoted.author.handle;

        // For quote posts: internethippo's text, then their link, then quoted content
        statusText += `\n\n${blueskyUrl}\n\n---\nRE: ${displayName} (@${quoted.author.handle})\n"${quoted.text}"\n${quotedUrl}`;
      } else {
        // For regular posts: text then link at the end
        statusText += `\n\n${blueskyUrl}`;
      }

      // Post to Mastodon
      await this.client.v1.statuses.create({
        status: statusText,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        visibility: 'public',
      });

      console.log('Successfully posted to Mastodon');
    } catch (error) {
      console.error('Error posting to Mastodon:', error);
      throw error;
    }
  }
}
