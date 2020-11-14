type Remove = () => void;
type State = Record<string, unknown>;
type Payload = Record<string, unknown>;
type Event = '@changed' | '@rollback' | string;

export type Query<T extends State> = (state: T) => unknown;
export type Reducer<T extends State> = (
  state: T,
  payload?: Payload,
  event?: Event
) => T | void;

export type Store<T extends State> = {
  get(query?: Query<T>): T | unknown;
  on(event: Event, reducer: Reducer<T>): Remove;
  dispatch(event: Event, payload?: Payload): void;
  rollback(): void;
};

// Used to ensure immutability
function clone<T extends State>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function store<T extends State>(init: T): Store<T> {
  let _state = init;
  const _reducers: Record<Event, Reducer<T>[]> = { '@changed': [] };
  const _log: [Event, T][] = [];

  return {
    get: (query?): T | unknown => {
      return query ? query(clone<T>(_state)) : clone<T>(_state);
    },
    on: (event, reducer): Remove => {
      (_reducers[event] || (_reducers[event] = [])).push(reducer);
      // Returns function that can be called to remove a reducer
      return () => {
        _reducers[event].splice(_reducers[event].indexOf(reducer) >>> 0, 1);
      };
    },
    dispatch(event, payload): void {
      if (!_reducers[event]) return;
      let copy = clone<T>(_state);
      // Set a copy of the new state on top of the event log.
      _log.unshift([event, copy]);
      _reducers[event].forEach((r) => (copy = r(copy, payload) as T));
      _state = clone<T>(copy);
      // Trigger all reducer on the store changes
      _reducers['@changed'].forEach((r) => r(copy, payload, event));
    },
    rollback(): void {
      _state = (_log.shift()?.[1] || {}) as T;
      _reducers['@changed'].forEach((l) => l(_state, undefined, '@rollback'));
    },
  };
}
