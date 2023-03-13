import { createRoot } from 'react-dom/client';

import type { ICType } from '@kiltprotocol/sdk-js';

import { FormEvent, Fragment, useCallback, useState } from 'react';
import {
  SupportedCType,
  supportedCTypeKeys,
  supportedCTypes,
} from '../backend/utilities/supportedCTypes';

function Claim({ cType }: { cType: ICType }) {
  const { title } = cType;

  return (
    <section>
      <h2>{title}</h2>
      {/* TODO: Connect to wallet and claim form */}
    </section>
  );
}

function App() {
  const [cType, setCType] = useState<ICType>();

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selected = formData.get('cType') as SupportedCType;
    setCType(supportedCTypes[selected]);
  }, []);

  return (
    <Fragment>
      <h1>KILT Attester Example</h1>

      {!cType && (
        <form onSubmit={handleSubmit}>
          <label>
            What type of credential would you like?
            <select name="cType">
              <option value="">--Select a cType--</option>
              {supportedCTypeKeys.map((cTypeKey) => (
                <option key={cTypeKey} value={cTypeKey}>
                  {cTypeKey}
                </option>
              ))}
            </select>
          </label>

          <button>Continue</button>
        </form>
      )}

      {cType && <Claim cType={cType} />}
    </Fragment>
  );
}

const root = createRoot(document.querySelector('#app') as HTMLElement);
root.render(<App />);
