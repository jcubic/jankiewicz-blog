---
title: Batman website inspired terminal quiz app
description: This article is all about Batman 2022 terminal website inspired quiz app, that you can use for your project
date: 2024-12-04
author: jcubic
tags: articles_en
---

Some time ago I was contacted by a person involved with NFT, to create a project inspired by [2022
Batman movie website](https://www.firstshowing.net/2021/there-is-a-new-viral-marketing-website-for-the-batman-to-follow/).

<!-- more -->
{% card %}

The person wanted to have a website that looked similar to a Batman Promotion website that looked
like created by [Ridder](https://en.wikipedia.org/wiki/Riddler). The copy of the old website can be
found on [Archive.org](https://web.archive.org/web/20220202181146/https://www.rataalada.com/).

The person contacted me because I'm an author of [jQuery Terminal, a web-based terminal
library](https://terminal.jcubic.pl/), so obviously I would be perfect for the job.

He showed me a [login page from CodePen](https://codepen.io/remsrob/pen/ZRyqNx) that he liked.
So I've [modified it](https://codepen.io/jcubic/pen/xxYBWqr) and adding to the website.

I've created a basic code and fixed bugs during the launch of the NFT. I worked long hours to fix
Everything.  When the project was done, I've asked that person if it's ok to reuse his code, I'm not
sure, if he even replied, so I assumed he didn't mind. I did refactor the code removed any
customization and put it for [sale on
Gum Road](https://jcubic.gumroad.com/l/vintage-web-terminal-quiz-application).

You can see the live quiz at [quiz.terminal.jcubic.pl](https://quiz.terminal.jcubic.pl/). The
username and password is "guest" (without the quotes).

Originally, the quiz was used to give people a unique token (sequence of random characters) that
they can use on Discord for the NFT project (probably to claim the free NFT). That's why the code
asks for the username and give you a token.

The questions are random, and they are hidden on the backend (same as answers), so you can't inspect
the code to figure out all the questions and answers. The quiz also has IP protection, to prevent
one person to keep answering the questions (but this feature is disabled on the demo).

This was second time I worked on Web3 terminal project. If you need similar terminal for yours,
I'm open to work for you, you can find the details on [this page](https://support.jcubic.pl/).

{% include "_abbr" %}
