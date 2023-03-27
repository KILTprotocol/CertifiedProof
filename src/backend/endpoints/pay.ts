import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utilities/logger';
import { Session, sessionMiddleware } from '../utilities/sessionStorage';
import { paths } from './paths';

async function handler(request: Request, response: Response): Promise<void> {
  // implement your payment logic here

  try {
    logger.debug('Mock processing payment');

    const { session } = request as Request & { session: Session };

    if (!session.credential) {
      throw new Error('Request for attestation not found');
    }

    // TODO: send credential to admin inbox
    logger.debug('Payment received, sent attestation request to attester');
    response.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

export const pay = Router();

pay.post(paths.pay, sessionMiddleware, handler);
