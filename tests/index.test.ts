import store from '../src';

let fn;
let _store;

beforeEach(() => {
  fn = jest.fn((x) => x);
  _store = store({ key: 'value' });
});

it('Get a value', () => {
  expect(_store.get()).toEqual({ key: 'value' });
});

it('Update a value', () => {
  _store.update(() => ({ key: 'new value' }));
  expect(_store.get()).toEqual({ key: 'new value' });
});

it('subscribe to a change', () => {
  expect(fn.mock.calls.length).toBe(0);
  _store.get(fn);
  _store.update(() => ({ key: 'new value' }));
  expect(fn.mock.calls.length).toBe(1);
  _store.remove(fn);
  _store.update(() => ({ key: 'new value' }));
  expect(fn.mock.calls.length).toBe(1);
});

it('rollback', () => {
  _store.update(() => ({ key: 'new value 1' }));
  _store.update(() => ({ key: 'new value 2' }));
  _store.update(() => ({ key: 'new value 3' }));
  _store.update(() => ({ key: 'new value 4' }));

  expect(_store.get()).toEqual({ key: 'new value 4' });
  expect(_store.rollback()).toEqual({ key: 'new value 3' });
  expect(_store.rollback(5)).toEqual({ key: 'value' });
  expect(_store.rollback(-1)).toEqual({ key: 'value' });
  expect(_store.get()).toEqual({ key: 'value' });
});
