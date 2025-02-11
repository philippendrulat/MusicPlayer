import { registerPlugin } from '@capacitor/core';

import type { SongFinderPlugin } from './definitions';

const SongFinder = registerPlugin<SongFinderPlugin>('SongFinder');

export * from './definitions';
export { SongFinder };