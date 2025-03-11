---
title: How to Implement a Simple Markdown Parser
description: In this article, I will show how to implement a simple Markdown parser to be used with jQuery Terminal.
date: 2024-11-26
author: jcubic
tags: articles_en
---

I've had this idea some time ago to add limited support for
[Markdown](https://en.wikipedia.org/wiki/Markdown) into
[jQuery Terminal](https://terminal.jcubic.pl/). I decided to use [Peggy.js](https://peggyjs.org/),
a maintained fork of the PEG.js parser generator. I already used it for a few projects
so I thought it will be the best tool for the job.

PEG is an abbreviation of so-called
[Parsing expression grammar](https://en.wikipedia.org/wiki/Parsing_expression_grammar),
a well-known way to define
[language grammars](https://en.wikipedia.org/wiki/Formal_grammar) and create
[parser generators](https://en.wikipedia.org/wiki/Compiler-compiler).

In this article, I will show how to implement a simple Markdown parser to be used
with jQuery Terminal. But if you follow along, you should be able to use it
for different targets, like HTML.

<!-- more -->
{% card %}

Most of the demos I create start on CodePen, that's why I prefer to use UMD
modules since this is the easiest to set up. If you want to see the final code,
there is a link to CodePen at the end of the article.

## [Getting Started with Peggy](#getting-started-with-peggy)

First quick intro to Peggy.js, the parser code is created from rules like this:

```
name = "*" text:[^*]+ "*" {
   return text.join('');
}
```

This is a simple grammar that matches text like this `*hello*` and returns a string `"hello"`.

First is the name of the rule then the equal sign and the definition, and next is JavaScript
code that should return the output of that rule. The rule definition can contain literal strings
in quotes and syntax similar to regular expressions. The text before the colon is a label,
that you can reference in JavaScript. You can also use
parentheses to group expressions and backslash as an `or` operator.

You can also use a handy shortcut by prepending dollar sign before the sequence,
with this, the text will be a string, not an array of characters:

```
name = "*" text:$[^*]+ "*" {
   return text;
}
```

You can test this parser (yes a single rule will give you a fully working parser),
online at [Peggy playground](https://peggyjs.org/online.html).

More information about Peggy can be found in
[project documentation](https://peggyjs.org/documentation.html).

To create a parser out of this grammar, you can use the command line tool.

```bash
npx peggy -o parser.js grammar.peg
```

If you have [Node.js installed](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
and have access to
[NPM](https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager),
the above command will create a file `parser.js`, that will contain your parser.
The output of the file is CommonJS, so if you want UMD or ES Module you need
[transpiler](https://en.wikipedia.org/wiki/Source-to-source_compiler)/bundler.

You can also use Peggy as a library.

```javascript
const parser = peggy.generate(grammar);
console.log(parser.parse('*hello*'));
// "hello"
```

This assumes that `peggy` is defined, you can import it into your project or use a script tag.

## [Markdown Parser](#markdown-parser)

The first rule that we will support is the Markdown header that we will convert into
bold text.

```
header = '#'+ ' '* text:$[^\n]* [\n] {
    return '[[b;;]' + text + ']';
}
```

`[[b;;] ]` is jQuery Terminal internal formatting, `b` indicates that the text will be bold.
You can find more about this syntax on
[project Wiki](https://github.com/jcubic/jquery.terminal/wiki/Formatting-and-Syntax-Highlighting).


The next are links, we will use two rules because the same syntax will also be used for images:

```
link = link:inline_link {
    return '[[!;;;;' + link.url + ']' + link.text + ']';
}

inline_link = '[' text:$[^\]]* ']' '(' url:$[^)]+ ')' {
    return {
        text,
        url
    };
}
```

As you can see, rules can use other rules, here we reference `inline_link` instead of
regex-like syntax.

`!` is jQuery Terminal formatting that will create a link.

To add images we can use the same `inline_link` rule, but the Markdown syntax requires an exclamation mark.
Note that the exclamation mark is in the input text not in the output like with jQuery Terminal links.

```
image = '!' + link:inline_link {
    return '[[@;;;;' + link.url + ']' + link.text + ']';
}
```

`@` is an indicator that this formatting should be converted to an image by jQuery Terminal.

Next is italic text, which has two different syntaxes asterisk and underscore.

```
italic = italic_a / italic_b

italic_a = '*' !' ' text:$[^*]+ !' ' '*' {
    return '[[i;;]' + text + ']';
}

italic_b = '_' text:$[^_]+ '_' {
    return '[[i;;]' + text + ']';
}
```

An exclamation mark is a negative assertion, so the text can't contain spaces.

Then we can use bold text that can contain italics inside:

```
bold = bold_a / bold_b

bold_a = '__' text:(text_bold_a / italic) '__' {
    return '[[b;;]' + text + ']';
}
text_bold_a = text:$[^_]+ {
    return text;
}

bold_b = '**' text:(text_bold_b / italic) '**' {
    return '[[b;;]' + text + ']';
}

text_bold_b = text:$[^* ]+ {
    return text;
}
```

To allow headers to contain links, bold, and italic text we can define inline text:


```
inline_text = bold / italic / link / [^\n]

header = '#'+ ' '* text:inline_text* [\n] {
    return '[[b;;]' + text.join('') + ']';
}
```

We can't use the `$` operator here, because it only works with text and not results,
so if you have rules that have JavaScript and return stuff, like we have with
`inline_text` it will return our code and not parsed values.

As stated before the backslash is an `or` operator. The `inline_text` contains a single
non newline character, but since we use any number of them in the `text` label, it will
match any text with links, bold, and italic inside.

We can also define list items, which will be just literal asterisk but can contain
the same text as headers:

```
list_item = _ '*' __ text:inline_text* [\n] {
  return '* ' + text.join('') + '\n';
}

_ "whitespace" = [\s\t]*
__ "whitespace" = [\s\t]
```

The string after the rule name for the white space helps with error messages.

The last thing is the main entry point which should be the first rule of grammar:

```
start = arr:(header / content / [\n])+ {
    return arr.join('');
}

content = text:(image  / inline_text / list_item)+ nl:[\n]? {
    return text.join('') + (nl || '');
}
```

Here is the [CodePen demo](https://codepen.io/jcubic/pen/zYLvPQa) for the whole parser,
if you want to play with it.

## [Conclusion](#conclusion)

Parser generators like PEG are a great way to create simple and complex languages
and parsers for them. PEG grammar libraries with minor differences, are supported
in a lot of different languages, not only JavaScript.

{% follow %}

{% include "_abbr" %}
