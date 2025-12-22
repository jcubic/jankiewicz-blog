---
layout: main_layout.liquid
title: Blog Jakuba T. Jankiewicza
description: To jest mój osobisty blog, gdzie piszę o różnych rzeczach które mnie interesują.
en: Jakub T. Jankiewicz Blog
permalink: "/pl/blog/"
tags: pages_pl
---

<header>
 <h1>Blog Jakuba Jankiewicza</h1>
</header>

{% include "_langs" %}

Mam na imię Jakub Jankiewicz. Jestem programistą Front-End z Polski. Witaj
na moim osobisty blogu, gdzie będę się dzielił różnymi informacjami.
Zdecydowałem się na stworzenie tego bloga, głównie aby budować swoją markę
osobistą, oraz aby poprawić SEO dla mojego imienia i nazwiska. W Polskim Google
wyniki wyszukiwania (SERP) są zajętę głównie przez aktora i takim samym imieniu.

## Lista artykułów

{% assign posts = collections.articles_pl | reverse %}

{% for post in posts %}
* [{{post.date | date: "%Y-%m-%d" }}]: [{{ post.data.title }}]({{ post.url }})
{% endfor %}
