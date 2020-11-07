export type StoreValue = Record<string, unknown>;
export type StoreListener = (value: StoreValue) => void;
export type StoreUpdateFunction = (value: StoreValue) => StoreValue;

export type Store = {
  get(callback?: StoreListener): StoreValue;
  update(fn: StoreUpdateFunction): void;
  remove(callback: StoreListener): void;
  rollback(events: number, update: boolean): StoreValue;
};

export default function store(init: StoreValue): Store {
  let _state = init;
  const _listeners: StoreListener[] = [];
  const _history: StoreValue[] = [];

  return {
    get(listener): StoreValue {
      if (listener) _listeners.push(listener);
      return _state;
    },
    update(fn): void {
      _history.unshift({ ..._state });
      _state = fn(_state);
      _listeners.forEach((listener): void => listener(_state));
    },
    remove(listener): void {
      _listeners.splice(_listeners.indexOf(listener) >>> 0, 1);
    },
    rollback(events = 1): StoreValue {
      if (events < 0) return _state;
      const length = _history.length < events ? _history.length : events;

      _state = _history[length - 1];
      _history.splice(0, length);
      _listeners.forEach((listener): void => listener(_state));

      return _state;
    },
  };
}
