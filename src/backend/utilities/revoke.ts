import {
  Attestation,
  Blockchain,
  ConfigService,
  Did,
  ICredential,
} from '@kiltprotocol/sdk-js';
import { configuration } from './configuration';
import { sign } from './cryptoCallbacks';
import { keypairsPromise } from './keypairs';

export async function revoke(credential: ICredential) {
  const api = ConfigService.get('api');
  const { rootHash } = credential;

  const tx = api.tx.attestation.revoke(rootHash, null);

  const { payer } = await keypairsPromise;

  const authorized = await Did.authorizeTx(
    configuration.did,
    tx,
    sign,
    payer.address,
  );

  await Blockchain.signAndSubmitTx(authorized, payer);

  const attestation = await api.query.attestation.attestations(rootHash);

  if (attestation.isNone) {
    throw new Error('Unable to fetch attestation from chain');
  }

  return Attestation.fromChain(attestation, rootHash);
}
