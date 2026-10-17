const JSON_TYPE = {
    "content-type": "application/json",
};
function headerWithCache(timestampSecond) {
    if (typeof timestampSecond !== "number") timestampSecond = -Infinity;
    let dt = 86400 - (Math.round(Date.now() / 1000) - timestampSecond);
    if (dt > 86400) dt = 86400;
    if (dt < 10) dt = 10;
    return {
        "content-type": "application/json",
        "Cache-Control": "public, max-age=" + dt,
    };
}

export async function onRequestGet({ request, env, params }) {
    const url = "https://api.github.com/repos/lll69/js-org-stats/contents/times.json?ref=stat";
    const urlMonthlyStats = "https://api.github.com/repos/lll69/js-org-stats/contents/monthly_stats.json?ref=stat";
    try {
        let jsonData;
        let jsonDataMonthlyStats;
        {
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
                }), { status: 500, headers: JSON_TYPE });
            }
            jsonData = JSON.parse(text);
        }
        {
            const response = await fetch(urlMonthlyStats, {
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
                }), { status: 500, headers: JSON_TYPE });
            }
            jsonDataMonthlyStats = JSON.parse(text);
        }
        delete jsonDataMonthlyStats["^updateTime"];
        const result = {
            code: 200,
            status: "SUCCESS",
            updateTime: jsonData["^updateTime"],
            data: jsonData.data,
            prData: jsonData.prData,
            monthly: jsonDataMonthlyStats,
        }
        return new Response(JSON.stringify(result), { status: 200, headers: headerWithCache(jsonData["^updateTime"]) });
    } catch (e) {
        return new Response(JSON.stringify({
            code: 500,
            status: "SERVER_ERROR",
        }), { status: 500, headers: JSON_TYPE });
    }
}
