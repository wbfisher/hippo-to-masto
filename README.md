# Bluesky to Mastodon Sync

Automatically sync posts from a Bluesky account to Mastodon.

## Features

- Polls Bluesky every 2 minutes for new posts (configurable)
- Posts to Mastodon with original text
- Includes images/media from Bluesky posts
- Adds link back to original Bluesky post
- Tracks synced posts to avoid duplicates
- Designed for Railway deployment

## Prerequisites

- Node.js 18 or higher
- A Mastodon account
- Railway account (for deployment)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Mastodon Access Token

```bash
npm run generate-token
```

Follow the prompts to generate your Mastodon access token. You'll need:
- Your Mastodon instance URL (e.g., `https://idiots.chat`)
- Your Mastodon username
- Your Mastodon password

Save the generated access token - you'll need it for the next step.

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
MASTODON_URL=https://idiots.chat
MASTODON_ACCESS_TOKEN=your-generated-access-token
BLUESKY_HANDLE=internethippo.bsky.social
POLL_INTERVAL_MINUTES=2
```

### 4. Run Locally

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Railway Deployment

### Quick Deploy

1. **Create a new project on Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select this repository

2. **Set Environment Variables**

   In your Railway project settings, add these variables:

   ```
   MASTODON_URL=https://idiots.chat
   MASTODON_ACCESS_TOKEN=<your-token>
   BLUESKY_HANDLE=internethippo.bsky.social
   POLL_INTERVAL_MINUTES=2
   ```

3. **Deploy**

   Railway will automatically:
   - Install dependencies
   - Build the TypeScript code
   - Start the service
   - Keep it running 24/7

### Getting Your Mastodon Access Token

Before deploying to Railway, you need to generate your Mastodon access token locally:

1. Clone this repository
2. Run `npm install`
3. Run `npm run generate-token`
4. Enter your Mastodon credentials:
   - URL: `https://idiots.chat`
   - Username: `hippo_bot`
   - Password: `JDX4Uy4Fcd*oe`
5. Copy the generated token
6. Add it to Railway's environment variables as `MASTODON_ACCESS_TOKEN`

### Railway Configuration

The service is configured via `railway.json`:
- Builds with: `npm run build`
- Starts with: `npm start`
- Auto-restarts on failure
- Max 10 restart retries

## How It Works

1. **Polling**: Every 2 minutes (configurable), the service checks Bluesky for new posts from the configured handle
2. **State Tracking**: Maintains a `sync-state.json` file to track the last synced post
3. **Syncing**: New posts are posted to Mastodon in chronological order (oldest first)
4. **Media**: Images from Bluesky are downloaded and re-uploaded to Mastodon
5. **Links**: Each Mastodon post includes a link back to the original Bluesky post

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MASTODON_URL` | Yes | - | Your Mastodon instance URL |
| `MASTODON_ACCESS_TOKEN` | Yes | - | Your Mastodon access token |
| `BLUESKY_HANDLE` | No | `internethippo.bsky.social` | Bluesky handle to sync from |
| `POLL_INTERVAL_MINUTES` | No | `2` | How often to check for new posts |

## Monitoring

The service logs all activity to stdout. In Railway, you can view logs in the deployment tab:
- Connection status
- New posts found
- Posting status
- Errors

## Troubleshooting

### "Failed to verify Mastodon credentials"
- Check that your `MASTODON_ACCESS_TOKEN` is correct
- Ensure your Mastodon account is active
- Verify the `MASTODON_URL` is correct

### "No new posts to sync"
- This is normal if there are no new posts
- Check that the Bluesky handle is correct
- The service only syncs posts created after it starts (on first run)

### Service keeps restarting
- Check Railway logs for errors
- Verify all environment variables are set correctly
- Ensure your Mastodon token hasn't expired

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run built code
npm start

# Generate Mastodon token
npm run generate-token
```

## License

MIT
