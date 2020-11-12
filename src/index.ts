type State = Record<string, unknown>;
type Event = '@changed' | string;

export type Query<T extends State> = (state: T) => unknown;
export type Reducer<T extends State> = (
  state: T,
  payload?: Record<string, unknown>
) => T | void;

export type Store<T extends State> = {
  get(query?: Query<T>): T | unknown;
  on(event: Event, reducer: Reducer<T>): () => void;
  dispatch(event: Event, payload?: Record<string, unknown>): void;
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
    get: (query): T | unknown => {
      return query ? query(clone<T>(_state)) : clone<T>(_state);
    },
    on: (event, reducer): (() => void) => {
      (_reducers[event] || (_reducers[event] = [])).push(reducer);
      // Returns function that can be called to remove a reducer
      return () => {
        _reducers[event].splice(_reducers[event].indexOf(reducer) >>> 0, 1);
      };
    },
    dispatch(event, payload): void {
      if (!_reducers[event]) return;
      // Set a copy of the new state on top of the event log.
      _log.unshift([event, clone<T>(_state)]);
      _reducers[event].forEach((r) => (_state = r(_state, payload) as T));
      // Trigger all reducer on the store changes
      _reducers['@changed'].forEach((listener) => listener(_state));
    },
    rollback(): void {
      _state = (_log.shift()?.[1] || {}) as T;
      _reducers['@changed'].forEach((listener) => listener(_state));
    },
  };
}
