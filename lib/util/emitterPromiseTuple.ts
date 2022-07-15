import EventEmitter from "lib/util/eventEmitter";

/**
 * An object that contains an even emitter and a promise
 */
export default interface EmitterPromiseTuple<E, P> {
  emitter: EventEmitter<E>;
  promise: Promise<P>;
}
