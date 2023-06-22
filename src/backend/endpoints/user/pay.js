import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../utilities/logger';
import { sessionMiddleware } from '../../utilities/sessionStorage';
import { paths } from '../paths';
import { addClaim } from '../../utilities/credentialStorage';
async function handler(request, response) {
  // implement your payment logic here
  try {
    logger.debug('Mock processing payment');
    const {
      session: { credential },
    } = request;
    if (!credential) {
      throw new Error('Session credential not found');
    }
    addClaim(credential);
    logger.debug('Payment received, sent credential to attester');
    response.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    logger.error(error);
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}
export const pay = Router();
pay.post(paths.pay, sessionMiddleware, handler);
