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
myStore.on('@changed', (s) => { ... });

// rollback the last event
myStore.rollback();
```

## Advanced options

```js
// nested events
myStore.on('nested', (state) => {
  // do someting
  myStore.dispatch('increased');
});

// nested event can come in handy for async operations
myStore.on('asyc', async (state) => {
  try {
    await myAsyncOperation();
    myStore.dispatch('increased');
  } catch (e) {
    myStore.dispatch('decreased');
  }

  // debugging options
  myStore.on('@changed', (s) => console.log('store event', s));
});
```

## Generic React hooks example

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
      value.current = query ? query(s) : s;
      rerender();
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
