import { Claim, Quote } from '@kiltprotocol/sdk-js';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { configuration } from '../../utilities/configuration';
import { sign } from '../../utilities/cryptoCallbacks';
import { encryptMessageBody } from '../../utilities/encryptMessage';
import { logger } from '../../utilities/logger';
import { sessionMiddleware } from '../../utilities/sessionStorage';
import { kiltCost, supportedCTypes } from '../../utilities/supportedCTypes';
import { paths } from '../paths';
const TTL = 5 * 60 * 60 * 1000;
const TERMS = 'https://example.com/terms-and-conditions';
async function handler(request, response) {
  try {
    logger.debug('Submit terms started');
    const { session } = request;
    const { encryptionKeyUri } = session;
    const { type, claimContents } = request.body;
    const claim = Claim.fromCTypeAndClaimContents(
      supportedCTypes[type],
      claimContents,
      session.did,
    );
    logger.debug('Generated claim');
    const quote = {
      attesterDid: configuration.did,
      cTypeHash: claim.cTypeHash,
      cost: { tax: { VAT: 0 }, net: kiltCost[type], gross: kiltCost[type] },
      currency: 'KILT',
      timeframe: new Date(Date.now() + TTL).toISOString(),
      termsAndConditions: TERMS,
    };
    const signedQuote = await Quote.createAttesterSignedQuote(quote, sign);
    logger.debug('Signed quote');
    const output = await encryptMessageBody(encryptionKeyUri, {
      content: {
        claim,
        legitimations: [],
        quote: signedQuote,
        cTypes: [supportedCTypes[type]],
      },
      type: 'submit-terms',
    });
    logger.debug('Submit terms complete');
    response.send(output);
  } catch (error) {
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}
export const terms = Router();
terms.post(paths.terms, sessionMiddleware, handler);
