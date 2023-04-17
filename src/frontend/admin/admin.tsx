import ky from 'ky';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  generatePath,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { paths as apiPaths } from '../../backend/endpoints/paths';
import { paths } from '../utilities/paths';
import { Credential } from '../../backend/utilities/credentialStorage';

function generateAdminApiPath(path: string, params?: Record<string, unknown>) {
  return generatePath(`/admin${path}`, params);
}

function Credential() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [credential, setCredential] = useState<Credential>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (credential) {
      return;
    }
    (async () => {
      try {
        setCredential(
          await ky
            .get(generateAdminApiPath(apiPaths.credentials.item, { id }))
            .json(),
        );
      } catch {
        setError(true);
      }
    })();
  }, [credential, id]);

  const [processing, setProcessing] = useState(false);
  const handleAttest = useCallback(async () => {
    try {
      setError(false);
      setProcessing(true);

      setCredential(
        await ky
          .post(generateAdminApiPath(apiPaths.credentials.attest, { id }), {
            timeout: false,
            retry: {
              limit: 10,
              methods: ['post'],
            },
          })
          .json(),
      );
    } catch {
      setError(true);
    } finally {
      setProcessing(false);
    }
  }, [id]);

  const handleReject = useCallback(async () => {
    try {
      setError(false);

      await ky.delete(generateAdminApiPath(apiPaths.credentials.item, { id }));
      navigate(paths.admin.home);
    } catch {
      setError(true);
    }
  }, [id, navigate]);

  const handleRevoke = useCallback(async () => {
    try {
      setError(false);
      setProcessing(true);

      setCredential(
        await ky
          .post(generateAdminApiPath(apiPaths.credentials.revoke, { id }), {
            timeout: false,
            retry: {
              limit: 10,
              methods: ['post'],
            },
          })
          .json(),
      );
    } catch {
      setError(true);
    } finally {
      setProcessing(false);
    }
  }, [id]);

  if (!credential) {
    return error ? <p>Credential not found</p> : null;
  }

  const { claim, attestation } = credential;

  return (
    <section>
      <pre>{JSON.stringify(claim, null, 4)}</pre>

      {!attestation && (
        <div>
          <button disabled={processing} onClick={handleAttest}>
            Attest
          </button>
          <button disabled={processing} onClick={handleReject}>
            Reject
          </button>
        </div>
      )}

      {attestation && !attestation.revoked && (
        <div>
          <p>Attested ✅</p>
          <button disabled={processing} onClick={handleRevoke}>
            Revoke
          </button>
        </div>
      )}

      {attestation && attestation.revoked && <p>Revoked ❌</p>}

      {processing && <p>Processing...</p>}

      {error && <p>Oops, there was an error</p>}
    </section>
  );
}

function Credentials({ credentials }: { credentials: [string, Credential][] }) {
  return (
    <ul>
      {credentials.map(([id]) => (
        <li key={id}>
          <Link to={generatePath(paths.admin.credential, { id })}>{id}</Link>
        </li>
      ))}
    </ul>
  );
}

function Admin() {
  const [credentials, setCredentials] = useState<[string, Credential][]>();
  const [error, setError] = useState(false);

  const pendingCredentials = credentials?.filter(
    ([, { attestation }]) => !attestation,
  );
  const attestedCredentials = credentials?.filter(
    ([, { attestation }]) => attestation && !attestation.revoked,
  );
  const revokedCredentials = credentials?.filter(
    ([, { attestation }]) => attestation && attestation.revoked,
  );

  useEffect(() => {
    (async () => {
      try {
        const credentials = await ky
          .get(generateAdminApiPath(apiPaths.credentials.list))
          .json<Record<string, Credential>>();

        setCredentials(Object.entries(credentials));
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (!credentials) {
    return error ? <p>Unable to fetch credentials</p> : null;
  }

  return (
    <section>
      <h1>Admin Page</h1>
      {credentials.length === 0 && <p>No credentials</p>}

      {pendingCredentials && pendingCredentials.length > 0 && (
        <section>
          <h2>Pending credentials</h2>
          <Credentials credentials={pendingCredentials} />
        </section>
      )}

      {attestedCredentials && attestedCredentials.length > 0 && (
        <section>
          <h2>Attested credentials</h2>
          <Credentials credentials={attestedCredentials} />
        </section>
      )}

      {revokedCredentials && revokedCredentials.length > 0 && (
        <section>
          <h2>Revoked credentials</h2>
          <Credentials credentials={revokedCredentials} />
        </section>
      )}
    </section>
  );
}

const root = createRoot(document.querySelector('#app') as HTMLElement);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path={paths.admin.credential} element={<Credential />} />
      <Route path={paths.admin.home} element={<Admin />} />

      <Route path="*" element={<p>404 - Not found</p>} />
    </Routes>
  </BrowserRouter>,
);
