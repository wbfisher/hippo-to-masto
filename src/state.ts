import { promises as fs } from 'fs';
import { AppState } from './types';

const STATE_FILE = 'state.json';

export async function loadState(): Promise<AppState> {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty state
    return {};
  }
}

export async function saveState(state: AppState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}
