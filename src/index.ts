import dotenv from 'dotenv';
import { BlueskyService } from './bluesky';
import { MastodonService } from './mastodon';
import { loadState, saveState } from './state';
import { Config } from './types';

dotenv.config();

function getConfig(): Config {
  // Support both old and new environment variable names
  const blueskyUsername = process.env.BLUESKY_HANDLE || process.env.BLUESKY_USERNAME || 'internethippo.bsky.social';
  const mastodonInstance = process.env.MASTODON_URL || process.env.MASTODON_INSTANCE;
  const mastodonAccessToken = process.env.MASTODON_ACCESS_TOKEN;

  // Support both milliseconds (POLL_INTERVAL) and minutes (POLL_INTERVAL_MINUTES)
  const pollInterval = process.env.POLL_INTERVAL
    ? parseInt(process.env.POLL_INTERVAL, 10)
    : parseInt(process.env.POLL_INTERVAL_MINUTES || '2', 10) * 60 * 1000;

  if (!mastodonInstance || !mastodonAccessToken) {
    throw new Error(
      'Missing required environment variables. Please set MASTODON_URL and MASTODON_ACCESS_TOKEN.'
    );
  }

  return {
    blueskyUsername,
    mastodonInstance,
    mastodonAccessToken,
    pollInterval,
  };
}

async function main() {
  console.log('🚀 Starting hippo-to-masto bot...');

  const config = getConfig();
  const bluesky = new BlueskyService(config.blueskyUsername);
  const mastodon = new MastodonService(
    config.mastodonInstance,
    config.mastodonAccessToken
  );

  console.log(`📡 Monitoring @${config.blueskyUsername} on Bluesky`);
  console.log(`📮 Posting to ${config.mastodonInstance}`);
  console.log(`⏱️  Poll interval: ${config.pollInterval / 1000} seconds\n`);

  async function checkForNewPosts() {
    try {
      console.log(`[${new Date().toISOString()}] Checking for new posts...`);

      const state = await loadState();
      const posts = await bluesky.getRecentPosts(10);

      if (posts.length === 0) {
        console.log('No posts found');
        return;
      }

      // Reverse to process oldest first
      const postsToProcess = posts.reverse();

      let newPostsCount = 0;

      for (const post of postsToProcess) {
        // Skip if we've already seen this post
        if (state.lastSeenUri && post.uri === state.lastSeenUri) {
          break;
        }

        // Skip if post is older than last seen
        if (
          state.lastSeenAt &&
          new Date(post.createdAt) <= new Date(state.lastSeenAt)
        ) {
          continue;
        }

        console.log(`\n📝 New post found:`);
        console.log(`   URI: ${post.uri}`);
        console.log(`   Text: ${post.text.substring(0, 100)}${post.text.length > 100 ? '...' : ''}`);
        console.log(`   Created: ${post.createdAt}`);

        if (post.embed?.images) {
          console.log(`   Images: ${post.embed.images.length}`);
        }

        try {
          await mastodon.postStatus(post);
          console.log('   ✅ Posted to Mastodon');
          newPostsCount++;

          // Update state after successful post
          state.lastSeenUri = post.uri;
          state.lastSeenAt = post.createdAt;
          await saveState(state);
        } catch (error) {
          console.error('   ❌ Failed to post to Mastodon:', error);
        }

        // Add a small delay between posts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (newPostsCount === 0) {
        console.log('No new posts to cross-post');
      } else {
        console.log(`\n✨ Successfully cross-posted ${newPostsCount} post(s)`);
      }
    } catch (error) {
      console.error('Error in checkForNewPosts:', error);
    }
  }

  // Initial check
  await checkForNewPosts();

  // Set up polling
  setInterval(checkForNewPosts, config.pollInterval);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
