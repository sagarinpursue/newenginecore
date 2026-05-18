import { getEnvironment } from '../../utils.js';

import { deploySwagger } from './deploy-swagger.js';
import { updateSwagger } from './update-swagger.js';

(async () => {
    const environment = await getEnvironment();
    await updateSwagger(environment);
    await deploySwagger(environment);
})();
