import { naclOpen, naclSeal } from '@polkadot/util-crypto';
import {
  DecryptCallback,
  DidResourceUri,
  EncryptCallback,
  SignRequestData,
} from '@kiltprotocol/sdk-js';

import { keypairsPromise } from './keypairs';
import { didDocumentPromise } from './didDocument';

export async function sign({ data, keyRelationship }: SignRequestData) {
  if (keyRelationship === 'capabilityDelegation') {
    throw new Error('Delegation not supported');
  }
  const { authentication, assertionMethod } = await keypairsPromise;
  const { did, authenticationKey, assertionMethodKey } =
    await didDocumentPromise;

  const [keypair, publicKey] =
    keyRelationship === 'authentication'
      ? [authentication, authenticationKey]
      : [assertionMethod, assertionMethodKey];

  const keyUri: DidResourceUri = `${did}${publicKey.id}`;

  return {
    signature: keypair.sign(data, { withType: false }),
    keyType: keypair.type,
    keyUri,
  };
}

export async function signWithAssertionMethod({ data }: { data: Uint8Array }) {
  const { assertionMethod } = await keypairsPromise;

  const { did, assertionMethodKey } = await didDocumentPromise;
  const keyUri: DidResourceUri = `${did}${assertionMethodKey.id}`;

  return {
    signature: assertionMethod.sign(data, { withType: false }),
    keyType: assertionMethod.type,
    keyUri,
  };
}

export async function encrypt({
  data,
  peerPublicKey,
}: Parameters<EncryptCallback>[0]) {
  const { keyAgreement } = await keypairsPromise;

  const { did, keyAgreementKey } = await didDocumentPromise;
  const keyUri: DidResourceUri = `${did}${keyAgreementKey.id}`;

  const { sealed, nonce } = naclSeal(
    data,
    keyAgreement.secretKey,
    peerPublicKey,
  );

  return {
    data: sealed,
    nonce,
    keyUri,
  };
}

export async function decrypt({
  data,
  nonce,
  peerPublicKey,
}: Parameters<DecryptCallback>[0]) {
  const { keyAgreement } = await keypairsPromise;

  const decrypted = naclOpen(
    data,
    nonce,
    peerPublicKey,
    keyAgreement.secretKey,
  );
  if (!decrypted) {
    throw new Error('Failed to decrypt with given key');
  }

  return {
    data: decrypted,
  };
}
