type State = Record<string, unknown>;
type Payload = Record<string, unknown>;
type Reducer = (state: State, payload?: Payload) => State | void;
type RemoveReducer = () => void;
type Query = (state: State) => State;
type Event = '@changed' | string;
type Reducers = Record<Event, Reducer[]>;
type EventLog = [Event, State][];

type Store = {
  get(query?: Query): State;
  on(event: Event, reducer: Reducer): RemoveReducer;
  dispatch(event: Event, payload?: Payload): void;
  rollback(): void;
};

// Used to ensure immutability
function clone<T>(state: T): T {
  return JSON.parse(JSON.stringify(state));
}

export default function store(init: State): Store {
  let _state = init;
  const _reducers: Reducers = { '@changed': [] };
  const _log: EventLog = [];

  return {
    get: (query): State => {
      return query ? query(clone<State>(_state)) : clone<State>(_state);
    },
    on: (event, reducer): RemoveReducer => {
      (_reducers[event] || (_reducers[event] = [])).push(reducer);
      // Returns function that can be called to remove a reducer
      return () => {
        _reducers[event].splice(_reducers[event].indexOf(reducer) >>> 0, 1);
      };
    },
    dispatch(event, payload): void {
      if (!_reducers[event]) return;
      // Set a copy of the new state on top of the event log.
      _log.unshift([event, clone<State>(_state)]);
      _reducers[event].forEach((r) => (_state = r(_state, payload) as State));
      // Trigger all reducer on the store changes
      _reducers['@changed'].forEach((listener) => listener(_state));
    },
    rollback(): void {
      _state = _log.pop()?.[1] || {};
      _reducers['@changed'].forEach((listener) => listener(_state));
    },
  };
}
