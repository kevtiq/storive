import store from '../src';

let fn;
let _store;

beforeEach(() => {
  fn = jest.fn((x) => x);
  _store = store({ key: 'value' });

  _store.on('change', (_s, { value }) => ({ key: value }));
  _store.on('add', (s, { key, value }) => ({ ...s, [key]: value }));
  _store.on('@changed', fn);
});

it('Get a value', () => {
  expect(_store.get()).toEqual({ key: 'value' });
  expect(_store.get().key).toBe('value');
  _store.get().key = 'test';
  expect(_store.get().key).toBe('value');

  expect(_store.get((s) => s.key + 2)).toBe('value2');
});

it('Update a value', () => {
  _store.dispatch('change', { value: 'new value' });
  expect(_store.get().key).toBe('new value');
  _store.dispatch('add', { value: 'new value' });
  _store.dispatch('non-existing', { value: 'new value' });
  _store.on('change', (s, { value }) => ({ ...s, key2: value }));
  _store.dispatch('change', { value: 'new value 2' });
  expect(_store.get().key).toBe('new value 2');
  expect(_store.get().key2).toBe('new value 2');

  expect(fn.mock.calls.length).toBe(3);
});

it('On and off', () => {
  const myFn = (s) => ({ ...s, new: 'value' });
  const sub = _store.on('on', myFn);
  sub();
  _store.dispatch('on', (s) => s);
  expect(_store.get().new).toBe(undefined);
});

it('rollback', () => {
  _store.dispatch('change', { value: 'new value' });
  expect(_store.get().key).toBe('new value');
  _store.rollback();
  expect(_store.get().key).toBe('value');
  _store.rollback();
  expect(_store.get().key).toBe(undefined);
});
