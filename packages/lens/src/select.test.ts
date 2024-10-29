import { createTestCtx } from '@reatom/testing'
import { it, describe, test, expect, vi } from 'vitest'
import { atom, AtomMut } from '@reatom/core'
import { select } from './select'

describe('select', () => {
  // it('should not recompute the end atom if the source atom changed', () => {
  //   let track = 0;
  //   const a = atom(0);
  //   const b = atom((ctx) => {
  //     track++;
  //     return select(ctx, (ctx) => ctx.spy(a) % 3);
  //   });
  //   const ctx = createTestCtx();

  //   ctx.subscribeTrack(b);
  //   expect(ctx.get(b)).toBe(0);
  //   expect(track).toBe(1);

  //   a(ctx, 3);
  //   a(ctx, 6);
  //   expect(ctx.get(b)).toBe(0);
  //   expect(track).toBe(1);

  //   a(ctx, 10);
  //   expect(ctx.get(b)).toBe(1);
  //   expect(track).toBe(2);
  // });

  // it('many selects should work', () => {
  //   const list = atom(new Array<{ value: AtomMut<number> >());
  //   const target = atom((ctx) => {
  //     const length = select(ctx, (ctx) => ctx.spy(list).length);
  //     const sum = select(ctx, (ctx) => ctx.spy(list).reduce((acc, el) => acc + ctx.spy(el.value), 0));

  //     return { length, sum };
  //   });
  //   const ctx = createTestCtx();
  //   const track = ctx.subscribeTrack(target);

  //   expect(ctx.get(target)).toEqual({ length: 0, sum: 0 });

  //   const value = atom(1);
  //   list(ctx, [{ value }]);
  //   expect(ctx.get(target)).toEqual({ length: 1, sum: 1 });
  //   expect(track.calls.length).toBe(2);

  //   value(ctx, 2);
  //   expect(ctx.get(target)).toEqual({ length: 1, sum: 2 });
  //   expect(track.calls.length).toBe(3);

  //   list(ctx, [{ value }]);
  //   expect(ctx.get(target)).toEqual({ length: 1, sum: 2 });
  //   expect(track.calls.length).toBe(3);
  // });

  // it('prevent select memoization errors', () => {
  //   const list = atom(new Array<AtomMut<{ name: string; value: number }>>());
  //   const sum = atom((ctx) => ctx.spy(list).reduce((acc, el) => acc + select(ctx, (ctx) => ctx.spy(el).value), 0));
  //   const ctx = createTestCtx();
  //   const track = ctx.subscribeTrack(sum);

  //   expect(track.calls.length).toBe(1);
  //   expect(ctx.get(sum)).toBe(0);

  //   expect(() =>
  //     list(ctx, [atom({ name: 'a', value: 1 }), atom({ name: 'b', value: 2 })])
  //   ).toThrow('Reatom error: multiple select with the same "toString" representation is not allowed');
  //   // expect(track.calls.length).toBe(2);
  //   // expect(ctx.get(sum)).toBe(3);
  // });

  it('should filter equals', () => {
    const n = atom(1)
    const odd = atom((ctx) =>
      select(
        ctx,
        (selectCtx) => selectCtx.spy(n),
        (prev, next) => next % 2 === 0,
      ),
    )

    const ctx = createTestCtx()
    const track = ctx.subscribeTrack(odd)
    track.calls.length = 0

    n(ctx, 2)
    expect(track.calls.length).toBe(0)

    n(ctx, 4)
    expect(track.calls.length).toBe(0)

    n(ctx, 5)
    expect(track.calls.length).toBe(1)
    expect(track.lastInput()).toBe(5)

    n(ctx, 6)
    expect(track.calls.length).toBe(1)
  })
})
