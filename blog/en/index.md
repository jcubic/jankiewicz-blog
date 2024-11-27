---
layout: main_layout.liquid
title: Jakub Jankiewicz Blog
description: This is my personal blog, where I write about different topics that interests me.
permalink: "/blog/"
tags: pages_en
---

<header>
 <h1>Jakub Jankiewicz Blog</h1>
</header>

{% include "_langs" %}

I'm Jakub Jankiewicz. I'm from Poland and I work as Front-End developer.
Welcome to my personal blog where I share information about different topics.
I decided to create this blog mostly to grow my personal brand and to improve
SEO of my content for my name. In Polish Google it's occupied mostly by actor
with same name.

## [List of Articles](#list-of-articles)

{% assign posts = collections.articles_en | reverse %}

{% for post in posts %}
* [{{ post.data.title }}]({{ post.url }})
{% endfor %}
