# React Components 🧩

[![NPM Latest Version][version-badge]][npm-url] [![Coverage Status][coverage-badge]][coverage-url] [![Socket Status][socket-badge]][socket-url] [![NPM Monthly Downloads][downloads-badge]][npm-url] [![Dependencies][deps-badge]][deps-url]

[![GitHub Sponsor][sponsor-badge]][sponsor-url]

[version-badge]: https://img.shields.io/npm/v/%40alessiofrittoli%2Freact-components
[npm-url]: https://npmjs.org/package/%40alessiofrittoli%2Freact-components
[coverage-badge]: https://coveralls.io/repos/github/alessiofrittoli/react-components/badge.svg
[coverage-url]: https://coveralls.io/github/alessiofrittoli/react-components
[socket-badge]: https://socket.dev/api/badge/npm/package/@alessiofrittoli/react-components
[socket-url]: https://socket.dev/npm/package/@alessiofrittoli/react-components/overview
[downloads-badge]: https://img.shields.io/npm/dm/%40alessiofrittoli%2Freact-components.svg
[deps-badge]: https://img.shields.io/librariesio/release/npm/%40alessiofrittoli%2Freact-components
[deps-url]: https://libraries.io/npm/%40alessiofrittoli%2Freact-components

[sponsor-badge]: https://img.shields.io/static/v1?label=Fund%20this%20package&message=%E2%9D%A4&logo=GitHub&color=%23DB61A2
[sponsor-url]: https://github.com/sponsors/alessiofrittoli

## TypeScript React Components

### Table of Contents

- [Getting started](#getting-started)
- [API Reference](#api-reference)
  - [High Order Components](#high-order-components)
    - [`<Stack />`](#stack-)
    - [`WithGenerator`](#withgenerator)
- [Development](#development)
  - [Install depenendencies](#install-depenendencies)
  - [Build the source code](#build-the-source-code)
  - [ESLint](#eslint)
  - [Jest](#jest)
- [Contributing](#contributing)
- [Security](#security)
- [Credits](#made-with-)

---

### Getting started

Run the following command to start using `react-components` in your projects:

```bash
npm i @alessiofrittoli/react-components
```

or using `pnpm`

```bash
pnpm i @alessiofrittoli/react-components
```

---

### API Reference

#### Components

##### High Order Components

###### `<Stack />`

Easily stack components avoiding creating a big Component stack pyramid.

<details>

<summary style="cursor:pointer">Component Props</summary>

| Property     | Type | Description |
|--------------|------|-------------|
| `components` | `StackComponent[]` | An Array of Components or Component and props. The Component must accept and return children. |
| `children`   | `React.ReactNode`  | (Optional) The Component children. |

</details>

---

<details>

<summary style="cursor:pointer">Usage</summary>

###### Basic usage

```tsx
import { Stack } from '@alessiofrittoli/react-components'

export const ProviderExample: React.FC<React.PropsWithChildren> = ( { children } ) => {
  // ...
  return (
    <div>{ children }</div>
  )
}

export const AppProviders: React.FC<React.PropsWithChildren> = ( { children } ) => (
  <Stack components={ [
    ProviderExample,
    AppProvider1,
    AppProvider2,
    AppProvider3,
    // ...
  ] }>{ children }</Stack>
)
```

---

###### Component with props

Use `StackComponent<typeof ComponentReference>` to add type safety to the passed props.

```tsx
import { Stack, type StackComponent } from '@alessiofrittoli/react-components'

type ProviderExampleProps = React.PropsWithChildren<{
  /** Example required prop */
  className: string
}>


export const ProviderExample: React.FC<React.PropsWithChildren> = (
  { className, children }
) => (
  <div className={ className }>{ children }</div>
)

export const AppProviders: React.FC<React.PropsWithChildren> = ( { children } ) => (
  <Stack components={ [
    [ ProviderExample, { className: 'some-class-name' } ] as StackComponent<typeof ProviderExample>,
    AppProvider1,
    AppProvider2,
    AppProvider3,
    // ...
  ] }>{ children }</Stack>
)
```

</details>

---

###### `WithGenerator`

Transform your generator function into a React.js Component.

<details>

<summary style="cursor:pointer">Type Parameters</summary>

| Parameter | Default   | Description |
|-----------|-----------|-------------|
| `T`       | `unknown` | Component types. |

</details>

---

<details>

<summary style="cursor:pointer">Parameters</summary>

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn`      | `( props: T ) => AsyncGenerator<React.ReactNode, React.ReactNode, React.ReactNode>` | The async generator function. |

</details>

---

<details>

<summary style="cursor:pointer">Usage</summary>

###### Stream Content from a React Component

```tsx
import { WithGenerator } from '@alessiofrittoli/react-components'

interface StepProps
{
  someProp: string
}

export const Steps = WithGenerator<StepProps>(
  async function* ( { someProp } )
  {
    let i = 0

    yield <h1>Step { ++i } - { someProp }</h1>

    // simulate an async task by awaiting a void Promise
    await new Promise<void>( resolve => setTimeout( resolve, 2000 ) )

    yield <h1>Step { ++i } - { someProp }</h1>

    // simulate an async task by awaiting a void Promise
    await new Promise<void>( resolve => setTimeout( resolve, 2000 ) )

    return <h1>Step { ++i } - { someProp } - Stream finished</h1>
  }
)
```

</details>

---

### Development

#### Install depenendencies

```bash
npm install
```

or using `pnpm`

```bash
pnpm i
```

#### Build the source code

Run the following command to test and build code for distribution.

```bash
pnpm build
```

#### [ESLint](https://www.npmjs.com/package/eslint)

warnings / errors check.

```bash
pnpm lint
```

#### [Jest](https://npmjs.com/package/jest)

Run all the defined test suites by running the following:

```bash
# Run tests and watch file changes.
pnpm test:watch

# Run tests in a CI environment.
pnpm test:ci
```

- See [`package.json`](./package.json) file scripts for more info.

Run tests with coverage.

An HTTP server is then started to serve coverage files from `./coverage` folder.

⚠️ You may see a blank page the first time you run this command. Simply refresh the browser to see the updates.

```bash
test:coverage:serve
```

---

### Contributing

Contributions are truly welcome!

Please refer to the [Contributing Doc](./CONTRIBUTING.md) for more information on how to start contributing to this project.

Help keep this project up to date with [GitHub Sponsor][sponsor-url].

[![GitHub Sponsor][sponsor-badge]][sponsor-url]

---

### Security

If you believe you have found a security vulnerability, we encourage you to **_responsibly disclose this and NOT open a public issue_**. We will investigate all legitimate reports. Email `security@alessiofrittoli.it` to disclose any security vulnerabilities.

### Made with ☕

<table style='display:flex;gap:20px;'>
  <tbody>
    <tr>
      <td>
        <img alt="avatar" src='https://avatars.githubusercontent.com/u/35973186' style='width:60px;border-radius:50%;object-fit:contain;'>
      </td>
      <td>
        <table style='display:flex;gap:2px;flex-direction:column;'>
          <tbody>
              <tr>
                <td>
                  <a href='https://github.com/alessiofrittoli' target='_blank' rel='noopener'>Alessio Frittoli</a>
                </td>
              </tr>
              <tr>
                <td>
                  <small>
                    <a href='https://alessiofrittoli.it' target='_blank' rel='noopener'>https://alessiofrittoli.it</a> |
                    <a href='mailto:info@alessiofrittoli.it' target='_blank' rel='noopener'>info@alessiofrittoli.it</a>
                  </small>
                </td>
              </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
