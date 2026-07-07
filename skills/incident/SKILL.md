---
name: incident
description: Write a blameless post-mortem for a prod incident under docs/incidents/.
disable-model-invocation: true
---

Write up a production incident as a blameless **post-mortem**.

1. **Gather before you ask.** Read the incident thread the user gives you and the code it implicates, and derive every fact you can yourself — timeline, the offending commit/migration, the path or gate that broke. Verify each file/line reference before citing it.
2. **Grill only the judgement calls** the thread and code can't settle: status, severity, how much personal ownership to name, and the action items.
3. **Write `docs/incidents/<incident-date>-<slug>.md`**, matching the most recent file in that folder section-for-section. Every root cause must name a _system gap_ — a missing guardrail, unrepresentative dev data, what code review can't see — never a person; name people only factually, as the existing post-mortems do.
4. **Append it to `docs/incidents/README.md`**, newest first, with a one-paragraph hook.
5. **Fold recurring prevention** into the relevant CONTEXT/ADR or a code guard — but only decisions already made; everything still undecided stays an action item.
6. **Hand off:** post-mortems live in-repo as the source of truth — remind the user to copy the markdown into the SharePoint template so business has a view.
