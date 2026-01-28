import { forgetFactory } from './forget.js';
import { recallFactory } from './recall.js';
import { rememberFactory } from './remember.js';
import { updateFactory } from './update.js';
import { sayHelloFactory } from './sayHello.js';

export const apiFactories = [
  rememberFactory,
  updateFactory,
  forgetFactory,
  recallFactory,
  sayHelloFactory,
] as const;
