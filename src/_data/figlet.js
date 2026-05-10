import figlet from 'figlet';

// ref: https://stackoverflow.com/a/30970751/387194
function escape(s) {
    let lookup = {
        '&': "&amp;",
        '"': "&quot;",
        '\'': "&apos;",
        '<': "&lt;",
        '>': "&gt;"
    };
    return s.replace(/[&"'<>]/g, c => lookup[c]);
}

const config = {
    font: 'Colossal',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 200,
    whitespaceBreak: true
};

const render = async (...args) => {
    return escape(await figlet(...args)).replace(/\s+$/gm, '');
};

export default async () => {
    const text = 'Jakub T. Jankiewicz';
    return {
        wrap: await render(text, {...config, width: 90}),
        small: await render(text, {
            ...config,
            width: 60,
            verticalLayout: 'full',
            font: 'Standard'
        }),
        big: await render(text, config)
    };
};
