const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const abbr = require("markdown-it-abbr");
const { minify } = require('html-minifier-terser');
const { encode } = require('html-entities');

const dev = process.env['ELEVENTY_ENV'] === 'dev';

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

module.exports = function(eleventyConfig) {
    const options = {
        html: true,
        linkify: true
    };

    const md = markdownIt(options).use(abbr);
    eleventyConfig.setLibrary("md", md);
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPassthroughCopy({ "static": "." });
    eleventyConfig.addCollection("articleSets", function(collectionApi) {
        return filter_tags(collectionApi, key => key.startsWith("articles_"));
    });
    eleventyConfig.addCollection("langs", function(collectionApi) {
        return filter_tags(collectionApi, key => key.startsWith("index_")).map(tag => {
            return tag.replace(/index_/, '');
        });
    });
    eleventyConfig.addFilter("intro", function(content) {
        const m = content.match(/^([\s\S]+)<!-- more -->/);
        if (m) {
            return m[1].trim();
        }
        return content;
    });
    eleventyConfig.addFilter("xml_escape", function(str) {
        return encode(str, {level: 'xml'});
    });
    eleventyConfig.addFilter("lastDate", function(collection) {
        if (!collection || !collection.length) {
            return emptyFallbackDate || new Date();
        }

        return new Date(Math.max(...collection.map(item => {return item.date})));
    });
    eleventyConfig.addFilter("rtrim", str => str.replace(/\s+$/, ''));
    eleventyConfig.addTransform("minification", async function(content) {
        if (dev) {
            return content;
        }
        const path = this.page.outputPath;
        if (path.endsWith('.html')) {
            return minify(content, {
                collapseWhitespace: true
            });
        }
        return content; // no change done.
    });
    eleventyConfig.addGlobalData('site', {
        url: 'https://jakub.jankiewicz.org'
    });
    return {
        dev
    };
};
