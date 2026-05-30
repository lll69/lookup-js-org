import { argv } from 'node:process';
import { renderToString } from 'react-dom/server';
import IndexPage from './IndexPage';

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
                    <IndexPage />
                    <noscript><center>You need to enable JavaScript to run this app.</center></noscript>
                </div>
                {(manifest.index as string[]).map(src => <script src={src}></script>)}
            </body>
        </html>
    );
    result.push(["index.html", html]);
}

renderIndex()
console.log(JSON.stringify(result));
