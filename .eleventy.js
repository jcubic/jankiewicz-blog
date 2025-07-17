import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import embeds from 'eleventy-plugin-embed-everything';
import markdownIt from 'markdown-it';
import abbr from 'markdown-it-abbr';
import { minify } from 'html-minifier-terser';
import { encode } from 'html-entities';
import path from 'path';
import fs from 'fs/promises';
import { Liquid } from 'liquidjs';
import puppeteer from 'puppeteer';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import slugify from '@sindresorhus/slugify';

import crc32 from './crc32.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const liquid = new Liquid();

const dev = process.env.ELEVENTY_RUN_MODE !== 'build';

const delay = time => new Promise(resolve => setTimeout(resolve, time));

function formatDate(lang, date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(lang, options);
}

async function path_exists(path) {
    try {
        await access(path, fs.constants.R_OK | fs.constants.W_OK);
        return true;
    } catch (e) {
        return false;
    }
}

function transform_headers(content) {
    if (!this.page || !this.page.inputPath.match(/blog\/.*md$/)) {
        return content;
    }

    const $ = cheerio.load(content);
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const $el = $(el);
        const text = $el.text();
        const slug = slugify(text);
        $el.attr('id', slug);
        if (!$el.children('a').length) {
            $el.wrapInner(`<a href="#${slug}"></a>`);
        }
    })

    return $.html();
};

function filter_tags(collectionApi, filter_callback) {
    const collections = collectionApi.getAll();
    return collections.reduce((result, template) => {
        if (!Array.isArray(template.data.tags)) {
            return result;
        }
        const tag = template.data.tags.find(filter_callback);
        if (tag && !result.includes(tag)) {
            result.push(tag);
        }
        return result;
    }, []);
}

export default function(eleventyConfig) {

    const options = {
        html: true,
        linkify: true
    };

    let browser;

    eleventyConfig.addTransform('add-header-links', transform_headers);

    eleventyConfig.on('eleventy.before', async ({ dir, runMode, outputMode }) => {
        browser = puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });
    });

    eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
        (await browser).close();
    });

    const svg = fs.readFile('static/img/card.svg', 'utf8').then(svg => {
        return liquid.parse(svg);
    });

    eleventyConfig.addPlugin(embeds);

    const md = markdownIt(options).use(abbr);
    eleventyConfig.setLibrary('md', md);
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPassthroughCopy({ 'static': '.' });

    eleventyConfig.addCollection('articleSets', function(collectionApi) {
        return filter_tags(collectionApi, key => key.match(/articles_|pages_/));
    });

    eleventyConfig.addCollection('langs', function(collectionApi) {
        return filter_tags(collectionApi, key => key.startsWith('pages_')).map(tag => {
            return tag.replace(/pages_/, '');
        });
    });

    eleventyConfig.addAsyncFilter('has_code', async page => {
        const md = await fs.readFile(page.inputPath, 'utf8');
        return /```./.test(md);
    });

    eleventyConfig.addAsyncFilter('has_card', async page => {
        const md = await fs.readFile(page.inputPath, 'utf8');
        return /{%-?\s+card\s+-?%}/.test(md);
    });

    eleventyConfig.addFilter('article', tags => {
        if (!tags) {
            return;
        }
        const tag = tags.find(tag => tag.startsWith('articles_'));
        if (tag) {
            return tag.replace(/articles_/, '');
        }
    });

    eleventyConfig.addFilter('dump', obj => {
        console.log({obj});
        if (obj) {
            return JSON.stringify(Object.keys(obj), null, 2);
        }
    });

    eleventyConfig.addFilter('translation', (collection, title) => {
        return collection.filter(page => {
            if (page.data.title?.startsWith(title)) {
                return true;
            }
            if (page.data.en?.startsWith(title)) {
                return true;
            }
            return false;
        }).sort((a, b) => {
            return a.data.lang.localeCompare(b.data.lang);
        });
    });

    // ref: https://syntackle.live/blog/eleventy-shortcode-for-embedding-codepen-ZyslIPzCHpJo3kkPwu2U/
    eleventyConfig.addLiquidShortcode('codepen', function (url) {

        const url_array = url.split('/');

        const profile_url_array = url_array.filter((string, index) => {
            return (index < (url_array.length - 2)) ? true : false
        })

        const username = profile_url_array[profile_url_array.length - 1];
        const user_profile = profile_url_array.join('/');
        const data_slug_hash = url_array[url_array.length - 1];

        return `<p class="codepen" data-height="600" data-default-tab="result" data-slug-hash="${data_slug_hash}" data-user="${username}" style="height: 571px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;"><span><a href="${url}">See the pen</a> (<a href="${user_profile}">@${username}</a>) on <a href="https://codepen.io">CodePen</a>.</span></p><script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>`;
    });

    eleventyConfig.addFilter('md', function(content) {
        return md.render(content).trim().replace(/(^<p>)|(<\/p>$)/g, '');
    });

    eleventyConfig.addAsyncShortcode('with_hash', async function(filename) {
        const content = await fs.readFile(`./static/${filename}`, 'utf8');
        const hash = crc32(content);
        return `${filename}?${hash}`;
    });

    eleventyConfig.addFilter('intro', function(content) {
        const m = content.match(/^([\s\S]+)<!-- more -->/);
        if (m) {
            return m[1].trim();
        }
        return content;
    });

    eleventyConfig.addFilter('xml_escape', function(str) {
        return encode(str, {level: 'xml'});
    });

    eleventyConfig.addFilter('lastDate', function(collection) {
        if (!collection || !collection.length) {
            return emptyFallbackDate || new Date();
        }

        return new Date(Math.max(...collection.map(item => {return item.date})));
    });

    eleventyConfig.addFilter('rtrim', str => str.replace(/\s+$/, ''));

    eleventyConfig.addLiquidShortcode('follow', function() {
        return `<p>If you find this article interesting you may want to follow me on Twitter:
<a href="https://jcu.bi/twitter">@jcubic</a> and on <a href="https://jcu.bi/ln">LinkedIn</a>.</p>`;
    });

    eleventyConfig.addLiquidShortcode('card', async function() {
        const { title, author: username, date, lang, users } = this.ctx.environments
        const svg_path = path.join(__dirname, 'static/img');
        const output_svg = await liquid.render(await svg, {
            username,
            fullname: users[username].name,
            title,
            path: svg_path,
            date: formatDate(lang, date)
        });
        const svg_fullname = path.join(__dirname, 'tmp.svg');
        await fs.writeFile(svg_fullname, output_svg);
        const directory = `_site/img/${lang}/`;
        if (!await path_exists(directory)) {
           await fs.mkdir(directory, { recursive: true });
        }
        const { inputPath, fileSlug } = this.page;
        const filename = `${directory}${fileSlug}.png`;
        const page = await (await browser).newPage();
        await page.setViewport({
            height: 630,
            width: 1200
        });
        await page.goto('file://' + svg_fullname);
        await delay(100);

        const imageBuffer = await page.screenshot({});

        await fs.writeFile(filename, imageBuffer);

        console.log(`[11ty] Writing ${filename} from ${inputPath} (shortcode)`);
        await page.close();
    });

    eleventyConfig.addTransform('minification', async function(content) {
        if (dev) {
            return content;
        }
        const path = this.page.outputPath;
        if (path && path.endsWith('.html')) {
            return minify(content, {
                collapseWhitespace: true
            });
        }
        return content; // no change done.
    });

    eleventyConfig.addFilter('webmentionsByUrl', function(webmentions, url) {
        const allowedTypes = ['in-reply-to', 'like-of', 'repost-of'];

        const data = {
            'like-of': [],
            'repost-of': [],
            'in-reply-to': [],
        };

        const hasRequiredFields = entry => {
            const { author, published, content } = entry
            return author.name && published && content
        };

        const filtered = webmentions
              .filter(entry => entry['wm-target'] === `https://rknight.me${url}`)
              .filter(entry => allowedTypes.includes(entry['wm-property']));

        filtered.forEach(m => {
            if (data[m['wm-property']]) {
                const isReply = m['wm-property'] === 'in-reply-to';
                const isValidReply = isReply && hasRequiredFields(m);
                if (isReply) {
                    if (isValidReply) {
                        m.sanitized = sanitizeHTML(m.content.html);
                        data[m['wm-property']].unshift(m);
                    }

                    return;
                }

                data[m['wm-property']].unshift(m);
            }
        });

        return data;
    });

    const url = dev ? 'http://localhost:8080' : 'https://jakub.jankiewicz.org';

    eleventyConfig.addGlobalData('site', {
        url,
        comments: false,
        twitter: 'jcubic',
        repo: 'https://github.com/jcubic/jankiewicz-blog',
        dev
    });
};
