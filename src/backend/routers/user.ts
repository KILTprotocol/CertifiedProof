import express, { Router } from 'express';
import { pay } from '../endpoints/pay';
import { requestAttestation } from '../endpoints/requestAttestation';
import { session } from '../endpoints/session';
import { terms } from '../endpoints/terms';
import { configuration } from '../utilities/configuration';

export const userRouter = Router();

userRouter.use(session);
userRouter.use(terms);
userRouter.use(requestAttestation);
userRouter.use(pay);

userRouter.use(
  // eslint-disable-next-line import/no-named-as-default-member
  express.static(`${configuration.distFolder}/user`, {
    dotfiles: 'allow',
    setHeaders(res) {
      res.set('Access-Control-Allow-Origin', '*');
    },
  }),
);

userRouter.get('*', (request, response) => {
  response.sendFile(`${configuration.distFolder}/user/index.html`);
});
