---
name: github-issues
description: Use for GitHub issue context before an issue-driven task, when a task names an issue or issue URL, asks to inspect issue discussion, or requires finding the relevant GitHub issue with `gh`.
---

# GitHub issues

Establish GitHub issue context with `gh` against the current repository before
working on an issue-driven task.

## Establish issue context

1. Determine the candidate issues.

   - If the user provides an issue number, `#NUMBER`, or issue URL, use it as a
     candidate. Do not replace an explicitly named issue with a search.
   - Otherwise, search all issue states using distinctive terms from the task
     and an explicit result limit:

     ```shell
     gh issue list --state all --search "SEARCH_QUERY" --limit 100 --json number,title,state,labels,body
     ```

   - If no distinctive search terms are available, list all issues instead:

     ```shell
     gh issue list --state all --limit 1000 --json number,title,state,labels,body
     ```

     In this branch, treat every returned issue as a candidate and inspect each
     one; this keeps discovery exhaustive when the task provides no search
     signal.

2. Read every candidate that could apply before deciding relevance. Search
   results are for discovery only; do not use them as issue context. Request
   labels, the body, and the complete available comment collection as
   structured fields:

   ```shell
   gh issue view ISSUE_REF --json number,title,state,labels,body,comments
   ```

   An issue is relevant when its title, body, labels, or comments concern the
   task, or when the user explicitly names it.

3. Handle incomplete discovery explicitly. If a command fails, an issue cannot
   be read, or authentication/repository access is unavailable, report the
   exact failure and do not infer requirements or claim that no issue applies.
   If a command returns exactly its selected limit, treat the results as
   potentially truncated; refine the search, increase the limit, or use a
   paginated API request before concluding that the candidate set is complete.
   An untruncated search with no candidates confirms that no matching issue was
   found.

4. Summarize the applicable issue context before continuing: cite the relevant
   issue number(s), extract requirements and constraints, and note unresolved
   points from the discussion. If no issue applies, state that explicitly.

You are done when every candidate that could apply has been viewed with its
labels, body, and comments; incomplete or inaccessible results have been
resolved or reported; and you have either used a written issue-context summary
for the task or explicitly confirmed that no issue applies. Never infer
requirements from an issue title or list output alone.
