import { animationFrameScheduler, defer, interval, map, takeWhile } from 'rxjs';

export const ease = (x: number) => {
  return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
};

export const duration = (t: number) =>
  defer(() => {
    const t0 = Date.now();
    return interval(0, animationFrameScheduler).pipe(
      map(() => Date.now() - t0),
      map((dt: number) => dt / t),
      takeWhile((n) => n <= 1)
    );
  });

export const distance = (x: number, t: number) =>
  duration(t).pipe(map((t: number) => ease(t) * x));
