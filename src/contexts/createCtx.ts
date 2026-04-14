import { createContext, useContext } from 'react';

// createCtx returns a tuple: [Context, useHook]
export function createCtx<A>() {
  const ctx = createContext<A | undefined>(undefined);
  function useCtx() {
    const c = useContext(ctx);
    if (c === undefined) throw new Error('useCtx must be used within a Provider');
    return c as A;
  }
  return [ctx, useCtx] as const;
}
