/**
 * Starts an async task (typically a data loader) from a React effect.
 *
 * The task runs in a microtask, so nothing — in particular no state update — happens
 * synchronously inside the effect. Errors are logged instead of becoming unhandled
 * promise rejections.
 */
export function runAsync(task: () => Promise<unknown>): void {
  Promise.resolve()
    .then(task)
    .catch((error) => console.error(error));
}
