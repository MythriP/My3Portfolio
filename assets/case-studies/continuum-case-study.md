# Continuum: durable agents for work that takes time

*A Google ADK framework for multi-step agents that investigate, keep their place, and return useful evidence to a person.*

Mythri Popuri · Independent build · 2026  
Python · Google ADK · Durable workflows · Evaluation · Human review

## The challenge

Operational work rarely arrives as one neat question. Evidence can be incomplete,
decisions may need a person, and a workflow can span interruptions. An agent that
forgets where it was or presents a confident guess as a verified finding creates
more work for the person it is meant to help.

I explored this through a financial-reconciliation reference workflow using
fictional data. Continuum treats each discrepancy as a case that can be
investigated, checked, paused when information is missing, and resumed later.

## What I built

Continuum is a durable, multi-step agent framework built with Google ADK. An
agent gathers relevant evidence and returns a structured recommendation. A
separate verification step checks the finding; the workflow can wait for more
information, resume with context, and bring the result to a person for review.
Analyst corrections can become reusable guidance only after an evaluation gate.

The reference implementation uses SQLite for local case state. Its production
architecture is designed for Google Cloud, with managed services supporting
scheduled execution, durable state, incoming evidence, model access, and
observability.

## Engineering decisions

- **Keep the evidence visible.** Recommendations carry the context needed for a
  person to assess them, rather than relying on a fluent explanation alone.
- **Separate investigation from verification.** The agent proposes a finding;
  deterministic checks provide an independent signal before human review.
- **Treat waiting as part of the workflow.** Missing information pauses a case;
  it does not force the agent to guess or restart from scratch.
- **Make learning earn its way in.** Corrections are evaluated against held-out
  examples before they can influence future recommendations.
- **Keep a person in the decision loop.** Continuum prepares work for review;
  approval remains with the responsible analyst.

## Production success targets

These are target operating thresholds for an eventual production deployment,
not measured outcomes from the current reference evaluation.

| Target | Measure |
|---|---|
| **Under 1%** materially incorrect recommendations | Among cases presented as ready for review, based on independent adjudication |
| **0** duplicate or unauthorized actions | Absolute count, reconciled against recorded outcomes |
| **95%** recommendations accepted without substantive analyst correction | Accepted without substantive changes divided by recommendations reviewed |

Review-ready time, human correction effort, and safe escalation rate add context:
they show whether the system saves analyst effort while correctly recognizing
when it needs more information or human judgment.

## Evaluation

The reference workflow is exercised on synthetic reconciliation cases, including
incomplete evidence, ambiguous findings, interruptions, and recovery. Results
are reported separately from production targets and should include the number
and mix of evaluated cases.

## Walkthrough

The embedded walkthrough follows a fictional case through investigation,
verification, waiting, human review, recovery, and a gated lesson. The final
scene shows the architecture designed for Google Cloud.

[Explore Continuum on GitHub](https://github.com/MythriP/continuum)
