import { Router } from 'express';
import { paths } from '../paths';
import {
  NotFoundError,
  addAttestation,
  deleteCredential,
  getCredential,
  listCredentials,
} from '../../utilities/credentialStorage';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../utilities/logger';
import { attest } from '../../utilities/attest';

export const credentials = Router();

credentials.get(paths.credentials.list, async (request, response) => {
  logger.debug('Getting list of credentials');
  response.send(listCredentials());
});

credentials.get(paths.credentials.item, async (request, response) => {
  try {
    const { id } = request.params;
    logger.debug(`Getting credential`);
    response.send(getCredential(id));
  } catch (error) {
    logger.error(error);
    if (error instanceof NotFoundError) {
      response.status(StatusCodes.NOT_FOUND).send(error);
    } else {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
  }
});

credentials.put(paths.credentials.item, async (request, response) => {
  try {
    const { id } = request.params;

    logger.debug(`Getting credential`);
    const { claim } = getCredential(id);

    logger.debug('Attesting credential');
    const attestation = await attest(claim);

    logger.debug('Credential attested, updating database');
    const attestedCredential = addAttestation(id, attestation);

    response.send(attestedCredential);
  } catch (error) {
    logger.error(error);
    if (error instanceof NotFoundError) {
      response.status(StatusCodes.NOT_FOUND).send(error);
    } else {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
  }
});

credentials.delete(paths.credentials.item, async (request, response) => {
  try {
    const { id } = request.params;
    logger.debug('Deleting credential');

    deleteCredential(id);
    response.sendStatus(StatusCodes.OK);
  } catch (error) {
    logger.error(error);
    if (error instanceof NotFoundError) {
      response.status(StatusCodes.NOT_FOUND).send(error);
    } else {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
  }
});
