# Storive - event-driven in memory store

![](https://github.com/kevtiq/storive/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/storive.svg?style=flat)](https://www.npmjs.com/package/storive)
[![NPM Downloads](https://img.shields.io/npm/dm/storive.svg?style=flat)](https://www.npmjs.com/package/storive)
[![Minified size](https://img.shields.io/bundlephobia/min/storive?label=minified)](https://www.npmjs.com/package/storive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Storive is tiny event-driven atomic state management library that can be used in any modern front-end frameworks (e.g. React, Vue, etc.). It is build on several core principles.

- **Event-driven**: mutations can be registered on events and are only executed when an event is dispatched.
- **Immutable**: data is immutable and cannot be mutated directly, due to an access layer or state interface.
- **Decoupled**: events can be registered anywhere (e.g. inside a component) and do not have to be registered near where the store is defined.
- **Modular**: can be used as a single global store, or as many decoupled and distributed small stores.

```js
import storive from 'storive';
// declare a store and set the initial values
const myStore = storive({ count: 0 });

// register various events through reduce functions
myStore.on('increased', (state) => ({ count: state.count + 1 }));
myStore.on('decreased', (state) => ({ count: state.count - 1 }));
myStore.on('add', (state, { key, value }) => ({ ...state, key: value }));

// getting values in various ways
const state = myStore.get(); // entire state
const count = myStore.get().count; // a specific value
const doubleCount = myStore.get((state) => state.count * 2); // a view on the state

// dispatch an event
myStore.dispatch('increased');
myStore.dispatch('add', { key: 'key', value: 'value' });

// register to all changes on the state, via the @changed event
// A shallow check is executed on each dispatch before the @changed is triggered
myStore.on('@changed', (s, p, e) => console.log(`event (${e}) result:`, s));

// undo the last event, can be used multiple times
myStore.undo();
// Redo the last 'undo', can be used multiple times. Resets after dispatch.
myStore.redo();
```

## Advanced options and examples

### Nested and asynchronous reduce functions

Using storive, you can easily subscribe logical flows that trigger other changes. For instance, running an asynchronous fetch operation and store the response/error in the store.

```js
// nested event can come in handy for async operations
myStore.on('asyc', async (state) => {
  try {
    await myAsyncOperation();
    myStore.dispatch('increased');
  } catch (e) {
    myStore.dispatch('decreased');
  }
});
```

### Basic CRUD-like events

Many state management activities resolve around default CRUD operations around lists of data.

```js
const userStore = storive({ users: [] });

userStore.on('created', (s, user) => ({ users: s.users.concat([user]) }));
userStore.on('deleted', (s, id) => ({
  users: s.users.filter((u) => u.id !== id),
}));
userStore.on('updated', (s, user) => ({
  users: s.users.map((u) => (u.id === user.id ? user : u)),
}));
```

### Generic React hooks example

A generic React Hook implementation that automatically rerenders if the store value changes.

```jsx
import { useReducer, useRef, useLayoutEffect } from 'react';
import storive from 'storive';

// Define the store
const myStore = storive({ count: 0 });
myStore.on('increased', (s) => ({ count: s.count + 1 }));

// Create the hook
function useStorive(store, query) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(store.get(query));

  useLayoutEffect(() => {
    const remove = store.on('@changed', (s) => {
      if (value.current !== query ? query(s) : s) {
        value.current = query ? query(s) : s;
        rerender();
      }
    });
    return () => remove();
  }, []); //eslint-disable-line

  return [value.current, store.dispatch, store.rollback];
}

// Apply in a component
function MyButton() {
  // here a view on the data is being used in the hook
  const [state, dispatch] = useStorive(store, (s) => s.count * 2);

  return (
    <button onClick={() => dispatch('increment')}>{`value ${state}`}</button>
  );
}
```

### Stale-while-revalidate with React Hooks

Example how to implement a 'stale-while-revalidate' pattern for data fetching. In this example, a check is done on each `get(...)`. If the data is invalid or expired, the fetch is executed again. For this example, data expires after 5 minutes.

```js
import storive from 'storive';

export const store = storive({ data: null, valid: false, maxAge: null });

store.on('dataUpdated', (s, p) => ({ ...s, data: p, valid: false }));
// expires after 5 minutes
store.on('responseReceived', (s, p) => {
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + 5 * 60);
  return { ...s, loading: false, data: p, maxAge: expires, valid: true };
});

async function fetcher() {
  try {
    const response = await fetch();
    store.dispatch('responseReceived', response);
  } catch (e) {
    console.log(e);
  }
}

store.on('revalidationStarted', fetcher);

export function query(s) {
  if (!s.data || !s.valid || new Date() > s.maxAge)
    store.dispatch('revalidationStarted');
  return s.data;
}
```

```jsx
import { store, query } from './store';

function MyComponent() {
  // here a view on the data is being used in the hook
  const [state] = useStorive(store, query);

  return <div>{state || 'loading'}</div>;
}
```
