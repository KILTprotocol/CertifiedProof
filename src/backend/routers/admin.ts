import express, { Router } from 'express';
import { configuration } from '../utilities/configuration';

import { credentials } from '../endpoints/admin/credentials';

export const adminRouter = Router();

adminRouter.use(credentials);

adminRouter.use(
  // eslint-disable-next-line import/no-named-as-default-member
  express.static(`${configuration.distFolder}/admin`, {
    dotfiles: 'allow',
    setHeaders(res) {
      res.set('Access-Control-Allow-Origin', '*');
    },
  }),
);

adminRouter.get('*', (request, response) => {
  response.sendFile(`${configuration.distFolder}/admin/index.html`);
});
