import { routerToServerAndClientNew } from './___testHelpers';
import { expectTypeOf } from 'expect-type';
import { trpc as t } from '../src';

test('children', async () => {
  const router = t.router({
    foo: t.procedure.query(() => 'bar'),
    child: t.router({
      childQuery: t.procedure.query(() => 'asd'),
      grandchild: t.router({
        foo: t.procedure.query(() => 'grandchild' as const),
        mut: t.procedure.mutation(() => 'mut'),
      }),
    }),
  });

  const { queries, mutations, subscriptions, procedures } = router._def;
  expect({
    queries,
    mutations,
    subscriptions,
    procedures,
  }).toMatchInlineSnapshot(`
    Object {
      "mutations": Object {
        "child.grandchild.mut": [Function],
      },
      "procedures": Object {
        "child.childQuery": [Function],
        "child.grandchild.foo": [Function],
        "child.grandchild.mut": [Function],
        "foo": [Function],
      },
      "queries": Object {
        "child.childQuery": [Function],
        "child.grandchild.foo": [Function],
        "foo": [Function],
      },
      "subscriptions": Object {},
    }
  `);

  const { close, proxy } = routerToServerAndClientNew(router);

  expect(await proxy.foo.query()).toBe('bar');

  expect(await proxy.child.grandchild.foo.query()).toBe('grandchild');
  expect(await proxy.child.grandchild.mut.mutate()).toBe('mut');

  return close();
});

test('w/o children', async () => {
  const foo = t.procedure.query(() => 'bar');
  const router = t.router({
    foo,
  });

  expectTypeOf(router._def.procedures.foo).toMatchTypeOf(foo);
});
