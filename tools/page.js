#!/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const mdPath = path.join(import.meta.dirname, '../README.md');
const htmlPath = path.join(import.meta.dirname, '../page/index.html');

if (!fs.existsSync(mdPath)) {
    console.error('README.md not found!');
    process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');
const htmlBody = marked.parse(mdContent);

const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project NTP Pool 42</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            word-wrap: break-word;
            max-width: 800px;
            margin: 0 auto;
            padding: 45px 20px;
            background-color: #ffffff;
            color: #24292e;
        }
        h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        code { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: rgba(27,31,35,0.05); border-radius: 3px; font-family: monospace; }
        pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
        pre code { background-color: transparent; padding: 0; }
        table { border-spacing: 0; border-collapse: collapse; margin-top: 0; margin-bottom: 16px; width: 100%; }
        table th, table td { padding: 6px 13px; border: 1px solid #dfe2e5; }
        table tr { background-color: #fff; border-top: 1px solid #c6cbd1; }
        table tr:nth-child(2n) { background-color: #f6f8fa; }
        blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; margin: 0 0 16px 0; }
        hr { height: 0.25em; padding: 0; margin: 24px 0; background-color: #e1e4e6; border: 0; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        @media (prefers-color-scheme: dark) {
            body { background-color: #0d1117; color: #c9d1d9; }
            h1, h2, h3 { border-bottom-color: #21262d; }
            code { background-color: rgba(110,118,129,0.4); }
            pre { background-color: #161b22; }
            table th, table td { border-color: #30363d; }
            table tr { background-color: #0d1117; border-top-color: #21262d; }
            table tr:nth-child(2n) { background-color: #161b22; }
            blockquote { border-left-color: #30363d; color: #8b949e; }
            hr { background-color: #30363d; }
            a { color: #58a6ff; }
        }
    </style>
</head>
<body>
    ${htmlBody}
</body>
</html>`;

fs.mkdirSync(path.dirname(htmlPath), {recursive:true});
fs.writeFileSync(htmlPath, template);
