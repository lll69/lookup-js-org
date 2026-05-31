const JSON_TYPE = {
    "content-type": "application/json",
};
const JSON_WITH_CACHE = {
    "content-type": "application/json",
    "Cache-Control": "max-age=21600",
};

function convertTime(item) {
    return typeof item === "number" ? item : item[0];
}

function getYear(time) {
    return new Date(time * 1000).getUTCFullYear();
}

function getDayData(timeData, requestedYear, requestedMonth) {
    const minYear = getYear(Math.abs(convertTime(timeData[0])));
    const maxYear = getYear(Math.abs(convertTime(timeData[timeData.length - 1])));
    if (requestedYear < minYear || requestedYear > maxYear || requestedMonth < 0 || requestedMonth >= 12) {
        return null;
    }
    const result = Array(32);
    for (let i = 0; i <= 31; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const date = new Date(Math.abs(item) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            if (month !== requestedMonth) continue;
            const day = date.getUTCDate();
            result[day][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const date = new Date(Math.abs(time) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            if (month !== requestedMonth) continue;
            const day = date.getUTCDate();
            result[day][time < 0 ? "-" : "+"] += item[1];
        }
    }
    return result;
}

export async function onRequestGet({ request, env, params }) {
    const pathParts = params.day;
    if (pathParts.length !== 2) {
        return new Response(JSON.stringify({
            code: 400,
            status: "INVALID_INPUT",
        }), { status: 400, headers: JSON_WITH_CACHE });
    }
    const yearStr = pathParts[0];
    const year = parseInt(yearStr);
    const monthStr = pathParts[1];
    const month = parseInt(monthStr);
    if (isNaN(year) || isNaN(month) || isNaN(yearStr) || isNaN(monthStr) || month < 0 || month >= 12) {
        return new Response(JSON.stringify({
            code: 400,
            status: "INVALID_INPUT",
        }), { status: 400, headers: JSON_WITH_CACHE });
    }
    const url = "https://api.github.com/repos/lll69/js-org-stats/contents/times.json?ref=stat";
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
        const data = getDayData(jsonData.data, year, month);
        if (data === null) {
            return new Response(JSON.stringify({
                code: 404,
                status: "YEAR_NOT_FOUND",
                updateTime: jsonData["^updateTime"],
            }), { status: 404, headers: JSON_WITH_CACHE });
        }
        const result = {
            code: 200,
            status: "SUCCESS",
            updateTime: jsonData["^updateTime"],
            data: data,
        }
        return new Response(JSON.stringify(result), { status: 200, headers: JSON_WITH_CACHE });
    } catch (e) {
        return new Response(JSON.stringify({
            code: 500,
            status: "SERVER_ERROR",
        }), { status: 500, headers: JSON_TYPE });
    }
}
