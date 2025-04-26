import { randomUUID } from 'node:crypto';

import { IAttestation, ICredential } from '@kiltprotocol/types';

export class NotFoundError extends Error {}

export interface Credential {
  claim: ICredential;
  attestation?: IAttestation;
}

// Maps are used for example purposes. A real database should be used in production.
const credentials: Map<string, Credential> = new Map();

export function addClaim(claim: ICredential) {
  const id = randomUUID();
  credentials.set(id, { claim });
}

export function listCredentials() {
  return Object.fromEntries(credentials.entries());
}

export function getCredential(id: string) {
  const credential = credentials.get(id);
  if (!credential) {
    throw new NotFoundError('Credential not found');
  }
  return credential;
}

export function deleteCredential(id: string) {
  const deleted = credentials.delete(id);
  if (!deleted) {
    throw new NotFoundError('Credential not found');
  }
}

export function addAttestation(id: string, attestation: IAttestation) {
  const credential = getCredential(id);
  credentials.set(id, { ...credential, attestation });
  return getCredential(id);
}
