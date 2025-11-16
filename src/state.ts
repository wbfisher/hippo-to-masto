import * as fs from 'fs';
import * as path from 'path';

interface State {
  lastSyncedPostUri?: string;
  lastSyncedAt?: string;
}

const STATE_FILE = path.join(process.cwd(), 'sync-state.json');

export class StateManager {
  private state: State = {};

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        this.state = JSON.parse(data);
        console.log('Loaded state:', this.state);
      } else {
        console.log('No existing state file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading state:', error);
      this.state = {};
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
      console.log('Saved state:', this.state);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  getLastSyncedPostUri(): string | undefined {
    return this.state.lastSyncedPostUri;
  }

  updateLastSyncedPost(uri: string): void {
    this.state.lastSyncedPostUri = uri;
    this.state.lastSyncedAt = new Date().toISOString();
    this.save();
  }
}
