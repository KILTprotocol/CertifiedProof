export const paths = {
  session: '/api/session',
  terms: '/api/terms',
  requestAttestation: '/api/request-attestation',
  pay: '/api/pay',

  // admin
  credentials: {
    list: '/api/credentials',
    item: '/api/credentials/:id',
    attest: '/api/credentials/:id/attest',
    revoke: '/api/credentials/:id/revoke',
  },
};
