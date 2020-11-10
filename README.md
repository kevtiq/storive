# Storive - event-driven in memory store

![](https://github.com/kevtiq/storive/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/storive.svg?style=flat)](https://www.npmjs.com/package/storive)
[![NPM Downloads](https://img.shields.io/npm/dm/storive.svg?style=flat)](https://www.npmjs.com/package/storive)
[![Minified size](https://img.shields.io/bundlephobia/min/storive?label=minified)](https://www.npmjs.com/package/storive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Storive is a small event-driven data and immutable store that can be used for in memory data and state management. It comes with a decoupled state interface.

## Setup

The setup is of low effect, as it only requires the use the default export from `storive`. The function has an optional input that sets the default state value.

```js
import storive from 'storive';
const myStore = storive({ users: [] });
```

From here, you can register `reducer(state: State, payload: Payload): State` on events (e.g. 'add'). Each reducer is a function that returns a new state object. Multiple reducers can be registered on the same event. The reducers are applied in the order they are registered.

```js
myStore.on('add', (state, payload) => ({ ... }));
myStore.on('update', (state, payload) => ({ ... }));
myStore.on('remove', (state, payload) => ({ ... }));
```

## Getting value

Reading values from a store can be achieved by using the `get` function from the store. Optionally, you can add a `query` in the get-function. A query is a function that takes the current state as input, and returns an altered value.

```js
const state = myStore.get();
const value = myStore.get().key;
const view = myStore.get(state => ({ ... }));
```

## Updating a value

Updating the store is achieved by using the `dispatch` function. This function takes in the event name and a payload (e.g. data) as input.

```js
myStore.on('@changed', (s) => { ... });
myStore.dispatch('add', { newUser: { ... }});
```

On each `dispatch`, all reducers registered on the event are triggered, mutating the state. In addition, all listeners registered on `@changed` are triggered. This can be used to listen to updates from the store (e.g. required to rerender the UI).

## Rollback

With storive it is possible to rollback events using the `rollback` function.

```js
myStore.rollback();
```

## React example

First you create a React Hook.

```js
import { useReducer, useRef, useLayoutEffect } from 'react';

export default function useStorive(store, query) {
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
```

In a component you use it like:

```jsx
import storive from 'storive';
import useStorive from './useStorive';

const store = storive({ key: 0 });
store.on('increment', (s) => ({ key: s.key + 1 }));

export default function MyButton() {
  const [state, dispatch] = useStorive(store, (s) => s.key * 2);

  return (
    <button onClick={() => dispatch('increment')}>{`value ${state}`}</button>
  );
}
```

The above component shows the counter times 2.
