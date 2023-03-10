# KILT Attester Example

An example web application for attesting KILT credentials using the [KILT Credential API](https://github.com/KILTprotocol/spec-ext-credential-api#verification-workflow)

## Quick test

The simplest way to try this out (if you know docker) is to start a pre-made docker container:

```shell
# TODO: provide real container name
docker run -p 3000:3000 kilt-attester-example
```

Once the container starts, access it on http://localhost:3000. You’ll need a conformant wallet (like [Sporran](https://www.sporran.org/)).

## Testing in developer mode

The application is written in Javascript/Typescript, so we assume you already have a recent version of Node.js installed.

The first steps are getting the code and installing its dependencies.

```shell
git clone git@github.com:BTE-Trusted-Entity/attester-example.git
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
