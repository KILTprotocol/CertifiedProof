import { createRoot } from 'react-dom/client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  generatePath,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import {
  kiltCost,
  SupportedCType,
  supportedCTypes,
  supportedCTypeKeys,
  isSupportedCType,
} from '../backend/utilities/supportedCTypes';
import {
  apiWindow,
  getCompatibleExtensions,
  getSession,
  Session,
} from './utilities/session';
import { exceptionToError } from './utilities/exceptionToError';

import { paths } from './utilities/paths';
import { BalanceUtils } from '@kiltprotocol/sdk-js';

function Connect({ setSession }: { setSession: (s: Session) => void }) {
  const { kilt } = apiWindow;

  const [extensions, setExtensions] = useState(getCompatibleExtensions());

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<'closed' | 'rejected' | 'unknown'>();

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

        setSession(await getSession(kilt[extension]));
      } catch (exception) {
        const { message } = exceptionToError(exception);
        if (message.includes('closed')) {
          setError('closed');
        } else if (message.includes('Not authorized')) {
          setError('rejected');
        } else {
          setError('unknown');
          console.error(exception);
        }
        setProcessing(false);
      }
    },
    [setSession, kilt],
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

      {error === 'unknown' && (
        <p>
          Something went wrong! Try again or reload the page or restart your
          browser.
        </p>
      )}

      {error === 'closed' && <p>Your wallet was closed. Please try again.</p>}

      {error === 'rejected' && (
        <p>
          The authorization was rejected. Follow the instructions on our Tech
          Support site to establish the connection between this verifier and
          your wallet.
        </p>
      )}

      {error === 'rejected' && (
        <a
          href="https://support.kilt.io/support/solutions/articles/80000968082-how-to-grant-access-to-website"
          target="_blank"
          rel="noreferrer"
        >
          Tech Support
        </a>
      )}
    </section>
  );
}

function Claim() {
  const { type } = useParams();

  const [session, setSession] = useState<Session>();

  const handleSubmit = useCallback(() => {
    // TODO: handle submit terms
  }, []);

  if (!type || !isSupportedCType(type)) {
    return <Navigate to={paths.notFound} replace />;
  }

  const cType = supportedCTypes[type];
  const { title, properties } = cType;

  return (
    <section>
      <h2>{title}</h2>

      {!session && (
        <Fragment>
          <ul>
            {Object.keys(properties).map((property) => (
              <li key={property}>{property}</li>
            ))}
          </ul>

          <Connect setSession={setSession} />
        </Fragment>
      )}

      {session && (
        // implement custom claim form if you want to handle non-string properties
        <form onSubmit={handleSubmit}>
          {Object.keys(properties).map((property) => (
            <label key={property}>
              {property} <input name={property} required />
            </label>
          ))}

          <p>{`Price: ${BalanceUtils.toFemtoKilt(kiltCost[type])} KILT`}</p>

          <button>Submit</button>
        </form>
      )}

      <Link to={paths.home}>Back</Link>
    </section>
  );
}

function Home() {
  const [cType, setCType] = useState<SupportedCType>();

  return (
    <section>
      <h1>KILT Attester Example</h1>

      <label>
        What type of credential would you like?
        <select
          value={cType}
          onInput={(event) =>
            setCType(event.currentTarget.value as SupportedCType)
          }
        >
          <option value="">--Select a cType--</option>
          {supportedCTypeKeys.map((cTypeKey) => (
            <option key={cTypeKey} value={cTypeKey}>
              {cTypeKey}
            </option>
          ))}
        </select>
      </label>

      {cType && (
        <Link to={generatePath(paths.claim, { type: cType })}>Continue</Link>
      )}
    </section>
  );
}

const root = createRoot(document.querySelector('#app') as HTMLElement);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path={paths.home} element={<Home />} />
      <Route path={paths.claim} element={<Claim />} />
      {/* TODO: Admin route */}

      <Route path={paths.notFound} element={<p>404 - Not found</p>} />
      <Route path="*" element={<Navigate to={paths.notFound} replace />} />
    </Routes>
  </BrowserRouter>,
);
