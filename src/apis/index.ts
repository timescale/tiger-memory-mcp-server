import { forgetFactory } from './forget.js';
import { getMemoriesFactory } from './getMemories.js';
import { rememberFactory } from './remember.js';
import { updateFactory } from './update.js';

export const apiFactories = [
  rememberFactory,
  updateFactory,
  forgetFactory,
  getMemoriesFactory,
] as const;
