# storive

event-driven store
an event-driven data storage with a decoupled state interface that can be used for state-management,

### Using the storage in React components

You can use the store in combination with React to rerender components. It can easily be used to as a React Hook.

```js
// useStoreValue.js hook
import { useState, useRef } from 'react';
import { store } from 'pubbel';

const state = store({ count: 0 });

export default function useStoreValue(path, def) {
  // function to force rerender
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(store.get(path, def));

  // subscription to the pubsub events for the store
  useEffect(() => {
    const remove = store.subscribe(path, (v) => {
      value.current = v;
      rerender();
    });
    // remove subscription
    return () => remove();
  }, []);

  return value.current;
}
```
