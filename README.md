# CertifiedProof dApp: KILT Attester Example

An example web application for attesting KILT credentials using the [KILT Credential API](https://github.com/KILTprotocol/spec-ext-credential-api#verification-workflow)

## Wallet

The following steps assume that you already have a wallet which implements the KILT credential API, such as Sporran.

[You can follow these steps to run Sporran in developer mode](https://github.com/BTE-Trusted-Entity/sporran-extension/blob/main/docs/external.md)

## Quick test

The simplest way to try this out (if you know docker) is to start a pre-made docker container:

```shell
docker run -p 3000:3000 kiltprotocol/certified-proof
```

Once the container starts, access it on http://localhost:3000.

## Testing in developer mode

If you prefer to run the application locally, follow these steps. The application is written in Javascript/Typescript, so we assume you already have a recent version of Node.js installed.

The first steps are getting the code and installing its dependencies.

```shell
git clone git@github.com:KILTprotocol/CertifiedProof.git
yarn install
```

The script `yarn dev` runs in watch mode and recompiles the code if you change it. After it finishes you can keep it running or stop it.

```shell
yarn dev
```

You’ll need a domain linkage credential for your configuration. By default, it’s valid for 5 years, so probably you’ll only need to run this step once:

```shell
yarn did-configuration
```

Finally, start the application:

```shell
yarn dev-start
```

## Rolling your own attester

### One-time steps

Some steps only need to be done once. Those scripts do not have to be a part of your application, and you can run them inside this repository. You have first to perform the steps above to build the code.

The first thing your attester will need is some KILT coins on a payer KILT account. They will be needed to pay for storing on the blockchain its own DID with several keys. The account and each key will be defined by a secret 12-words mnemonic. A mnemonic can be generated using this command:

```shell
node -e "console.log(require('@polkadot/util-crypto').mnemonicGenerate())"
```

Pass the mnemonics to the application by writing them into `.env` file or by configuring environment variables:

```
SECRET_PAYER_MNEMONIC=stable during …
SECRET_AUTHENTICATION_MNEMONIC=setup inside …
SECRET_ASSERTION_METHOD_MNEMONIC=about spoil …
SECRET_KEY_AGREEMENT_MNEMONIC=airport excuse …
```

Then you can run the following script to generate your DID with keys and store it on the blockchain:

```shell
yarn did-create
```

If it complains about insufficient funds you can charge the account with some testing coins using the [Faucet](https://faucet.peregrine.kilt.io/). After the script completes successfully you should write down the DID from the output to the `.env` file or environment variables.

Now you will need to create a domain linkage credential. It includes the domain name, so you will need such a credential for every domain you intend to run your code on (production, staging, development, etc.) Configure the domain in `.env` file or environment variables:

```
URL=http://example.com
# Must include the port if run on non-standard port, like URL=http://localhost:3000
```

Generate the credential:

```shell
yarn did-configuration
```

The file will be generated as `./dist/frontend/user/.well-known/did-configuration.json`. When you’re running your attester application, this file has to be accessible on the URL like this one: `http://example.com/.well-known/did-configuration.json`. Its HTTP headers must include `Access-Control-Allow-Origin: *`. If you do not automate the generation of this credential, schedule to repeat re-generation shortly before it expires in 5 years.

### Reusing the code

The rest of the code is split into basic React frontend and simple Express backend. The frontend is further split into a user frontend and an admin frontend.

The user frontend's primary tasks are to provide forms for the attester's supported claim types and to pass data between the wallet and the backend HTTP API. The admin frontend's task is to fetch and display the requested claims from storage, and gives the attester the option to attest and revoke credentials. You have full freedom to choose any or even no framework for these tasks. We picked React as a _lingua franca_.

Neither are you bound to Express on the backend implementation. (In fact, our own attester uses Hapi.js.) You might want to reuse more of this code, however, due to the complexity of the flow.

### Production configuration

The aim of this example is to provide a straightforward and adaptable foundation for your production attester, but it is not intended to be a fully production-ready application in itself.

By default, this example uses Peregrine, which is the testing instance of the KILT blockchain. Peregrine is not intended for real-world usage. The production instance of your attester **must** work with the main KILT blockchain, called Spiritnet. Spiritnet does not share any data with Peregrine, so the DID you created on Peregrine will not exist on Spiritnet. You **should** generate a different set of mnemonics/keys for the production instance of your attester. You will need to run the scripts again to create the DID and the domain linkage credential. To configure scripts to work with Spiritnet, change the value of `BLOCKCHAIN_ENDPOINT` from `wss://peregrine.kilt.io/parachain-public-ws` to `wss://kilt-rpc.dwellir.com`. You should also use the [public version of Sporran](https://www.sporran.org/) which connects to Spiritnet by default.

The example backend uses a simple in-memory storage for credential data. Your production application should implement a database if you plan to store credential data. You should also be aware of GDPR requirements when storing the data of a user.

The admin routes are protected in the example with basic authentication middleware, with the username and password being stored unencrypted in the environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`. You may want to take a more secure approach in your production application.

If you want to charge users for their credentials, you will also need to implement a payment flow. The example provides only a mock payment API to illustrate how the payment process should fit into the attestation flow.
