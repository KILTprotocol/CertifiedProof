import { Claim, IClaimContents, IQuote, Quote } from '@kiltprotocol/sdk-js';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { configuration } from '../../utilities/configuration';
import { sign } from '../../utilities/cryptoCallbacks';
import { encryptMessageBody } from '../../utilities/encryptMessage';
import { logger } from '../../utilities/logger';
import { Session, sessionMiddleware } from '../../utilities/sessionStorage';
import {
  kiltCost,
  SupportedCType,
  supportedCTypes,
} from '../../utilities/supportedCTypes';
import { paths } from '../paths';

const TTL = 5 * 60 * 60 * 1000;
const TERMS = 'https://example.com/terms-and-contions';

interface Input {
  type: SupportedCType;
  claimContents: IClaimContents;
}

async function handler(request: Request, response: Response): Promise<void> {
  try {
    logger.debug('Submit terms started');
    const { session } = request as Request & { session: Session };
    const { encryptionKeyUri } = session;

    const { type, claimContents } = request.body as Input;

    const claim = Claim.fromCTypeAndClaimContents(
      supportedCTypes[type],
      claimContents,
      session.did,
    );
    logger.debug('Generated claim');

    const quote: IQuote = {
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
