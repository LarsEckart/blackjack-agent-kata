---
name: backend-unit-testing
description: |
  Backend unit testing for this Java application. Use when adding, reviewing,
  or repairing unit tests in the backend, or when a backend change needs a
  deterministic test seam.
---

# Backend unit testing

Keep tests deterministic, behavior-focused, and isolated from external
infrastructure.

## Project conventions

- Annotate each test class with
  `@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)`.
- Every test follows Arrange–Act–Assert, with a blank line between phases.
- Use JUnit Jupiter assertions.

Run backend tests from the repository root with:

```sh
cd backend
./gradlew test --tests 'kata.blackjack.<TestClass>'
./gradlew test
```


## Process

1. **Map the behavior.** Read the target production class and its direct
   collaborators. Identify the public behavior, state transitions, side
   effects, failure paths, and nondeterministic inputs affected by the change.

   **Done means:** every changed behavior has an observable outcome, and every
   relevant public branch has a planned test or an explicit reason it is out of
   scope.

2. **Assess the module and choose the test surface.** Before writing tests,
   decide whether the production module's public interface is a meaningful test
   surface. When the module contains domain behavior, identify its domain nouns,
   value objects, commands, state transitions, and invariants. Prefer a deep
   domain module with a small typed interface: explicit domain inputs in and
   typed domain results out.

   Push back before writing tests when the class:

   - mixes domain behavior with transport, serialization, or infrastructure;
   - requires runtime objects such as `HttpExchange` to exercise core behavior;
   - exposes no controllable seam for randomness, time, or I/O;
   - returns JSON, XML, SQL, or other serialized strings so tests can inspect
     domain state;
   - makes tests assert serialized fragments or formatting to verify domain
     behavior; or
   - requires reflection, broad mocks, null collaborators, or a large object
     graph.

   Keep domain behavior free from transport, persistence, serialization, and
   nondeterministic creation. Serialization is an adapter concern: do not merely
   move HTTP response writing out while leaving the domain module returning an
   encoded string. Use typed values or result objects for domain behavior, and
   test serialized output only at the adapter or handler boundary.

   Choose one outcome:

   - **Test:** the existing interface is suitable;
   - **Refactor:** make the smallest behavior-preserving change that creates the
     right seam and exposes typed domain results; or
   - **Redesign:** propose a better module/interface shape before writing tests.

   A redesign must not be smuggled into a test task. If it changes the public
   interface or crosses multiple responsibilities, explain the recommendation
   and ask before changing direction.

   Keep real lightweight collaborators that make the behavior meaningful.
   Replace external or nondeterministic boundaries—such as databases, networks,
   filesystems, clocks, random sources, identifiers, and message brokers—with
   small fakes or injected seams.

   Do not start servers, bind ports, call real external services, sleep, or use
   end-to-end object graphs in a unit-test suite. Do not test private methods
   through reflection, mock the unit under test, or mock every collaborator.

   **Done means:** the module's domain responsibilities and test surface are
   explicit, any test crosses the intended interface rather than an accidental
   transport or implementation seam, and domain tests assert typed values or
   results while serialization is tested only at its adapter boundary.

3. **Control nondeterminism.** Supply explicit inputs for time, randomness,
   generated identifiers, scheduling, retries, and external responses. Prefer
   dependency injection or a narrow test seam over global seeds, sleeps, and
   timing assumptions. Keep mutable fixture state local to each test and make
   setup order visible.

   **Done means:** repeated runs produce the same result without relying on
   machine state, execution order, network availability, or accidental timing.

4. **Write the behavior test.** Name the test with the expected outcome and
   condition, then structure it as Arrange–Act–Assert:

   - **Arrange:** create the inputs, initial state, and required collaborators;
   - **Act:** perform one focused behavior and capture its return value or error;
   - **Assert:** verify the observable outcome and relevant side effects.

   Test the observable contract, choosing the outcomes that apply:

   - returned values or result objects;
   - thrown errors and their meaningful details;
   - state changes observable through the public API;
   - externally visible side effects such as persisted, emitted, or sent data;
   - interactions only when the interaction itself is part of the contract.

   Cover the normal path and the edge and failure paths relevant to the change.
   Use stable assertions that tolerate incidental representation details while
   still failing for meaningful regressions. Avoid asserting private data
   structures, incidental call counts or order, serialization ordering, or
   coverage numbers unless those are part of the contract.

   **Done means:** the test has a clear Arrange, one focused Act, and
   observable assertions that fail for a meaningful regression rather than
   merely proving that code executed.

5. **Run the tight loop.** Run the focused test first, then the complete backend
   suite. Diagnose compilation, dependency, and environment failures
   separately from assertion failures. Never skip, disable, weaken, or delete a
   test just to obtain a green build.

   **Done means:** focused and complete backend test commands pass, and the
   final diff accounts for every fixture, seam, and configuration change
   introduced.

## Review gate

For every changed test, check:

- the unit boundary tests behavior rather than implementation details;
- the test name states the expected outcome and relevant condition;
- Arrange, Act, and Assert are distinct, with one focused Act;
- all inputs that affect the result are controlled;
- the test is isolated from external infrastructure and shared mutable state;
- assertions verify the observable contract, including applicable return values,
  errors, state changes, and side effects;
- domain tests assert typed values or results rather than serialized output, with
  serialization tested only at its adapter boundary;
- normal, edge, and failure behavior relevant to the change is covered;
- fixtures and test names explain the scenario; and
- both Gradle test commands have been run when a focused test exists.

A review is complete only when each relevant finding is resolved or explicitly
reported and the applicable checks have been verified.

## Avoid

- assuming a different language, framework, assertion library, or build tool;
- full-system tests disguised as unit tests;
- global randomness, sleeps, retries, or timing-based assertions;
- reflection-based private-method tests and broad mocking; and
- test changes that optimize for coverage metrics instead of behavior.
