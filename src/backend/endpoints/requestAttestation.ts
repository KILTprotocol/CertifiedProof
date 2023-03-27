import { Credential, Message, Quote } from '@kiltprotocol/sdk-js';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { decrypt } from '../utilities/cryptoCallbacks';
import { logger } from '../utilities/logger';
import {
  Session,
  sessionMiddleware,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from './paths';

async function handler(request: Request, response: Response): Promise<void> {
  try {
    logger.debug('Handling attestation request');

    const message = await Message.decrypt(request.body, decrypt);
    const messageBody = message.body;
    logger.debug('Request attestation message decrypted');

    Message.verifyMessageBody(messageBody);
    const { type } = messageBody;

    if (type === 'reject' || type === 'reject-terms') {
      response.status(StatusCodes.CONFLICT).send('Message contains rejection');
      return;
    }

    if (type !== 'request-attestation') {
      throw new Error('Unexpected message type');
    }

    const { quote, credential } = messageBody.content;

    if (quote) {
      await Quote.verifyQuoteAgreement(quote);
      logger.debug('Quote agreement verified');
    }

    await Credential.verifyCredential(credential);
    logger.debug('Credential data structure verified');

    const { session } = request as Request & { session: Session };
    setSession({ ...session, credential });

    response.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

export const requestAttestation = Router();

requestAttestation.post(paths.requestAttestation, sessionMiddleware, handler);
