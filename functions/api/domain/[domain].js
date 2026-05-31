const DOMAIN_API = "/api/domain/";

const DOMAIN_PATTERN = /^(?:[a-z0-9_\-\.]+)$/;
const JSON_TYPE = {
    "content-type": "application/json",
};
const JSON_WITH_CACHE = {
    "content-type": "application/json",
    "Cache-Control": "max-age=21600",
};

async function fillPullInfo(domainData, env) {
    const historyItems = domainData.history;
    const prIds = new Set();
    const prInfo = {};
    for (const historyItem of historyItems) {
        if (historyItem.pull !== null) {
            prIds.add(historyItem.pull);
        }
    }
    for (const pr of prIds) {
        try {
            const response = await fetch("https://api.github.com/repos/js-org/js.org/pulls/" + pr, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + env.GITHUB_TOKEN,
                    "User-Agent": "LookupJsOrg",
                },
                cf: {
                    cacheTtl: 86400,
                    cacheEverything: true,
                }
            });
            if (!response.ok) {
                continue
            }
            const text = await response.text();
            const jsonData = JSON.parse(text);
            const info = {
                username: jsonData.user.login,
                labels: jsonData.labels.map(item => ({ name: item.name, description: item.description }))
            };
            prInfo[pr] = info;
        } catch (e) {
        }
    }
    domainData.pullInfo = prInfo;
}

async function domainQuery(domain, env) {
    if (!DOMAIN_PATTERN.test(domain) || domain.length > 60 || domain.length <= 0) {
        return new Response(JSON.stringify({
            code: 400,
            status: "INVALID_INPUT",
        }), { status: 400, headers: JSON_WITH_CACHE });
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
            },
            cf: {
                cacheTtl: 21600,
                cacheEverything: true,
            }
        });
        const text = await response.text();
        if (!response.ok) {
            return new Response(JSON.stringify({
                code: 500,
                status: "UPSTREAM_ERROR",
                upstreamCode: response.status,
                data: text
            }), { status: 500, headers: JSON_TYPE });
        }
        const jsonData = JSON.parse(text);
        if (!jsonData.hasOwnProperty(domain)) {
            return new Response(JSON.stringify({
                code: 404,
                status: "DOMAIN_NOT_FOUND",
                updateTime: jsonData["^updateTime"],
            }), { status: 404, headers: JSON_WITH_CACHE });
        }
        const domainData = jsonData[domain];
        await fillPullInfo(domainData, env);
        const result = {
            code: 200,
            status: "SUCCESS",
            updateTime: jsonData["^updateTime"],
            ...domainData
        }
        return new Response(JSON.stringify(result), { status: 200, headers: JSON_WITH_CACHE });
    } catch (e) {
        return new Response(JSON.stringify({
            code: 500,
        }), { status: 500, headers: JSON_TYPE });
    }
}

export async function onRequestGet({ request, env, params }) {
    const domain = String(params.domain);
    let response = await domainQuery(domain, env);
    return response;
}
