# actordom

## Overview

Actor DOM is a library

Actor DOM is a library for building interactive user interfaces. Actor DOM attempts to simplify the mental model by reducing it down to 2 core concepts:

- The [Actor Model](https://en.wikipedia.org/wiki/Actor_model), a message-based way of communication.
- JSX as a representation of DOM.

Everything that happens in an Actor DOM project is built on top of these concepts, making the framework flexible to your needs.

### Actors

The unit with which you will be doing all of your work in Actor DOM is through the actor. An actor is an isolated unit of computation that you communicate by passing type-safe messages between. Here's a basic example of two actors communicating `ping` and `pong` messages to each other.

```ts
import { send, spawn, process, Process } from 'actordom';

class Ping {
  count = 0;
  receive([name, pid]: ['ping', Process<Pong>]) {
    switch(name) {
      case 'ping': {
        if(this.count === 5) {
          return;
        }
        this.count++;
        send(pid, 'pong', process(this));
        break;
      }
    }
  }
}

class Pong {
  receive([name, pid]: ['pong', Process<Ping>]) {
    switch(name) {
      case 'pong': {
        send(pid, 'ping', process(this));
        break;
      }
    }
  }
}

let ping = spawn(Ping);
// Send an initial ping to get things started.
send(ping, 'ping', spawn(Pong));
```

This may seem like a lot to throw at you at once, but this is essentially everything there is to actors. Understand this and you understand most of what Actor DOM does. It also does JSX rendering and we'll get to that later, but you probably already understand that well enough.

Let's break this down to understand what's happening.

#### Creating an actor

An actor is any class with a method named `receive()` that takes a tuple of `[string, any]` as its only argument. This argument is called the actor's __mailbox__ and will be explained in this next section.

```js
// This is all that's required to create an actor.

class Counter {
  receive([]: [string, any]) {
    
  }
}
```

#### Mailbox

The actor's mailbox is how it defines the types of messages it takes. The mailbox is of type `[string, any]` at its weakest, but you will define each message as a discriminated union of possible messages.

Message types are types of:

- __name__: The `string` message name.
- __value__: A value associated with this message, such as an `Event` or any sort of data.

For example, this is a counter that accepts `increment`, `decrement`, and `stop` messages.

```ts
type mailbox = ['increment', 1] |
  ['decrement', -1] |
  ['stop', null];

class Counter {
  receive([name, data]: mailbox) {
    switch(name) {
      case 'increment': {
        // ...
        break;
      }
      case 'decrement': {
        // ...
        break;
      }
      case 'stop': {
        // ...
        break;
      }
    }
  }
}
```

It's conventional in Actor DOM to define the mailbox as a `type` first (you might want to share it with others) and then to destructure the value in the argument.

__Note on typing__: Actor DOM is strongly typed, and most of that is things to the mailbox. Once you have typed all of your possible messages, any attempt to `send()` a message will get autocomplete for possible accepted messages and the value. They'll also receive errors for sending invalid messages.

Additionally all of the examples in this overview use `switch` because TypeScript conveniently narrows the type of message for you based on which name case is selected.

#### Spawning actors

To create an instance of an Actor you use the `spawn` function. You *do not* use `new`. This is because all communication between actors needs the `process` (explained in the next section), which is the return value of spawn.

```js
import { spawn } from 'actordom';

let counter  = spawn(Counter);
```

#### Process

TODO
