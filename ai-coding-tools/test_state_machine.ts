import { StateMachine } from './state_machine.js';

const log: string[] = [];

const sm = new StateMachine(
  {
    idle: {
      onExit: () => log.push("idle:exit"),
      transitions: {
        START: { target: "running", action: () => log.push("action:start") }
      }
    },
    running: {
      onEnter: () => log.push("running:enter"),
      transitions: {
        PAUSE: { target: "paused" },
        STOP: { target: "idle", guard: () => false }
      }
    },
    paused: {
      transitions: {
        RESUME: { target: "running" }
      }
    }
  } as const,
  "idle" as const
);

console.assert(sm.getState() === "idle", "initial state");
console.assert(sm.send("START") === true, "START should succeed");
console.assert(sm.getState() === "running", "should be running");
console.assert(log.join(",") === "idle:exit,action:start,running:enter", `hook order wrong: ${log.join(",")}`);

console.assert(sm.send("STOP") === false, "guarded STOP should fail");
console.assert(sm.getState() === "running", "state unchanged after guard fail");

const logLen = log.length;
sm.send("STOP");
console.assert(log.length === logLen, "no side effects on guard fail");

console.assert(sm.send("PAUSE") === true, "PAUSE should succeed");
console.assert(sm.getState() === "paused", "should be paused");

console.assert(sm.send("START") === false, "no START transition from paused");

console.assert(sm.send("RESUME") === true, "RESUME should succeed");
console.assert(sm.getState() === "running", "should be running again");

console.log("ALL TESTS PASSED");