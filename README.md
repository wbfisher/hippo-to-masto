# Hippo to Masto

A bot that automatically cross-posts from Bluesky user [@internethippo](https://bsky.app/profile/internethippo.bsky.social) to Mastodon.

## Features

- 🔄 Monitors Bluesky for new posts from internethippo
- 📮 Automatically posts to your Mastodon server
- 🖼️ Handles image attachments
- 💾 Tracks last seen post to avoid duplicates
- ⏱️ Configurable polling interval
- 🚂 Ready for Railway deployment

## Prerequisites

- Node.js 18 or higher
- A Mastodon account and access token
- Railway account (for deployment)

## Getting Your Mastodon Access Token

1. Log in to your Mastodon instance
2. Go to Settings → Development → New Application
3. Give it a name (e.g., "Hippo to Masto Bot")
4. Grant it `write:statuses` and `write:media` permissions
5. Save and copy your access token

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hippo-to-masto
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```env
BLUESKY_USERNAME=internethippo.bsky.social
MASTODON_INSTANCE=https://your-mastodon-instance.com
MASTODON_ACCESS_TOKEN=your_mastodon_access_token
POLL_INTERVAL=120000
```

5. Build the project:
```bash
npm run build
```

6. Run the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Railway Deployment

### Option 1: Deploy via Railway CLI

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Add environment variables:
```bash
railway variables set BLUESKY_USERNAME=internethippo.bsky.social
railway variables set MASTODON_INSTANCE=https://your-instance.com
railway variables set MASTODON_ACCESS_TOKEN=your_token
railway variables set POLL_INTERVAL=120000
```

5. Deploy:
```bash
railway up
```

### Option 2: Deploy via Railway Dashboard

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add environment variables in the Variables tab:
   - `BLUESKY_USERNAME`: `internethippo.bsky.social`
   - `MASTODON_INSTANCE`: Your Mastodon instance URL
   - `MASTODON_ACCESS_TOKEN`: Your Mastodon access token
   - `POLL_INTERVAL`: `120000` (2 minutes in milliseconds)
5. Railway will automatically build and deploy

## How It Works

1. The bot polls Bluesky every 2 minutes (configurable) for new posts from @internethippo
2. When a new post is detected, it:
   - Downloads any attached images
   - Formats the text with attribution
   - Posts to your Mastodon server
   - Saves the post URI to avoid duplicates
3. State is persisted in `state.json` to track the last seen post

## Configuration

### Environment Variables

- `BLUESKY_USERNAME`: The Bluesky handle to monitor (default: internethippo.bsky.social)
- `MASTODON_INSTANCE`: Your Mastodon instance URL
- `MASTODON_ACCESS_TOKEN`: Your Mastodon API access token
- `POLL_INTERVAL`: How often to check for new posts in milliseconds (default: 120000 = 2 minutes)

### Polling Interval Recommendations

- **2 minutes (120000ms)**: Good balance, won't miss posts
- **5 minutes (300000ms)**: More conservative, lower API usage
- **1 minute (60000ms)**: Very responsive, but higher API usage

## Project Structure

```
hippo-to-masto/
├── src/
│   ├── index.ts          # Main application loop
│   ├── bluesky.ts        # Bluesky API service
│   ├── mastodon.ts       # Mastodon API service
│   ├── state.ts          # State management
│   └── types.ts          # TypeScript types
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── railway.json          # Railway deployment config
├── .env.example          # Example environment variables
└── README.md            # This file
```

## Troubleshooting

### Bot not posting

1. Check your Mastodon access token has the right permissions
2. Verify the Mastodon instance URL is correct (include `https://`)
3. Check Railway logs: `railway logs`

### Posts appearing multiple times

- Delete the `state.json` file and restart (will repost recent posts once)

### Images not uploading

- Ensure your Mastodon token has `write:media` permission
- Check Railway logs for specific errors

## License

MIT

## Credits

Built with:
- [@atproto/api](https://github.com/bluesky-social/atproto) - Bluesky API client
- [masto](https://github.com/neet/masto.js) - Mastodon API client
