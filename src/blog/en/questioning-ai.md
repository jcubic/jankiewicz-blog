---
title: The Importance of Questioning When Using AI Agents
description: "How to make the AI agent always question you, so you know when your wrong."
date: 2026-07-03
author: jcubic
tags: articles_en
---

The other day I've seen this post in a Twitter community.

https://x.com/LacTranAn/status/2072559283657740604

And few days before that I had this idea when the agent was thinking and struggle to follow my
instructions.  I was looking at his reasoning process. And think myself, to end his missery and just
change the taktic.

I asked him to implement something in Bash, and he was "wrestling" and was thiking how to write this
bash script to follow my instructions.  So canceled his reasoning, and said "let's use Python".

Here is a transcript with collapsed thinking, same experience as I have with Agent-Shell in Emacs.

When I was working on my project [Clarity](https://github.com/jcubic/Clarity)

## Conversation with Claude

<strong>{% raw %}## User (2026-06-27 01:03:15){% endraw %}</strong>

it doesn't make sense to install composer dependenices twice. Please modify the script to be in
bash. So there is no need to have dependenices.

<details>
<summary>
<strong>{% raw %}## Agent's Thoughts (2026-06-27 01:03:18){% endraw %}</strong>
</summary>
{% raw %}
The user wants me to convert the `extract-icons.php` script to bash so that it doesn't require PHP
(and therefore Composer dependencies) to run during the build. The extract script reads SVG files
and extracts path `d` attributes via regex - this can easily be done with bash + grep/sed.

Actually wait, let me re-read. The user says "it doesn't make sense to install composer dependencies
twice." The Makefile has `make vendor` which runs `composer install`, and then `make icons` which
runs PHP scripts that don't need Composer dependencies (they're standalone PHP scripts).

I see now - the GitHub workflow runs `make vendor` and then Wasmer's `--build-remote` probably also
runs `composer install`. But the real issue is that the user wants to eliminate PHP entirely from
the build step so there's no need for `setup-php` in the workflow at all. I should convert both the
extract and build icon scripts to bash, which means reading through files.txt, processing each SVG
file from the theme directory, and extracting the path `d` attributes using standard Unix tools.

For the extract script, I need to output valid JSON from bash - I can either use `jq` or manually
construct the JSON with proper comma handling. For the build script, it's mostly string replacement
work where I read the icons.json, find the template files, and for each template-icon combination,
replace the placeholders and optimize the SVG output.

The real motivation here is that converting these to bash means the GitHub workflow won't need PHP
setup just to extract the icons - the Composer install is still needed for the actual web app
(Slim/Twig), but that's handled separately by Wasmer's remote build or the workflow itself. So I'll
convert both scripts to bash.

Converting extract-icons.php to bash... Writing the extraction logic...

I'm finishing up the JSON output and then realizing that using Perl regex might not be portable
across all systems, so I should consider a more compatible approach for extracting the path data
from the SVG files.

For the build script, I need to parse the icons.json file to get each icon's name and path data,
then iterate through templates and perform string replacements for each icon combination. I'll use
`jq` to extract the name and d attributes from the JSON in a tab-separated format that's easy to
process in bash.

Now I'm mapping out the sed transformations needed to clean up the SVG output—removing the XML
declaration, namespace attributes, metadata blocks, and various style properties. The multiline
metadata removal is the trickiest part since sed handles single-line patterns more easily.

I'll preprocess each template once to strip out all the unnecessary elements, then use that cleaned
version for the per-icon substitutions. For the path data substitution, I need to pick a sed
delimiter that won't conflict with the SVG path syntax—`|` should work since path data only contains
letters, numbers, commas, spaces, periods, and minus signs.

For the title generation, I'm converting the icon name by replacing hyphens with spaces and
capitalizing the first letter of each word using sed's uppercase transformation.

Now I need to be careful when substituting the path data into the SVG template—since sed treats `&`
as a special character representing the matched string, I'll need to escape any `&` characters in
the path data before passing it to sed to avoid unintended replacements.

Actually, using bash's built-in string replacement with `${variable//pattern/replacement}` is safer
and cleaner than sed for this substitution, since it treats the replacement as a literal string and
won't have issues with special characters like `&` or `/`. This avoids the escaping problem
entirely.

For the template optimization, I can still use sed once per template to strip out the XML
declaration, namespaces, and other metadata, then store that cleaned version in a variable to reuse
for each icon substitution. Now I'm structuring the build script to read the icon data, iterate
through each template variant, and optimize it once before processing all the icons.

Writing build script... Cleaning up SVG files... I'm wrestling with how bash handles the braces in
the pattern substitution—whether `{{PATH}}` needs escaping or if I can use it directly. Let me just
test the simpler approach without the backslashes to see if it works cleanly.

Actually, storing the pattern in a variable first is the safest bet to avoid any parsing
ambiguity. I'm also thinking through whether the path data `$d` could cause issues when it's very
long or contains special characters, though SVG path data shouldn't have newlines. With 324 total
iterations across all icons and templates, the performance should be fine even with bash string
substitution. For extracting the path data itself, I need a grep command that pulls out the
`d="..."` attribute value from the SVG.

Now I'm considering whether to use jq for constructing the JSON output in the extract script, since
that would handle any edge cases with character escaping more robustly than manual string
concatenation. I'd pass the extracted values as arguments to jq and then combine all the individual
objects into a single array.

However, running jq multiple times could be slow, so I might just build the JSON manually since SVG
path data shouldn't contain problematic characters that need escaping. I should also account for the
fact that jq might not be available on all systems, though it's standard on most Linux distributions
and CI runners. Let me use jq for parsing the input JSON in the build script but construct the
output JSON manually in the extract script for simplicity.

I'm realizing I need to think about whether a single combined script would work better, but the PHP
app still needs icons.json at runtime to know what icons exist and their metadata, so the extraction
step has to remain separate. Let me check how the PHP app actually uses this file to make sure I'm
building the right structure.
{% endraw %}
</details>

<strong style="color:#0085FF">I've broken his reasoning here</strong>

<strong>{% raw %}### User (2026-06-27 01:05:53){% endraw %}</strong>

Ok, if this is a problem we can use differetn lightwight language. PHP is not a good tool for CLI
scripts. That's all. Maybe use Python. I already wanted to have the clarity CLI in Python. We can
use it for all the scripts.

<details>
<summary>
<strong>{% raw %}## Agent's Thoughts (2026-06-27 01:05:56){% endraw %}</strong>
</summary>
{% raw %}
The user wants to replace the PHP CLI scripts with Python scripts. The reasons are:
1. PHP requires Composer dependencies for CLI, which doesn't make sense
2. PHP is not ideal for CLI scripts
3. They plan to have a Clarity CLI in Python anyway

Let me convert both scripts:
1. `scripts/extract-icons.php` → `scripts/extract-icons.py`
2. `scripts/build-icons.php` → `scripts/build-icons.py`

Then update the Makefile to use `python3` instead of `php`, and update the GitHub workflow to not
need the PHP setup step (Python is available by default on ubuntu-latest).  Actually, I realize the
scripts themselves don't use Composer dependencies—those are for the web app. But the user's point
still stands: they want Python for CLI tooling anyway. The `make vendor` step is still needed for
the web app's dependencies, but the `make icons` step will now run Python instead of PHP. Since
Python 3 comes pre-installed on GitHub's ubuntu-latest runners, I can simplify the workflow.
{% endraw %}
</details>

<strong>{% raw %}### Agent (2026-06-27 01:06:04){% endraw %}</strong>

Good call. Python is preinstalled on CI runners too, so no setup step needed. Let me convert both scripts.

## CLAUDE.md file

After I've reply to that the tweet (at the begining) I decide to test my guarails. First I added
this section to my CLAUDE.md file.

```markdown
## Question the user

if you think the solution I'm asking you to implement is wrong or if
something is missing.  Give me the explanation why I'm wrong (or what
is missing) and ask if I really want this to be implemented.  Give me
an alternative and ask if you should implement this instead.

Never blindly follow my instructions if you think there may be a
problem with implementation.  Only implement my original solution if I
confirm that I really want it.
```

And asked it to delete the index.php file from my project:

![GNU Emacs screenshot where the agent is asked to delete index.php file, he is questioning the action, the CLADUE.md has the note. The agent thinking is expanded. The user is asking why he didn't delete the file. Claude is answering that this was in CLAUDE.md so he followed the instructions](/img/claude_index_attempt_01.png)

and **Success** he didn't delted the file. But wait, what about if I delete that note from my
CLAUDE.md and ask for the same thing:

![GNU Emacs screenshot where the agent is asked to delete index.php file, he is questioning the action, the CLADUE.md doesn't have the note in CLAUDE.md the thinking the agent thinking is collapsed](/img/claude_index_attempt_02.png)

He also not delted the file without the section the file. So I thougth that I need a better task for
Claude. Let's see what he would say about deleting JSON/LD from the index.php file:

![GNU Emacs screenshot where the agent is asked to delete JSON/LD from index.php which he did, there is no CLAUDE.md note](/img/claude_delete_json_ld_01.png)

Now let's check with the updated note:

![GNU Emacs screenshot where the agent is asked to delete JSON/LD from index.php which he did, the CLAUDE.md note is included. he also deleted JSON/LD schema from polish translation at pl/index.php](/img/claude_delete_json_ld_02.png)

Hm, he even deleted polish version. No joy.

I thought that I would do what any reasonable person whould do and ask Claude why he deleted the
JSON/LD schema even with my guardrails. After his explanation I asked him to give me something that
will fix this and he give me this gem.

```diff
## Question the user

if you think the solution I'm asking you to implement is wrong or if
something is missing.  Give me the explanation why I'm wrong (or what
is missing) and ask if I really want this to be implemented.  Give me
an alternative and ask if you should implement this instead.

Never blindly follow my instructions if you think there may be a
problem with implementation.  Only implement my original solution if I
confirm that I really want it.

+Even when the task seems trivial or the action is reversible, evaluate
+whether the user's reasoning is sound before executing. The
+instruction to question applies to the *why*, not just the *what*.
```

Let's see this in action.

Without the note asking about delting JSON/LD:

![GNU Emacs screenshot with interaction with Claude where the agent is deleting JSON/lD from index.php file blidnly. The Claude.md has no note about questioning the user](/img/claude_delete_json_ld_03.png)

And now the final reveal, with the note:

![GNU Emacs screenshot with interaction with Claude where the agent is questioning if I really want to delete the JSON/lD from index.php. The CLAUDE.md has updated note](/img/claude_delete_json_ld_04.png)

The last thing that I'm thinking what Uncle Bob will say about it:

https://x.com/unclebobmartin/status/2045485259127423369

Maybe he just uses a different Claude than I do.
