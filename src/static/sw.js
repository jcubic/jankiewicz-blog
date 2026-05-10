self.Prism = self.Prism || {};
self.Prism.disableWorkerMessageHandler = true;

importScripts(
    'https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js',
    'https://cdn.jsdelivr.net/npm/prismjs/prism.js',
    'https://cdn.jsdelivr.net/npm/prismjs/plugins/line-numbers/prism-line-numbers.js',
    'https://cdn.jsdelivr.net/gh/jcubic/static@master/js/mime.min.js',
    'https://cdn.jsdelivr.net/gh/jcubic/static@master/js/path.js'
);

const app = new wayne.Wayne();

const language_map = {
    '.js': 'javascript',
    '.css': 'css'
};

const styles = {
    dark: 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism-okaidia.min.css',
    light: 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism.min.css'
};

const style = `<style>
body, html {
    height: 100%;
}
pre[class*=language-] {
    margin: 0;
    height: 100%;
    overflow: auto;
    box-sizing: border-box;
    border-radius: 0;
    white-space: pre-wrap;
}
</style>`;

const reset = 'https://cdn.jsdelivr.net/npm/the-new-css-reset@1.9.0/css/reset.css'

const bs = new BroadcastChannel('sw');

const alernative_mime = {
    'application/x-javascript': 'js'
};

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

app.get('*', async function(req, res) {
    const url = new URL(req.url);
    const extension = path.extname(url.pathname);
    const language = language_map[extension];
    const accept = req.headers.get('Accept');
    if (match_language(language) && accept.match(/text\/html/)) {
        const [{code, content_type}, rpc_response] = await Promise.all([
            fetch(req.url).then(async res => {
                return {
                    content_type: res.headers.get('Content-Type'),
                    code: await res.text()
                };
            }),
            get_theme()
        ]);
        const theme = rpc_response.result ?? 'dark';
        const fetch_mime = content_type.replace(/;.*$/, '');
        const valid_extension = mime.getExtension(fetch_mime) ?? alernative_mime[fetch_mime];
        if (extension.endsWith(valid_extension)) {
            const analytics = await fetch('/blog/analytics.html').then(res => res.text());
            const filename = path.basename(req.url);
            const link = [reset, styles[theme]].map(url => {
                return `<link href="${url}" rel="stylesheet"/>`;
            }).join('\n');
            const grammar = Prism.languages[language];
            const tokens = Prism.tokenize(escape(code), grammar);
            const output = Prism.Token.stringify(tokens, language);
            res.html(html(
                filename.replace(/\?.*$/, ''),
                `${link}${style}`,
                `<pre class="language-${language}"><code>${output}</code></pre>${analytics}`
            ));
            return;
        }
    }
    res.fetch(req);
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

function escape(html) {
  return html.replace(/</g, '&lt;');
}

function match_language(language) {
    return language && Prism.languages[language];
}

function html(filename, head, body) {
    return `<!DOCTYPE html>
<html>
<head>
<title>${filename} source code</title>
${head}
</head>
<body>
${body}
</body>
</html>`;
}
