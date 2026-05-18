import { getEnvironment } from '../utils.js';

import index from './index.js';
const environment = await getEnvironment();
console.log('environment: ', environment);
index(environment, false);
