---
title: Handling auto-indentation in Node.js REPL
description: This article is all about auto-indentation in REPL written in Node.js
date: 2024-12-07
author: jcubic
tags: articles_en
---

When working on my Open Source project [LIPS Scheme](https://lips.js.org/) REPL,
I wanted to have auto indentation, when you type multi line expression the text
on the next line is indented. This article will describe a story of adding this feature,
that require contributing to [Node.js](https://nodejs.org/en).

<!-- more -->
{% card %}

The first version of the LIPS Scheme Node REPL, included command line history,
I've copied part of Node.js REPL source code and tweak it. No worries I included
the Node.js copyright license in the source code.

In LIPS Scheme, I have formatter that indent scheme source code according to common
known rules. The REPL was working when you press enter, but it broke when you
copy/paste the code. I've attempted to fix this issue with few iterations.
It but this features always had bugs that I was not able to eliminate completely.

## [Paste Bracket Mode](#paste-bracket-mode)

Then suddenly, I don't know where I discovered
[paste-bracket mode](https://en.wikipedia.org/wiki/Bracketed-paste). It's special
feature of Terminal emulators that when enabled injects special
[ANSI Escapes codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
before and after the code you paste into the terminal.

To enable to feature you need to send `\x1b[?2004h` ANSI Escape code. Sending means
just printing this code into your standard output. To disable this feature
you can use `\x1b[?2004l`. When paste brackets is turn on the code you paste
into terminal is wrapped between `\x1b\[200~` and `\x1b\[201~` ANSI Escape codes.

## [Node.js Readline vs GNU Readline](#node-js-readline-vs-gnu-readline)

This is feature is part of [GNU Readline
library](https://en.wikipedia.org/wiki/GNU_Readline) which allows moving and editing the
line in Terminal. I was using readline in node, but paste brackets mode didn't work in
Node.js. I was inspecting the source code of Node.js, and it turns out that Node.js
doesn't use GNU Readline. It uses their own code and module responsible for editing in
REPL is also named readline.

First I [asked on
StackOverflow](https://stackoverflow.com/questions/74095099/how-to-use-terminal-bracket-paste-mode-in-nodejs-repl)
but eventually deleted the question because no one know the answer.  If you want to see
this, you need to have enough reputation, since the question was deleted.

## [My Contribution to Node.js](#my-contribution-to-node-js)

Then I've created an issue on GitHub about paste bracket mode in Node.js, and Ben
Noordhuis suggested that I contributed. I was looking at the code and [created a
PR](https://github.com/nodejs/node/pull/47150). It was not my first contribution to Open
Source, but first time to such big project as Node. I waited few months but finally got
merged, even that it didn't have unit tests (you can't actually test things like
copy/paste), and the feature landed in versions:

* [Node v18.19.0](https://nodejs.org/en/blog/release/v18.19.0)
* [Node v20.6.0](https://nodejs.org/en/blog/release/v20.6.0)

## [Working example](#working-example)

Here is example code, how to use this feature in Node.js:

```javascript
import readline from 'readline';
import { satisfies } from 'compare-versions';

const version = process.version;

const supports_paste_brackets = satisfies(version, '>=18.19.0 <19') ||
      satisfies(version, '>=20.6.0');

const prompt = 'repl> ';
const cont_p = '...   ';

let cmd = '';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt
});

// add the paste bracket markers to output code
process.stdin.on('keypress', (c, k) => {
  if (k?.name?.match(/^paste-/)) {
    cmd += k.sequence;
  }
});

if (supports_paste_brackets) {
  // enable paste bracket mode
  process.stdout.write('\x1b[?2004h');
}

rl.on('line', function(line) {
  try {
    cmd += line;
    // we clear old paste brackets that we don't need anymore
    if (cmd.match(/\x1b\[201~$/)) {
      cmd = cmd.replace(/\x1b\[(200|201)~/g, '');
    }
    cmd += '\n';
    // get rid of the opening paste bracket
    const code = cmd.replace(/\x1b\[200~/g, '');
    // first you check if this is multiline if the code ends
    // my case is lisp code it's easy to check
    // if there are balanced parentheses
    if (python_multiline(cmd)) {
      const is_bracket_mode = cmd.match(/\x1b\[200~/);
      // we don't indent the code when copy/paste here
      // but you can reformat the whole code and rewrite the output
      // you will need to move cursor up up and replace every line
      // with new content using proper ANSI Escape codes
      rl.setPrompt(cont_p);
      rl.prompt();
      if (!is_bracket_mode && supports_paste_brackets) {
         // indentation of 4 spaes, write your logic here
         const spaces = ' '.repeat(2);
         rl.write(spaces);
      }
    } else {
      // dummy output of the REPL
      console.log('==> #undef');
      rl.setPrompt(prompt);
      rl.prompt();
      // next input
      cmd = '';
    }
  } catch(e) {
    console.error(e.message);
  }
});


// dummy function that checks if this is a multi line expression
// it looks like Python statement with colon after first line
// and ends with double newline
function python_multiline(code) {
   return cmd.match(/:\s*$/m) && !cmd.match(/\n\s*\n$/);
}

rl.prompt();
```

To test the above code, you first need to initialize a new node.js project and install dependencies:

```bash
npm init -y
npm install compare-versions
```

You need to modify the package.json and put `"type": "module"` or save the above
file with .mjs extension.

When you run and type dummy Python code:

```python
if (x == 10):
  10
```

You will see it indents the code when you press enter after colon. Now try to copy
above code and paste into the REPL. The code will be intact.

If you want, you can re-indent the code, but doing nothing works just fine.

You can see this feature and more in my
[LIPS Scheme REPL](https://lips.js.org/docs/lips/REPL).

{% follow %}
{% include "_abbr" %}
