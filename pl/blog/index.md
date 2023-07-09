---
title: Jakub Jankiewicz Blog
description: To jest mój osobisty blog, gdzie piszę i różnych rzeczach
layout: main_layout.liquid
tags: index_pl
---

<header>
 <h1>Jakub Jankiewicz Blog</h1>
</header>

{% include "_langs" %}

Mam na imię Jakub Jankiewicz. Jestem programistą Front-End z Polski. Witaj
na moim osobisty blogu, gdzie będę się dzielił różnymi informacjami.
Zdecydowałem się na stworzenie tego bloga, głównie aby budować swoją markę
osobistą, oraz aby poprawić SEO dla mojego imienia i nazwiska. W Polskim Google
wyniki wyszukiwania (SERP) są zajętę głównie przez aktora i takim samym imieniu.

<span id="list-of-articles"></span>
## [List of Articles](#list-of-articles)

{% for page in collections.articles_pl %}
* [{{ page.data.title }}]({{ page.url }})
{% endfor %}