---
title: What is a state manager
description: General introduction to state management and reactive programming
---

## The disunity

The term "state" has become widely discussed, with numerous articles and libraries offering various interpretations of "state management". Some approaches separate network cache and local state into distinct categories, while others view all data sources as interconnected, focusing instead on reactivity.

This article aims to distill insights from the industry to identify the foundations of Functional Reactive Programming (FRP), Object-Oriented Reactive Programming (OORP), cache invalidation strategies, and data management principles. Purposefully concise and definition-focused, it omits examples to keep the content brief, highlighting only the essential concepts.

## Reactivity

Reactivity is a simple pattern which you could use in many complex cases, but you always should figure out the basis to understand each case. Don't try to understand a reactivity by [how](https://github.com/kriskowal/gtor) you can use it, just focus on [what](#rp-definition) it is and try it yourself.

### RP definition

**Reactive programming is a pattern of delegating responsibility for initializing data processing to a data source**, which doesn't know dependent units and can't interact with them outside one-way notification.

The main reason for that is to move components [coupling](<https://en.wikipedia.org/wiki/Coupling_(computer_programming)>) from static definition in a code to dynamic runtime linking. In other words it helps to save [SSoT](https://en.wikipedia.org/wiki/Single_source_of_truth) when you have a few data consumers.

It is simpler to apply a caches for reactive interfaces, so, eventually, it helps you to built a fully-automatic cache invalidation system, which is huge!

It is a good for data flow description and a bad for data transaction description ([pitfalls](#rp-pitfalls)).

FRP, OORP, Flux, two-way binding, single-store, granular updates are just buzzwords on top of that, other high order patterns.
Rx, Solid, React, any Event Emitter are all about reactive programming.
Proxies / lenses / pull or push are just an API, not a sense.

> Is [React](https://reactjs.org) reactive? Yeah! It is simple to test. Do you have a control of callbacks (render functions) execution? No, React defines it. You could ask to plan an update, but it will run when React will decide to. Reactivity in implementations could be very different, [MobX](https://mobx.js.org) and [Rx](https://rxjs.dev) are both reactive, but look totally opposite to each other.

### RP pitfalls

In one to many data structures it is a perfect way to manage coupling by reactive programming: it is just a way to remove a bottle neck of code size and complexity. But when you need to describe a step-by-step business flow you should do it in one place (one code part), otherwise it will be hard to inspect and debug it, specially with a complicated reproduction with a lot of conditions.

Another disadvantage of reactive programming is the burden on the code's runtime performance, because, in fact, we describe the formation of links between code parts - subscriptions through some methods that work out only in runtime. As with everything, we should keep a balance between reactive and procedural programming, not wrapping absolutely every small operation in a reactive context to prevent excessive overhead.

> **Notes**.
>
> - [Implementation challenges in reactive programming](https://en.wikipedia.org/wiki/Reactive_programming#Implementation_techniques_and_challenges)
> - https://cycle.js.org/streams.html#streams-reactive-programming
> - https://www.apress.com/gb/blog/all-blog-posts/what-is-reactive-programming/15107746
> - [GTOR](https://github.com/kriskowal/gtor)

## Data meaning

Lets define the main terms from the general to the particular: **Information** > **Data** > **Cache** > **State** > **Transaction**.

An important feature that can be emphasized from the terminological descriptions below is that some concepts have similar characteristics and names and take a bit from different areas: the theory of databases and [ACID](https://ru.wikipedia.org/wiki/ACID) in particular, and [the theory of finite state machines (FSM)](https://en.wikipedia.org/wiki/Automata_theory). The general essence of state management, which we deal with in ordinary web development and building client applications, is ultimately the implementation of certain properties and functions of ACID and FSM in the context of reactive programming.

### Information

**Information is any kind of intelligence, regardless of the form of their presentation**.

Information just exists, it is not attached to any medium, be it a text, a proverb, or a rock painting. It is a generic word, meaning the presence of some concrete or not concrete knowledge. It is governed by channels of communication: speech, internet, writing.

### Data

**Data is structured information**.

Data is information that may or may not be tied to a medium, but it must have a clear structure expressed, for example, by the types of a statically typed language or by the documentation of its source.

A data manager is a means of managing (storing and processing) certain information. Most often it is information of a certain type and semantics - [domain](<https://en.wikipedia.org/wiki/Domain_(software_engineering)>). For example, special cases of data manager: libraries for managing forms (Formik, Final-form), routing (React-router, Router5), view (React, Lit), network (Axios).

### Cache

**A cache is an instance of data bounded to some medium and has a lifetime**.

The last condition is very important - computational resources are limited, so we cannot always recalculate derived data for every query - we need to save intermediate results. At the same time we cannot save absolutely all intermediate results, so managing the cache is always a difficult task balancing its quantity, lifetime and the resources it saves. Usually, the cache is managed by data managers with focus on the domain area which is close to IO because of a request delay. For example: React-query, RTK Query, SWR, urql, Apollo Client. Network data is a cache often, but a cache is a general term and it's not coupled with network. Reselect is a simple cache manager too.

### State

**A state is a semantically consistent cache**, at a certain point in time.

You can talk about the state as data related by some meaning, although often we are talking about some specific cache. For example, traffic light data contains information about three light bulbs, their colors and which one is on. Semantics follows from the subject area and represents the meaning of the data: only one light bulb can be turned on at a time, and the order of their switching is strictly regulated, this information is described not by the data structure, but by the code, therefore less explicit, although no less important.

The traffic light example deduced an important distinguishing feature of state as a phenomenon, is the need for data consistency: we cannot turn on one light without turning off the other, otherwise we would get erroneous data with their unpredictable impact on the user. The property of a state to be always consistent, i.e. to contain non-contradictory data, is called [atomicity](<https://en.wikipedia.org/wiki/Atomicity_(database_systems)>) in database theory.

> [Here is the test of atomicity for a few state managers](https://github.com/artalar/state-management-specification/blob/master/src/index.test.js). Btw, React.js throws all your app away from screen if uncaught error occurs in render function, there is no way to get inconsistent state during render.

### Transaction

**Transaction is a process of transition between states**. It is also a [part of the theory of databases](https://en.wikipedia.org/wiki/Database_transaction) and in the context of this article can be used as a designation of [transition operation from the finite automata theory](https://en.wikipedia.org/wiki/Transition_system).

Changing data or moving from one state to another cannot be absolutely instantaneous and requires performing a number of steps in which an error may occur, which will lead us to a dilemma - what to do with changes from already completed steps? This is a complex and debatable question that may have different answers in different systems, but the basic best practice developed in database design is the [ACID](https://en.wikipedia.org/wiki/ACID) concept, which promotes the guarantee of the atomicity of the system, which was mentioned above and means avoiding an inconsistent state (its partial update). More precisely, inconsistent data [can live](https://clojure.org/reference/transients) only in a short-term transaction, which, upon completion, must either save all the accumulated data completely and guaranteed, or, if an error occurs in the process, do not apply new changes at all.

Someone will say that discarding all changes is not consistent with modular systems, where a drop in one module should not affect other modules. This is true from the point of view of the overall operation of the application, but not from the point of view of the transaction of any particular process, and they (transactions) are just like that. I.e. each transaction is a container of some kind of logical operation, perhaps a business process, which, if it affects different modules of the system, does it, obviously, for reasons of the links between these modules that need to be taken into account or, whatever they fall into the transaction, described in some other way, outside of the main reactive context of the status manager.

## State management

So, what is state manager? It is a library for storing and processing data with reactive interface. It could expose special APIs for certain domain, have some cache invalidation strategies and should help to prevent [glitches](https://en.wikipedia.org/wiki/Reactive_programming#Glitches) and grant data consistency.

> Let's [discuss](https://github.com/artalar/reatom/discussions/444) this!
