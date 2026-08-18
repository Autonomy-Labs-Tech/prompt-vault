/**
 * Generic finite state machine (TypeScript 5.x, strict mode, no external deps).
 *
 * On successful transition: onExit -> action -> onEnter.
 * On rejected transition (no definition or guard fails): return false, no side effects.
 */
export interface Transition<S extends string, E extends string> {
  target: S;
  guard?: () => boolean;
  action?: () => void;
}

export interface StateConfig<S extends string, E extends string> {
  onEnter?: () => void;
  onExit?: () => void;
  transitions: Partial<Record<E, Transition<S, E>>>;
}

export interface StateMachineOptions<S extends string, E extends string> {
  logTransitions?: boolean;
  onLog?: (msg: string) => void;
}

export class StateMachine<S extends string, E extends string> {
  private current: S;
  private readonly states: Record<S, StateConfig<S, E>>;
  private readonly options: StateMachineOptions<S, E>;

  constructor(
    states: Record<S, StateConfig<S, E>>,
    initialState: S,
    options?: StateMachineOptions<S, E>
  ) {
    this.states = states;
    this.current = initialState;
    this.options = options ?? {};
  }

  getState(): S {
    return this.current;
  }

  send(event: E): boolean {
    const config = this.states[this.current];
    const transition = config.transitions[event];
    if (!transition) {
      this.log(`[SM] no transition from ${this.current} --${String(event)}--> ?`);
      return false;
    }
    if (transition.guard && !transition.guard()) {
      this.log(`[SM] guard blocked ${this.current} --${String(event)}--> ${transition.target}`);
      return false;
    }
    const from = this.current;
    if (config.onExit) config.onExit();
    if (transition.action) transition.action();
    this.current = transition.target;
    const targetConfig = this.states[this.current];
    if (targetConfig && targetConfig.onEnter) targetConfig.onEnter();
    this.log(`[SM] from ${from} --${String(event)}--> ${this.current}`);
    return true;
  }

  private log(msg: string): void {
    if (this.options.logTransitions) {
      if (this.options.onLog) this.options.onLog(msg);
      else console.log(msg);
    }
  }
}
