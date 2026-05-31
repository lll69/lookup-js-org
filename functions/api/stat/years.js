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

function getYearData(timeData) {
    const minYear = getYear(Math.abs(convertTime(timeData[0])));
    const maxYear = getYear(Math.abs(convertTime(timeData[timeData.length - 1])));
    const result = {};
    for (let i = minYear; i <= maxYear; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const year = getYear(Math.abs(item));
            result[year][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const year = getYear(Math.abs(time));
            result[year][time < 0 ? "-" : "+"] += item[1];
        }
    }
    return result;
}

export async function onRequestGet({ request, env, params }) {
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
        const data = getYearData(jsonData.data);
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
