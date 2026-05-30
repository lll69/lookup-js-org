import { argv } from 'node:process';
import { renderToString } from 'react-dom/server';
import IndexPage from './IndexPage';
import { Link } from '@mui/material';

const manifest = JSON.parse(argv[2]);
const result: string[][] = [];

function renderIndex() {
    const html = "<!DOCTYPE html>\n" + renderToString(
        <html>
            <head>
                <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>JS.ORG Subdomain Lookup & Stats</title>
                <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg" />
                <meta name="description" content="Query the registration time, registrant username, modification records, and other relevant information of JS.ORG subdomains. View statistical information of JS.ORG subdomains." />
            </head>
            <body>
                <div id="root">
                    <IndexPage P />
                    <noscript><center>You need to enable JavaScript to run this app.</center></noscript>
                </div>
                {(manifest.index as string[]).map(src => <script src={src}></script>)}
            </body>
        </html>
    );
    result.push(["index.html", html]);
}

function render404() {
    const html = "<!DOCTYPE html>\n" + renderToString(
        <html>
            <head>
                <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>404 Not Found</title>
                <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg" />
            </head>
            <body>
                <h1>404 Not Found</h1>
                <Link href="/">Back to home</Link>
            </body>
        </html>
    );
    result.push(["404.html", html]);
}

renderIndex();
render404();
console.log(JSON.stringify(result));
