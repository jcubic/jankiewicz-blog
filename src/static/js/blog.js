const comments_defer = defer();
addEventListener('message', handleMessage);
if (prefered_dark()) {
    mode_dark.checked = true;
    dark_mode(true);
} else {
    dark_mode(false);
}

const bs = new BroadcastChannel('sw');

import('https://cdn.jsdelivr.net/npm/@jcubic/wayne').then(({ rpc }) => {
    rpc(bs, {
        theme: () => prefered_dark() ? 'dark' : 'light'
    });
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(reg) {
            reg.addEventListener('updatefound', function() {
                var installingWorker = reg.installing;
                console.log('A new service worker is being installed:',
                            installingWorker);
            });
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
}

$$('.dark-mode').on('change', function(e) {
    if ('vibrate' in window.navigator) {
        window.navigator.vibrate(100);
    }
    var dark = e.target.value === 'dark';
    dark_mode(dark);
    save_dark_mode(dark);
});

let cols;
const COL_MARGIN = 30;
let char = char_size();
let cookie_consent = !!localStorage.getItem('cookie');
const [progress] = $$('nav.main pre');
if (!cookie_consent) {
    display_banner('');
}
const cookie_banner_exists = typeof cookie_banner !== 'undefined' && cookie_banner.clientWidth !== 0;
window.addEventListener('resize', resize, { passive: true });
document.addEventListener('scroll', render_progress, { passive: true });
if (cookie_banner_exists) {
    cookie_ok.addEventListener('click', function() {
        localStorage.setItem('cookie', true);
        cookie_consent = true;
        display_banner('none');
    });
}
pi.addEventListener('click', function(e) {
    e.preventDefault();
    let trinity_dialog;
    let term;
    function exit() {
        document.body.classList.remove('matrix');
        if (trinity_dialog) {
            trinity_dialog.addClass('hidden');
        }
        if (term) {
            term.destroy();
            term = null;
        }
    }
    if (e.ctrlKey && e.shiftKey) {
        if (window.umami) {
            umami.track('REPL', 'easter egg');
        }
        // https://tinyurl.com/the-net
        const head = document.querySelector('head');
        new_script(head, 'https://cdn.jsdelivr.net/npm/cmatrix');
        wait(() => typeof matrix !== 'undefined').then(load_matrix);
        if (!window.jQuery || !window.jQuery.terminal) {
            new_script(head, 'https://cdn.jsdelivr.net/npm/jquery');
            wait(function() {
                return typeof jQuery !== 'undefined';
            }).then(function() {
                new_script(head, 'https://cdn.jsdelivr.net/npm/jquery.terminal');
            });
            new_style(head, 'https://cdn.jsdelivr.net/npm/jquery.terminal/css/jquery.terminal.min.css');
        }
        when_ready(function($) {
            let animation;
            term = $('.system .body').terminal($.noop, {
                greetings: '',
                keydown: function(e) {
                    if (e.keyCode == 27) {
                        exit();
                    } else if (animation) {
                        return false;
                    }
                },
                mousewheel: function() {
                    return true; // fix slow scrolling
                },
                prompt: '# ',
                onBlur: function() {
                    return false;
                }
            });
            trinity_dialog = $('.system .trinity-dialog').removeClass('hidden');
            ssh_hack(term);

            async function ssh_hack(term) {
                try {
                    animation = true;
                    // hacking sequence from Matrix Reloaded
                    term.clear().echo([
                        '# nmap -v -sS -O 10.2.2.2',
                        '',
                        'Starting nmap V. 2.54BETA25',
                        'Insufficient responses for TCP sequencing (3). OS detection may be less',
                        'accurate',
                        'Interesting ports on 10.2.2.2:',
                        '(The 1539 ports scanned but not shown below are in state: closed)',
                        'Port\t\tState\t\tService\n22/tcp\t\topen\t\tssh',
                        '',
                        'No exact OS matches for host',
                        '',
                        'Nmap run completed -- 1 IP address (1 host up) scanneds'
                    ].join('\n'));
                    await term.typing('enter', 100, 'sshnuke 10.2.2.2 -rootpw="Z10N0101"');
                    term.set_prompt('');
                    async function step(msg) {
                        msg = `${msg} ...`;
                        term.echo(msg);
                        var id = term.last_index();
                        await delay(1000);
                        msg += ' successful.';
                        term.update(-1, msg);
                    }
                    await step('Connecting to 10.2.2.2:ssh');
                    await step('Attempting to exploit SSHv1 CRC32');
                    term.echo('Reset root password to "Z10N0101".');
                    await delay(400);
                    term.echo('System open: Access level <9>');
                    term.set_prompt('# ');
                    await delay(400);
                    await term.typing('enter', 100, 'ssh 10.2.2.2 -l root');
                    term.set_prompt('root@10.2.2.2\'s password: ');
                    await delay(1000);
                    term.set_prompt('RRF-CONTROL> ').echo('root@10.2.2.2\'s password: \n');
                    await delay(500);
                    await term.typing('enter', 100, 'disable grid nodes 21 - 48');
                    term.echo('');
                    term.echo('[[;#fff;]Warning: Disabling nodes 21-48 will disconnect sector 11 (27 nodes)]');
                    term.set_prompt('');
                    term.echo('         [[;#fff;]ARE YOU SURE? (y/n)]');
                    await delay(1000);
                    term.update(-1, '         [[;#fff;]ARE YOU SURE? (y/n)] y');
                    term.echo('');
                    await delay(200);
                    for (let i = 21; i <= 48; i++) {
                        term.echo(`Grid Node ${i} offline...`);
                        await delay(200);
                    }
                    term.echo('\nConnection to 10.2.2.2 closed.');
                    term.set_prompt('# ');
                    animation = false;
                } catch(e) {
                }
            }
        });
        document.body.classList.add('matrix');
    }
});

resize();
render_progress();


function new_style(head, href) {
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = href;
    head.appendChild(style);
}

function new_script(head, src) {
    const script = document.createElement('script');
    script.src = src;
    head.appendChild(script);
}

function wait(test) {
    return new Promise(function(resolve) {
        (function recur() {
            if (test()) {
                resolve();
            } else {
                setTimeout(recur, 100);
            }
        })();
    });
}

function when_ready(fn) {
    wait(function() {
        return typeof jQuery !== 'undefined' && jQuery.terminal;
    }).then(function() {
        fn(jQuery.noConflict(true));
    });
}

function load_matrix() {
   const font = new FontFace('matrix', 'url(https://jcubic.github.io/cmatrix/Matrix-Code.ttf)');
   font.load().then(font => {
       document.fonts.add(font);

       const make_chars = (...nums) => {
           return nums.map(num => String.fromCharCode(num));
       };

       const nums = [0x25AA, 0x254C, 0x00A9, 0x00A6, 0x007C, 0x007A, 0x003E, 0x003C, 0x003A, 0x0022, 0x002A, 0x002B, 0x30A2, 0x30A6, 0x30A8, 0x30AA, 0x30AB, 0x30AD, 0x30B1, 0x30B3, 0x30B5, 0x30B7, 0x30B9, 0x30BB, 0x30BD, 0x30BF, 0x30C4, 0x30C6, 0x30CA, 0x30CB, 0x30CC, 0x30CD, 0x30CF, 0x30D2, 0x30DB, 0x30DE, 0x30DF, 0x30E0, 0x30E1, 0x30E2, 0x30E4, 0x30E8, 0x30E9, 0x30EA, 0x30EF, 0x30FC, 0xA78A, 0xE937];

       const chars = matrix.range(0x0030, 0x0035)
                           .concat(matrix.range(0x0037, 0x0039))
                           .concat(make_chars(...nums));
       matrix(m, {
           chars,
           font: 'matrix',
           font_size: 20
       });
   });
}

function delay(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}

function render_progress() {
    const percent = get_scroll_progress(document.body);
    progress.innerHTML = string_progress(percent, cols);
}

function resize() {
    char = char_size();
    cols = get_col_size(progress.parentNode) - COL_MARGIN;
    if (!cookie_consent && cookie_banner_exists) {
        cookie_resize();
    }
    render_progress();
}


function display_banner(value) {
    cookie_banner.style.display = value;
}

function cookie_resize() {
    cookie_banner.style.right = 0;
    const cols = get_col_size(cookie_banner) - 2;
    const line = '+' + '-'.repeat(cols) + '+';
    cookie_banner.dataset.line = line;
    cookie_banner.style.removeProperty('right');
}

function dark_mode(toggle) {
    const mode = toggle ? 'dark' : 'light';
    document.body.dataset.mode = mode;
    if ('comments' in window) {
        giscus({
            setConfig: {
                theme: `${location.origin}/css/comments-${mode}.css`
            }
        });
    }
}

function prefered_dark() {
    var ls = localStorage.getItem('dark-mode');
    if (ls) {
        return JSON.parse(ls);
    }
    if ('matchMedia' in window) {
        var media_query = window.matchMedia('(prefers-color-scheme: dark)');
        return media_query.matches;
    }
    return false;
}

function save_dark_mode(mode) {
    localStorage.setItem('dark-mode', mode);
}

function $$(selector) {
    var data = document.querySelectorAll(selector);
    var result = Array.from(data);
    result.on = function(event, callback) {
           data.forEach(node => {
               node.addEventListener(event, callback);
           });
    };
    return result;
}

function char_size() {
    const span = document.createElement('span');
    span.innerHTML = '&nbsp;';
    $$('nav.main')[0].appendChild(span);
    var rect = span.getBoundingClientRect();
    span.remove();
    return rect;
}

function string_progress(percent, width) {
    var size = Math.round(width*percent/100);
    var left = '', taken = '', i;
    for (i=size; i--;) {
        taken += '=';
    }
    if (taken.length > 0) {
        taken = taken.replace(/=$/, '>');
    }
    for (i=width-size; i--;) {
        left += ' ';
    }
    return '[' + taken + left + '] ' + percent + '%';
}

// ref: https://stackoverflow.com/a/28994709/387194
function get_scroll_progress(elm) {
    const parent = elm.parentNode;
    const scrollTop = elm.scrollTop || parent.scrollTop;
    const height = parent.scrollHeight - parent.clientHeight;
    if (height === 0) {
        return 100;
    }
    return Math.round(scrollTop / height * 100);
}

function get_col_size(element) {
    const { width } = element.getBoundingClientRect();
    return Math.floor(width / char.width);
}

function giscus(message) {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) {
        if (!comments_defer.ready) {
            comments_defer.promise.then(() => {
                const iframe = document.querySelector('iframe.giscus-frame');
                giscus_post(iframe, message);
            });
        }
        return;
    }
    giscus_post(iframe, message);
}

function defer() {
    let result = {
        ready: false,
        promise: null,
        resolve: null,
        reject: null
    };
    result.promise = new Promise((resolve, reject) => {
        result.resolve = (data) => {
            result.ready = true;
            resolve(data);
        };
        result.reject = reject;
    });
    return result;
}

function giscus_post(iframe, message) {
    iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
}

function handleMessage(event) {
    if (event.origin !== 'https://giscus.app') return;
    if (!(typeof event.data === 'object' && event.data.giscus)) return;
    comments_defer.resolve();
    removeEventListener('message', handleMessage);
}
