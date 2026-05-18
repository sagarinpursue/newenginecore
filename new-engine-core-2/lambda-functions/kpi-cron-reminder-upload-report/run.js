import { handler } from './index.js';

handler({})
    .then((response) => {
        console.log('response :>> ', response);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
