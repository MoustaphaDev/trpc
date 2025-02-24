import { AnyRouter, inferRouterContext } from '../../core';
import {
  HTTPBaseHandlerOptions,
  TRPCRequestInfo,
} from '../../http/internals/types';

export type FetchCreateContextFnOptions = {
  req: Request;
  resHeaders: Headers;
  info: TRPCRequestInfo;
};

export type FetchCreateContextFn<TRouter extends AnyRouter> = (
  opts: FetchCreateContextFnOptions,
) => inferRouterContext<TRouter> | Promise<inferRouterContext<TRouter>>;

export type FetchCreateContextOption<TRouter extends AnyRouter> =
  unknown extends inferRouterContext<TRouter>
    ? {
        /**
         * @link https://trpc.io/docs/context
         **/
        createContext?: FetchCreateContextFn<TRouter>;
      }
    : {
        /**
         * @link https://trpc.io/docs/context
         **/
        createContext: FetchCreateContextFn<TRouter>;
      };

export type FetchHandlerOptions<TRouter extends AnyRouter> =
  HTTPBaseHandlerOptions<TRouter, Request> & FetchCreateContextOption<TRouter>;
