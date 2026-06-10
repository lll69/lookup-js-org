const JSON_TYPE = {
    "content-type": "application/json",
};
const JSON_WITH_CACHE = {
    "content-type": "application/json",
    "Cache-Control": "public, max-age=21600",
};
function headerWithCache(timestampSecond) {
    if (typeof timestampSecond !== "number") timestampSecond = Infinity;
    let dt = Math.round(Date.now() / 1000) - timestampSecond;
    if (dt > 86400) dt = 86400;
    if (dt < 10) dt = 10;
    return {
        "content-type": "application/json",
        "Cache-Control": "public, max-age=" + dt,
    };
}

function getData(timeData, requestedYear, requestedMonth, requestedDay) {
    const result = {};
    for (const item of timeData) {
        const time = item[0];
        const date = new Date(Math.abs(time) * 1000);
        const year = date.getUTCFullYear();
        if (year !== requestedYear) continue;
        const month = date.getUTCMonth();
        if (month !== requestedMonth) continue;
        const day = date.getUTCDate();
        if (day !== requestedDay) continue;
        result[time] = item[1];
    }
    return result;
}

export async function onRequestGet({ request, env, params }) {
    const yearStr = String(params.year).trim();
    const monthStr = String(params.year).trim();
    const dayStr = String(params.year).trim();
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(yearStr) || isNaN(monthStr) || isNaN(dayStr) || month < 0 || month >= 12 || day < 1 || day > 31) {
        return new Response(JSON.stringify({
            code: 400,
            status: "INVALID_INPUT",
        }), { status: 400, headers: JSON_WITH_CACHE });
    }
    const url = `https://api.github.com/repos/lll69/js-org-stats/contents/${year}.json?ref=stat`;
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
            }), { status: 500, headers: JSON_TYPE });
        }
        const jsonData = JSON.parse(text);
        const data = getData(jsonData.data, year, month, day);
        if (data === null) {
            return new Response(JSON.stringify({
                code: 404,
                status: "YEAR_NOT_FOUND",
                updateTime: jsonData["^updateTime"],
            }), { status: 404, headers: headerWithCache(jsonData["^updateTime"]) });
        }
        const result = {
            code: 200,
            status: "SUCCESS",
            updateTime: jsonData["^updateTime"],
            data: data,
        }
        return new Response(JSON.stringify(result), { status: 200, headers: headerWithCache(jsonData["^updateTime"]) });
    } catch (e) {
        return new Response(JSON.stringify({
            code: 500,
            status: "SERVER_ERROR",
        }), { status: 500, headers: JSON_TYPE });
    }
}
