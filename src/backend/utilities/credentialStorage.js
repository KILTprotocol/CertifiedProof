import { randomUUID } from 'node:crypto';
export class NotFoundError extends Error {}
// Maps are used for example purposes. A real database should be used in production.
const credentials = new Map();
export function addClaim(claim) {
  const id = randomUUID();
  credentials.set(id, { claim });
}
export function listCredentials() {
  return Object.fromEntries(credentials.entries());
}
export function getCredential(id) {
  const credential = credentials.get(id);
  if (!credential) {
    throw new NotFoundError('Credential not found');
  }
  return credential;
}
export function deleteCredential(id) {
  const deleted = credentials.delete(id);
  if (!deleted) {
    throw new NotFoundError('Credential not found');
  }
}
export function addAttestation(id, attestation) {
  const credential = getCredential(id);
  credentials.set(id, { ...credential, attestation });
  return getCredential(id);
}
