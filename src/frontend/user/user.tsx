import { createRoot } from 'react-dom/client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  generatePath,
  Link,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import ky from 'ky';
import { IClaimContents } from '@kiltprotocol/types';
import { IEncryptedMessage } from '@kiltprotocol/kilt-extension-api/node_modules/@kiltprotocol/types';

import {
  apiWindow,
  getCompatibleExtensions,
  getSession,
  Session,
} from '../utilities/session';
import { exceptionToError } from '../utilities/exceptionToError';
import { paths } from '../utilities/paths';

import {
  kiltCost,
  supportedCTypes,
  supportedCTypeKeys,
  isSupportedCType,
} from '../../backend/utilities/supportedCTypes';
import { paths as apiPaths } from '../../backend/endpoints/paths';
import { sessionHeader } from '../../backend/endpoints/user/sessionHeader';

type FlowError = 'closed' | 'unauthorized' | 'unknown';

const errors: Record<FlowError, JSX.Element> = {
  closed: <p>Your wallet was closed. Please try again.</p>,
  unauthorized: (
    <p>
      The authorization was rejected. Follow the instructions on our Tech
      Support site to establish the connection between this attester and your
      wallet.
      <a
        href="https://support.kilt.io/support/solutions/articles/80000968082-how-to-grant-access-to-website"
        target="_blank"
        rel="noreferrer"
      >
        Tech Support
      </a>
    </p>
  ),
  unknown: (
    <p>
      Something went wrong! Try again or reload the page or restart your
      browser.
    </p>
  ),
};

function Connect({ onConnect }: { onConnect: (s: Session) => void }) {
  const { kilt } = apiWindow;

  const [extensions, setExtensions] = useState(getCompatibleExtensions());

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<FlowError>();

  useEffect(() => {
    function handler() {
      setExtensions(getCompatibleExtensions());
    }

    window.dispatchEvent(new CustomEvent('kilt-dapp#initialized'));
    window.addEventListener('kilt-extension#initialized', handler);
    return () =>
      window.removeEventListener('kilt-extension#initialized', handler);
  }, []);

  const handleConnect = useCallback(
    async (extension: string) => {
      try {
        setProcessing(true);
        setError(undefined);

        onConnect(await getSession(kilt[extension]));
      } catch (exception) {
        const { message } = exceptionToError(exception);
        if (message.includes('closed')) {
          setError('closed');
        } else if (message.includes('Not authorized')) {
          setError('unauthorized');
        } else {
          setError('unknown');
          console.error(exception);
        }
        setProcessing(false);
      }
    },
    [onConnect, kilt],
  );
  return (
    <section>
      {extensions.length === 0 && (
        <p>
          Looking for a wallet… To make a claim you need to have e.g. Sporran
          wallet installed and have an identity configured in it.
        </p>
      )}

      {extensions.map((extension) => (
        <button
          key={extension}
          type="button"
          onClick={() => handleConnect(extension)}
        >
          Connect to {kilt[extension].name}
        </button>
      ))}

      {processing && <p>Connecting…</p>}

      {error && errors[error]}
    </section>
  );
}

function Claim() {
  const { type } = useParams();

  const [session, setSession] = useState<Session>();

  const [status, setStatus] = useState<'start' | 'requested' | 'paid'>('start');

  const [error, setError] = useState<FlowError>();

  const handleConnect = useCallback((session: Session) => {
    setSession(session);
  }, []);

  const handleClaim = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(undefined);

      if (!session || !type || !isSupportedCType(type)) {
        return;
      }

      const claimContents = Object.fromEntries(
        new FormData(event.currentTarget).entries(),
      ) as IClaimContents;

      try {
        const { sessionId } = session;
        const headers = { [sessionHeader]: sessionId };
        // define in advance how to handle the response from the extension
        await session.listen(async (message) => {
          await ky.post(apiPaths.requestAttestation, {
            headers,
            json: message,
          });
          setStatus('requested');
        });

        // encrypt submit-terms message on the backend
        const message: IEncryptedMessage = await ky
          .post(apiPaths.terms, {
            headers,
            json: { type, claimContents },
          })
          .json();

        // forward the encrypted message to the extension
        await session.send(message);
      } catch (exception) {
        const { message } = exceptionToError(exception);
        if (message.includes('closed') || message.includes('Conflict')) {
          setError('closed');
        } else if (message.includes('Not authorized')) {
          setError('unauthorized');
        } else {
          setError('unknown');
          console.error(exception);
        }
      }
    },
    [session, type],
  );

  // implement your preferred payment service
  const handlePayment = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(undefined);

      if (!session) {
        return;
      }

      try {
        const { sessionId } = session;
        const headers = { [sessionHeader]: sessionId };
        await ky.post(apiPaths.pay, { headers });
        setStatus('paid');
      } catch (error) {
        console.error(error);
        setError('unknown');
      }
    },
    [session],
  );

  if (!type || !isSupportedCType(type)) {
    return <p>Error - Unsupported CType</p>;
  }

  const cType = supportedCTypes[type];
  const { title, properties } = cType;

  return (
    <section>
      <h2>{title}</h2>
      <p>Price: {kiltCost[type]} KILT</p>

      {status === 'start' && (
        // implement custom claim forms if you want to handle non-string properties
        <form onSubmit={handleClaim}>
          {Object.keys(properties).map((property) => (
            <label key={property}>
              {property}: <input name={property} disabled={!session} required />
            </label>
          ))}

          {!session && <Connect onConnect={handleConnect} />}

          {session && <button type="submit">Submit</button>}
        </form>
      )}

      {status === 'requested' && (
        <form onSubmit={handlePayment}>
          <p>Thanks for your request. Please pay</p>
          <button>Pay</button>
        </form>
      )}

      {status === 'paid' && (
        <p>
          Thanks for your payment! Your request has been sent to the attester
          for processing. You can check the attestation status in your wallet.
        </p>
      )}

      {error && errors[error]}

      <Link to={paths.home}>Back</Link>
    </section>
  );
}

function Home() {
  return (
    <section>
      <h1>CertifiedProof</h1>

      <p>
        This KILT Attester Example demonstrates how to issue credentials for a
        couple basic claim types which already exist on the KILT blockchain. The
        user chooses a claim type, enters the claim data, makes a (mock)
        payment, and the claim is sent to the attester to be reviewed.
      </p>

      <h2>Choose your claim type:</h2>

      <ul>
        {supportedCTypeKeys.map((type) => (
          <li key={type}>
            <Link to={generatePath(paths.claim, { type })}>
              {supportedCTypes[type].title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const root = createRoot(document.querySelector('#app') as HTMLElement);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path={paths.home} element={<Home />} />
      <Route path={paths.claim} element={<Claim />} />

      <Route path="*" element={<p>404 - Not found</p>} />
    </Routes>
  </BrowserRouter>,
);
