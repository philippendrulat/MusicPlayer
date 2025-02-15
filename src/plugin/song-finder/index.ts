import { registerPlugin } from '@capacitor/core';

import type { SongFinderPlugin } from './definitions';

const SongFinder = registerPlugin<SongFinderPlugin>('SongFinder', {
  web: () => import('./web').then(m => new m.SongFinderWeb())
});

export * from './definitions';
export { SongFinder };
