---
description: Append this session's prompts to docs/prompts.md
---

Append every prompt I sent in this session to `docs/prompts.md`, in order.

Rules:

1. **Skip your own invocation.** The `/save-prompts` message that triggered this
   run is not a session prompt — never log it. Do not log any earlier
   `/save-prompts` invocation either.
2. **Skip anything already in the file.** Read `docs/prompts.md` first and only
   append prompts that are not recorded yet. If every prompt is already there,
   change nothing and say so.
3. **Verbatim.** Quote each prompt exactly as I typed it, as a markdown
   blockquote (`> `), one `> ` per line, blank `>` between paragraphs. Do not
   fix typos, reword, shorten, or summarise. Truncate only a pasted block longer
   than ~40 lines, and mark the cut with `> *(…)*`.
4. **Match the existing format:**

   ```md
   ## <n>. <short title for the prompt>

   > the prompt, verbatim

   **Result:** one or two sentences on what the prompt actually produced.
   ```

   `<n>` continues the numbering already in the file. Use `### <n>.<m>` sub-entries
   when several prompts belong to one piece of work, the way section 13 does.
5. **Result lines describe what happened**, not what was asked — name the files
   written or changed. If a prompt produced nothing (a question, a rejected
   idea), say that plainly.
6. Append only. Never rewrite or renumber existing entries, and do not touch the
   file header.

Write the file, then report the section numbers you added.
