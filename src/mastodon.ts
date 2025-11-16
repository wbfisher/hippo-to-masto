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

      // Handle image attachments
      if (post.embed?.images && post.embed.images.length > 0) {
        console.log(`Uploading ${post.embed.images.length} image(s)...`);

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

      // Create the status text with attribution
      const statusText = `${post.text}\n\n🦋 Originally posted on Bluesky by @${post.author.handle}`;

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
