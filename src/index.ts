import * as dotenv from 'dotenv';
import { SyncService } from './sync';

// Load environment variables
dotenv.config();

async function main() {
  // Validate required environment variables
  const mastodonUrl = process.env.MASTODON_URL;
  const mastodonAccessToken = process.env.MASTODON_ACCESS_TOKEN;
  const blueskyHandle = process.env.BLUESKY_HANDLE || 'internethippo.bsky.social';
  const pollIntervalMinutes = parseInt(process.env.POLL_INTERVAL_MINUTES || '2', 10);

  if (!mastodonUrl) {
    console.error('ERROR: MASTODON_URL environment variable is required');
    process.exit(1);
  }

  if (!mastodonAccessToken) {
    console.error('ERROR: MASTODON_ACCESS_TOKEN environment variable is required');
    console.error('Run "npm run generate-token" to create one');
    process.exit(1);
  }

  console.log('=== Bluesky to Mastodon Sync Service ===');
  console.log(`Mastodon URL: ${mastodonUrl}`);
  console.log(`Bluesky Handle: ${blueskyHandle}`);
  console.log(`Poll Interval: ${pollIntervalMinutes} minute(s)`);
  console.log('========================================\n');

  try {
    const syncService = new SyncService(
      mastodonUrl,
      mastodonAccessToken,
      blueskyHandle
    );

    await syncService.initialize();
    await syncService.startPolling(pollIntervalMinutes);

    // Keep the process running
    console.log('Service is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

main();
