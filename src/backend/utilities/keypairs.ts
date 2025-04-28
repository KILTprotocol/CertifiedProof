import { Crypto } from '@kiltprotocol/utils';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { configuration } from './configuration';

export const keypairsPromise = (async () => {
  await cryptoWaitReady();

  const payer = Crypto.makeKeypairFromUri(configuration.payerMnemonic);

  const authentication =  Crypto.makeKeypairFromUri(
    configuration.authenticationMnemonic,
  );

  const assertionMethod = Crypto.makeKeypairFromUri(
    configuration.assertionMethodMnemonic,
  );

  const keyAgreement = Crypto.makeEncryptionKeypairFromSeed(
    Crypto.mnemonicToMiniSecret(configuration.keyAgreementMnemonic),
  );

  return {
    payer,
    authentication,
    assertionMethod,
    keyAgreement,
  };
})();
