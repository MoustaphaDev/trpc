import { Context, router } from './__router';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client/src';
import * as trpc from '@trpc/server/src';
import * as trpcExpress from '@trpc/server/src/adapters/express';
import AbortController from 'abort-controller';
import express from 'express';
import http from 'http';
import fetch from 'node-fetch';

async function startServer() {
  const createContext = (
    _opts: trpcExpress.CreateExpressContextOptions,
  ): Context => {
    const getUser = () => {
      if (_opts.req.headers.authorization === 'meow') {
        return {
          name: 'KATT',
        };
      }
      return null;
    };

    return {
      user: getUser(),
      info: _opts.info,
    };
  };

  // express implementation
  const app = express();

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router,
      createContext,
    }),
  );
  const { server, port } = await new Promise<{
    server: http.Server;
    port: number;
  }>((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        port: (server.address() as any).port,
      });
    });
  });

  const client = createTRPCProxyClient<typeof router>({
    links: [
      httpBatchLink({
        url: `http://localhost:${port}/trpc`,
        AbortController: AbortController as any,
        fetch: fetch as any,
      }),
    ],
  });

  return {
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => {
          err ? reject(err) : resolve();
        }),
      ),
    port,
    router,
    client,
  };
}

let t: trpc.inferAsyncReturnType<typeof startServer>;
beforeAll(async () => {
  t = await startServer();
});
afterAll(async () => {
  await t.close();
});

test('simple query', async () => {
  expect(
    await t.client.hello.query({
      who: 'test',
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "text": "hello test",
    }
  `);
  const res = await t.client.hello.query();
  expect(res).toMatchInlineSnapshot(`
    Object {
      "text": "hello world",
    }
  `);
});

test('request info from context should include both calls', async () => {
  const res = await Promise.all([
    t.client.hello.query({
      who: 'test',
    }),
    t.client.request.info.query(),
  ]);

  expect(res).toMatchInlineSnapshot(`
    Array [
      Object {
        "text": "hello test",
      },
      Object {
        "calls": Array [
          Object {
            "input": Object {
              "who": "test",
            },
            "path": "hello",
            "type": "query",
          },
          Object {
            "path": "request.info",
            "type": "query",
          },
        ],
        "isBatchCall": true,
      },
    ]
  `);
});
