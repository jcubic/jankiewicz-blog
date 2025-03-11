---
title: Hack for Syntax Highlighting of Source Code
description: This is the explanation of a hack I did, to add Syntax Highlighting to web page source code
date: 2023-08-23
author: jcubic
tags: articles_en
---

If you're a web developer, work with [JSON](https://en.wikipedia.org/wiki/JSON) data
format, and use Google Chrome browser, you have probably seen browser extension
[JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh). This
extension adds Syntax Highlighting to JSON files viewed in the browser.

I've had a similar idea to display Syntax Highlighting but for JavaScript and CSS files,
as part of the website. I just later realized that this is similar to JSON Viewer.

In this article, I will show how I did it and add this feature to my blog.

<!-- more -->
{% card %}

If you just want to look at the demo. Open this link with the JavaScript file used on my
blog: [blog.js](/js/blog.js).

So first thing was an idea to use my
[Open Source JavaScript library called Wayne](https://github.com/jcubic/wayne),
to show webpage source code in color. This immediately created a question:

Can you distinguish of the script or CSS file loaded as a script or CSS file from viewing
it in the browser? I didn't know if that is possible (I didn't think about JSON Viewer
that probably did just that).

I didn't know what the answer to this question was, so I've asked on Stack Overflow:

[Detect if script file is used as script or open in browser tab to view the content](https://stackoverflow.com/q/76952820/387194).

A few minutes after asking the question, I thought I just checked Google Chrome
[Dev Tools](https://developer.chrome.com/docs/devtools/) Network Tab to see if there is a
difference in
[Accept HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept). And
to my lack there was a difference.

When the JavaScript file is loaded as script it gets the header:

```
Accept: */*
```

Which means that it accepts any content. But more interesting was the header when
viewing the file in the browser tab:

```
Accept:
text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
```

So I just realized that I can check if the `Accept` HTTP header matches `text/html` string
and return syntax highlighting output.

When I realized this I immediately answered my own question on StackOverflow.

Next was creating a Proof of Concept as a Demo for Wayne Library. After a few tries and
errors, I came up with this code. That I will explain below:

```javascript
importScripts(
  '../repo/index.umd.js',
  'https://cdn.jsdelivr.net/npm/prismjs/prism.js',
  'https://cdn.jsdelivr.net/gh/jcubic/static@master/js/path.js'
);

const app = new wayne.Wayne();

const language_map = {
  js: 'javascript',
  css: 'css'
};

const style = '<link href="https://cdn.jsdelivr.net/npm/prismjs/themes/prism-coy.css" rel="stylesheet"/>';

app.get('*', async function(req, res) {
  const url = new URL(req.url);
  const extension = path.extname(url.pathname).substring(1);
  const language = language_map[extension];
  const accept = req.headers.get('Accept');
  if (language && Prism.languages[language] && accept.match(/text\/html/)) {
    const code = await fetch(req.url).then(res => res.text());
    const grammar = Prism.languages[language];
    const tokens = Prism.tokenize(code, grammar);
    const output = Prism.Token.stringify(tokens, language);
    res.html(`${style}\n<pre><code class="language-${language}">${output}</code></pre>`);
  } else {
    const fetch_res = await fetch(req.url);
    res._resolve(fetch_res);
  }
});
```

This is
[Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
code. The first JavaScript file that is loaded (using `importScripts`) came from the Wayne
repository that I have in the repo directory. This is how I start with demos for Wayne
just in case I need to fix a bug or add a feature to the library (for the demo to work).

The code adds a global get handler (the Wayne API is similar to
[express.js](https://expressjs.com/) for NodeJS) which intercepts all HTTP requests and
checks if the file extension is `css` or `js`. It also checks if the Accept HTTP header
matches `text/html`.  If this is `true` and if the given language (from `language_map`
mapping) is on the list of [PrismJS](https://prismjs.com/) languages, it fetches the
source code and adds return HTML code with syntax highlighting.

There are a few issues with this initial code that will be explained in just a second.

The first issue was when I opened the service worker file, I've got this output:

![JavaScript Source code with syntax highlighting on white background](/img/syntax-highlight-bug.png)

The issue was that the HTML tags were not visible. It's because they render as part of the
whole page HTML. To fix this I needed to add this simple `escape` function:

```javascript
function escape(html) {
  return html.replace(/</g, '&lt;').replace('>', '&gt;');
}
```

Next thing while I was preparing a demo for Wayne library was the ugly hack when
file is not the one that should get the syntax highlighting (so every other file).

```javascript
const fetch_res = await fetch(req.url);
res._resolve(fetch_res);
```

I used this hack in order to use
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object from fetch
directly to resolve the promise. This is a hidden function that should not be used so I've
created an issue:

[Add convenient passthru method](https://github.com/jcubic/wayne/issues/31) to the Wayne
repo.

After creating this issue, I was looking into the library source code and found that there
is already a function `Response::fetch` but it accepts url as an argument.

So I've added a new feature to the library for fetch to accept
[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object, this will
simplify the code because I was able to use:

```javascript
res.fetch(req);
```

If you're interested in how the feature was implemented, here is the commit:
[decf9e4](https://github.com/jcubic/wayne/commit/decf9e4ada5bdaff02885e45c904f18f4a925175)

That also includes documentation in README.

So this was added to the gh-pages branch and I was happy that I've implemented the feature
and the PoC.  I've written on Twitter about this as part of
`#100DaysOfOpenSource`/`#100DaysOfCode` challenge:

https://twitter.com/jcubic/status/1694051138763382976

I've also posted a similar post on LinkedIn. I've written:

> If you're interested in how this would look on a real website let me know. I can add
> this feature to my own personal blog (I still haven't written any article besides a
> welcome post).

The same day I decided to add this to my blog (and the next day to wrote a blog post about
it). There were also a few challenges that I faced while adding this feature to my blog.

The first thing was that I used the Dark Mode switch. So I needed to communicate somehow
with the main thread with the Service Worker.

I've started by adding a bridge using
[BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).
You can also send the messages directly from and to the Service Worker using post
messages, but I decided to use BroadcastChannel.

While implementing this I realized that Wayne had an RPC feature (yes, you can forget what
your library can do). So I've rewritten that using `rpc` function:

The main code looked like this:

```javascript
const bs = new BroadcastChannel('sw');

import('https://cdn.jsdelivr.net/npm/@jcubic/wayne').then(({ rpc }) => {
    rpc(bs, {
        theme: () => prefered_dark() ? 'dark' : 'light'
    });
});
```

I decided to write a theme method that will return a string that I will use to determine
which Prism CSS file to load.

Inside the Service Worker I've added this code:

```javascript
const [code, {result: theme}] = await Promise.all([
    fetch(req.url).then(res => res.text()),
    wayne.send(bs, 'theme', [])
]);
```

The `send` could probably return just the result but this is how I implemented the RPC.
It returns `{id, result}` or `{id, error}` objects.

To add a theme switcher I used this object:

```javascript
const styles = {
    dark: 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism-okaidia.min.css',
    light: 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism.min.css'
};
```

and

```javascript
const style = `<link href="${styles[theme]}" rel="stylesheet"/>`;
```

There were some issues with CSS so I used CSS Reset and some custom CSS.  I also added
analytics so I will know if anyone views the highlighted file.

But I found another bug when I wanted to access a file `/blog/js/blog.js`.  This file
didn't exist (I used the wrong path) but instead of a 404 error page, it gave me HTML
source code with escaped tags. I was thinking what the heck?

Then I realized that the bug was in the code that checks extension, js is valid extension
and JavaScript is a valid language, but the output is an HTML error page.

So to fix the issue I needed to use [MIME library](https://www.npmjs.com/package/mime),
which I converted using [Browserify](https://browserify.org/) to UMD, so I can loaded it
in Service Worker.

The fix looks like this:

First I used the MIME library to get a valid MIME for the extension:

```javascript
const valid_mime = mime.getType(extension);
```

Then I get the `content_type` from `fetch` along with the source code:

```javascript
const [{code, content_type}, {result: theme}] = await Promise.all([
    fetch(req.url).then(async res => {
        return {
            content_type: res.headers.get('Content-Type'),
            code: await res.text()
        };
    }),
    wayne.send(bs, 'theme', [])
]);
```

Some HTTP Servers have `charset` in `Content-Type` HTTP headers so they need to be
removed, and compared with valid MIME type:

```javascript
if (content_type.replace(/;.*$/, '') === valid_mime) {
   /* code that serve Source code colored with PrismJS */
}
```

And that's it. If you want to see the whole code just open this link: [sw.js](/sw.js).

**UPDATE**:

After the code was published and the article was written. I was testing if the hack works
the same on my blog as locally with [Eleventy](https://www.11ty.dev/) local server.

And it seems that it didn't work when I opened JavaScript files. I was investigating,
and this time used Dev Tools Debugger and added a breakpoint into this line:

```javascript
const valid_mime = mime.getType(extension);
```

I was stepping into the next line:

```javascript
if (content_type.replace(/;.*$/, '') === valid_mime) {

}
```

and it turns out that my server [Atthost](https://ref.atthost.pl/?id=10912) returns:


```
Content-Type: application/x-javascript
```

But MIME library expects:

```
Content-Type: application/javascript
```

Which is valid JavaScript MIME.

I was investigating how to change the mime in Apache, but nothing was working. So I've
contacted the support via email about this.

I also added a hack to my hack to use my own MIME types as a workaround:

```javascript
const mime_hack = {
    '.js': 'application/x-javascript'
};

const valid_mime = mime_hack[extension] ?? mime.getType(extension);
```

This time the code did work and I've got the JavaScript file syntax highlighted.

**UPDATE 2**:

It turns out that the solution I've added was not bullet proof, because
it stopped working when my hosting fixed the issue. The problem was
that the static files was using NGINX and it used different MIME and I was
not able to change it using `.htaccess` file.

This is the fixed version of the code that works for both MIME types:

```javascript
const alernative_mime = {
    'application/x-javascript': 'js'
};

const fetch_mime = content_type.replace(/;.*$/, '');
const valid_extension = mime.getExtension(fetch_mime) ?? alernative_mime[fetch_mime];
if (extension.endsWith(valid_extension)) {
}
```

**UPDATE 3**

I've noticed that when trying to load a script tag when the page was closed, it was taking a
long time to process. After some debugging, I've figured out the problem is the RPC
mechanism, the RPC call is never resolved because there is no main page to return the
theme of the page.

So the fix was to add timeout and return null as the result and use the default dark
theme.

This is the relevant code:

The RPC call with timeout:

```javascript
function get_theme() {
    return new Promise((resolve, reject) => {
        wayne.send(bs, 'theme', []).then((data) => {
            clearTimeout(id);
            resolve(data);
        });
        const id = setTimeout(() => {
            resolve({ result: null });
        }, 100);
    });
}
```

async requests:

```javascript
const [{code, content_type}, rpc_response] = await Promise.all([
    fetch(req.url).then(async res => {
        return {
            content_type: res.headers.get('Content-Type'),
            code: await res.text()
        };
    }),
    get_theme()
]);
```

and line that extract the theme with fallback:

```javascript
const theme = rpc_response.result ?? 'dark';
```

This time it works even if the Service Worker is sleeping and you open
JS or CSS file.

{% follow %}

{% include "_abbr" %}
