type Remove = () => void;
type State = Record<string, unknown>;
type Payload = Record<string, unknown>;
type Event = '@changed' | '@undo' | '@redo' | string;
type History<T> = { past: T[]; future: T[]; current: T };

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
  undo(): void;
  redo(): void;
};

// Shallow equality check of objects
function shallow(obj1: State, obj2: State): boolean {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(
      (key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
    )
  );
}

export default function store<T extends State>(init: T): Store<T> {
  const _reducers: Record<Event, Reducer<T>[]> = { '@changed': [] };
  const _history: History<T> = { past: [], future: [], current: init };

  return {
    get: (query?): T | unknown => {
      const copy = Object.assign({}, _history.current);
      return query ? query(copy) : copy;
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
      let copy = Object.assign({}, _history.current);
      // Set a copy of the new state on top of the event log.
      _history.past.push(copy);
      _history.future = [];
      _reducers[event].forEach(
        (r) => (_history.current = r(_history.current, payload) as T)
      );

      // Trigger all reducer on the store changes
      if (!shallow(copy, _history.current)) {
        copy = Object.assign({}, _history.current);
        _reducers['@changed'].forEach((r) => r(copy, payload, event));
      }
    },
    undo(): void {
      if (!_history.past.length) return;
      _history.future.push(Object.assign({}, _history.current));
      _history.current = _history.past.pop() as T;
      _reducers['@changed'].forEach((l) =>
        l(_history.current, undefined, '@undo')
      );
    },
    redo(): void {
      if (!_history.future.length) return;
      _history.past.push(Object.assign({}, _history.current));
      _history.current = _history.future.pop() as T;
      _reducers['@changed'].forEach((l) =>
        l(_history.current, undefined, '@redo')
      );
    },
  };
}
