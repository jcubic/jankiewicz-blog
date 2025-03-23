---
title: How to build zig book as PDF on Fedora?
description: This article will demonstrate how to build Zig book as PDF file from source.
date: 2025-03-23
author: jcubic
tags: articles_en
---

I planned to learn [Zig Programming
Language](https://en.wikipedia.org/wiki/Zig_(programming_language)), and found a [Zig
Book](https://pedropark99.github.io/zig-book/), but I wanted to read it on my [reMarkable
tablet](https://en.wikipedia.org/wiki/ReMarkable), the problem was that officially Zig book is only
in HTML format, and don't support building PDF file from source. That's why it's not part of its
documentation. But with [quarto](https://quarto.org/) publishing system, used by the book, it's
possible to create a PDF file.

Below is the instruction how to create a PDF version of Zig Book yourself. The instructions are for
Fedora GNU/Linux, because this is what I'm using, but building on Ubuntu or different Linux distro
should be similar. You only need to find the right package names to install.

<!-- more -->
{%- card -%}

Zig book require zig in version 0.14.0 and when this article was written,
the Fedora package had version 0.13.0. So when the version of zig is not up to date.
You need to install zig from source.

## [Install Zig from Source](#install-zig-from-source)

To compile zig you need to:

clone zig repo:

```bash
git clone https://github.com/ziglang/zig.git --depth 1
```

install dependencies

```bash
sudo dnf install -y cmake make lld-devel llvm-devel \
clang-devel clang-tools-extra-devel libxml2-devel
```

build zig:

```
cd zig
mkdir build
cd build
CMAKE_PREFIX_PATH=/usr/ cmake ..
sudo make install
```

`make install` take a while, you can do something else and check
from time to time if the compilation finished.

After it finishes, you should be able to run zig:

```bash
whereis zig
zig: /usr/bin/zig /usr/lib/zig
```

zig will be installed in /usr/bin/ directory (by default it compiled into `./stage3` directory, by
adding environment variable CMAKE_PREFIX_PATH we are forcing to install it into root directory).

## [Build Zig Book as PDF](#build-zig-book-as-pdf)

Now it's time to build the PDF version of the Zig Book:

First, you need to clone git repository:

```bash
git clone https://github.com/pedropark99/zig-book.git --depth 1
```

Then install dependencies

```bash
sudo dnf install R R-knitr R-rmarkdown R-readr texlive \
texlive-tikzfill texlive-tcolorbox texlive-fontawesome5 \
rsvg-convert
```

Next is to install quarto publishing system, you can't install it from
Fedora repository you need to download a Tar Ball from official website.
Check [installation instructions](https://quarto.org/docs/download/tarball.html).

After installation of dependencies, you can build zig book:

```bash
cd zig-book
quarto render --to pdf
```

It may take a while to build it. The output file should be located in:

```
./zig-book/docs/Introduction-to-Zig.pdf
```

{% follow %}

{% include "_abbr" %}
