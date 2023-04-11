import {
  Attestation,
  Blockchain,
  ConfigService,
  Did,
  IAttestation,
  ICredential,
} from '@kiltprotocol/sdk-js';
import { configuration } from './configuration';
import { sign } from './cryptoCallbacks';
import { keypairsPromise } from './keypairs';

export async function attest(credential: ICredential): Promise<IAttestation> {
  const api = ConfigService.get('api');

  const attestation = Attestation.fromCredentialAndDid(
    credential,
    configuration.did,
  );

  const { claimHash, cTypeHash } = attestation;

  const { payer } = await keypairsPromise;

  const tx = api.tx.attestation.add(claimHash, cTypeHash, null);
  const authorized = await Did.authorizeTx(
    configuration.did,
    tx,
    sign,
    payer.address,
  );

  await Blockchain.signAndSubmitTx(authorized, payer);

  return attestation;
}
