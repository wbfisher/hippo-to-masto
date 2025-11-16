import * as dotenv from 'dotenv';
import { createRestAPIClient } from 'masto';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('=== Mastodon Access Token Generator ===\n');

  const mastodonUrl = await question('Mastodon instance URL (e.g., https://idiots.chat): ');
  const username = await question('Username: ');
  const password = await question('Password: ');

  rl.close();

  console.log('\nGenerating access token...');

  try {
    // Create an unauthenticated client first
    const client = createRestAPIClient({
      url: mastodonUrl,
    });

    // Create an app
    const app = await client.v1.apps.create({
      clientName: 'Bluesky to Mastodon Sync',
      redirectUris: 'urn:ietf:wg:oauth:2.0:oob',
      scopes: 'read write',
    });

    console.log('App created successfully!');

    // Get access token using password grant
    const token = await client.v1.apps.createToken({
      grantType: 'password',
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      username: username,
      password: password,
      scope: 'read write',
    });

    console.log('\n=== SUCCESS! ===');
    console.log('\nYour Mastodon access token:');
    console.log(token.accessToken);
    console.log('\nAdd this to your Railway environment variables:');
    console.log(`MASTODON_ACCESS_TOKEN=${token.accessToken}`);
    console.log('\nKeep this token secure and do not share it!');
  } catch (error) {
    console.error('\nError generating token:', error);
    process.exit(1);
  }
}

main();
