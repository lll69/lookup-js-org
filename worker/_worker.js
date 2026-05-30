const DOMAIN_API = "/api/domain/";

const DOMAIN_PATTERN = /^(?:[a-z0-9_\-\.]+)$/;
const JSON_TYPE = { "content-type": "application/json" };

async function domainQuery(path, env) {
    const domain = path.substring(DOMAIN_API.length);
    if (!DOMAIN_PATTERN.test(domain) || domain.length > 60 || domain.length <= 0) {
        return new Response('{"code": 404}', { status: 404, headers: JSON_TYPE });
    }
    let firstChar = domain[0];
    if (!(firstChar >= "a" && firstChar <= "z")) {
        firstChar = "z";
    }
    const url = `https://api.github.com/repos/lll69/js-org-stats/contents/${firstChar}.json?ref=stat`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github.raw+json",
                "Authorization": "Bearer " + env.GITHUB_TOKEN,
                "User-Agent": "LookupJsOrg",
            }
        });
        const text = await response.text();
        if (!response.ok) {
            return new Response(JSON.stringify({
                code: response.status,
                data: text
            }), { status: response.status === 0 ? 500 : response.status, headers: JSON_TYPE });
        }
        const jsonData = JSON.parse(text);
        if (!jsonData.hasOwnProperty(domain)) {
            return new Response(`{"code": 404}`, { status: 404, headers: JSON_TYPE });
        }
        const domainData = jsonData[domain];
        const result = {
            code: 200,
            updateTime: jsonData["^updateTime"],
            ...domainData
        }
        return new Response(JSON.stringify(result), { status: 200, headers: JSON_TYPE });
    } catch (e) {
        return new Response(JSON.stringify({
            code: 500,
        }), { status: 500, headers: JSON_TYPE });
    }
}

async function processApi(path, env) {
    if (path.startsWith(DOMAIN_API)) {
        return domainQuery(path, env);
    }
    return new Response('{"code": 404}', { status: 404, headers: JSON_TYPE });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) {
            if (request.method !== "POST") {
                return new Response("501 Not Implemented", { status: 501, statusText: "Not Implemented" });
            }
            return processApi(url.pathname, env);
        }

        return env.ASSETS.fetch(request);
    },
};
