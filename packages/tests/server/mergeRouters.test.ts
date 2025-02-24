import { waitError } from './___testHelpers';
import { initTRPC } from '@trpc/server';

test('mergeRouters', async () => {
  const t = initTRPC.create();

  const router1 = t.router({
    foo: t.procedure.query(() => 'foo'),
  });
  const router2 = t.router({
    bar: t.procedure.query(() => 'bar'),
  });
  const merged = t.mergeRouters(router1, router2);
  const caller = merged.createCaller({});

  await expect(caller.foo()).resolves.toBe('foo');
  await expect(caller.bar()).resolves.toBe('bar');
});

test('good merge: one has default formatter', async () => {
  const t1 = initTRPC.create({});

  const t2 = initTRPC.create({
    errorFormatter: (fmt) => fmt.shape,
  });

  const router1 = t1.router({
    foo: t1.procedure.query(() => 'foo'),
  });
  const router2 = t2.router({
    bar: t1.procedure.query(() => 'bar'),
  });

  const merged = t1.mergeRouters(router1, router2);
  const caller = merged.createCaller({});

  await expect(caller.foo()).resolves.toBe('foo');
  await expect(caller.bar()).resolves.toBe('bar');
});

test('good merge: one has default transformer', async () => {
  const t1 = initTRPC.create({});

  const t2 = initTRPC.create({
    transformer: {
      deserialize: (v) => v,
      serialize: (v) => v,
    },
  });

  const router1 = t1.router({
    foo: t1.procedure.query(() => 'foo'),
  });
  const router2 = t2.router({
    bar: t1.procedure.query(() => 'bar'),
  });

  const merged = t1.mergeRouters(router1, router2);
  const caller = merged.createCaller({});

  await expect(caller.foo()).resolves.toBe('foo');
  await expect(caller.bar()).resolves.toBe('bar');
});
test('bad merge: error formatter', async () => {
  const t1 = initTRPC.create({
    errorFormatter: (fmt) => fmt.shape,
  });

  const t2 = initTRPC.create({
    errorFormatter: (fmt) => fmt.shape,
  });

  const router1 = t1.router({
    foo: t1.procedure.query(() => 'foo'),
  });
  const router2 = t2.router({
    bar: t1.procedure.query(() => 'bar'),
  });

  expect(() =>
    t1.mergeRouters(router1, router2),
  ).toThrowErrorMatchingInlineSnapshot(
    `"You seem to have several error formatters"`,
  );
});

test('bad merge: transformer', async () => {
  const t1 = initTRPC.create({
    transformer: {
      deserialize: (v) => v,
      serialize: (v) => v,
    },
  });

  const t2 = initTRPC.create({
    transformer: {
      deserialize: (v) => v,
      serialize: (v) => v,
    },
  });

  const router1 = t1.router({
    foo: t1.procedure.query(() => 'foo'),
  });
  const router2 = t2.router({
    bar: t1.procedure.query(() => 'bar'),
  });

  expect(() =>
    t1.mergeRouters(router1, router2),
  ).toThrowErrorMatchingInlineSnapshot(
    `"You seem to have several transformers"`,
  );
});
