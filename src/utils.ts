import { QueryDayResultData, QueryDayResultSuccessResult, QueryMonthResultData, QueryMonthResultSuccessResult, QueryResultNotSuccessResult, QueryStatus, QueryYearResultData, QueryYearResultSuccessResult } from "./types";

export type TimeItem = number | [time: number, count: number];
export type TimeData = TimeItem[];
export type MonthlyData = {
    xMonth: number[],
    prMonthMergeRate: (number | null)[],
    prMonthTotal: (number | null)[],
    subdomainMonth: (number | null)[],
};
export type TimeDataResponse = {
    "updateTime": number,
    data: TimeData,
    prData: TimeData,
    monthly: MonthlyData,
};

const { abs, floor, sign } = Math;

const SECOND_PER_DAY = 60 * 60 * 24;
const MS_PER_DAY = 1000 * SECOND_PER_DAY;

function convertTime(item: TimeItem): number {
    return typeof item === "number" ? item : item[0];
}

function getYear(time: number) {
    return new Date(time * 1000).getUTCFullYear();
}

function getYearData(timeData: TimeData): QueryYearResultData {
    const minYear = getYear(abs(convertTime(timeData[0])));
    const maxYear = getYear(abs(convertTime(timeData[timeData.length - 1])));
    const result = {};
    for (let i = minYear; i <= maxYear; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const year = getYear(abs(item));
            result[year][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const year = getYear(abs(time));
            result[year][time < 0 ? "-" : "+"] += item[1];
        }
    }
    return result;
}

function getMonthData(timeData: TimeData, requestedYear: number): QueryMonthResultData | null {
    const minYear = getYear(abs(convertTime(timeData[0])));
    const maxYear = getYear(abs(convertTime(timeData[timeData.length - 1])));
    if (requestedYear < minYear || requestedYear > maxYear) {
        return null;
    }
    const result: ({ "+": number, "-": number })[] = Array(12);
    for (let i = 0; i < 12; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const date = new Date(abs(item) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            result[month][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const date = new Date(abs(time) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            result[month][time < 0 ? "-" : "+"] += item[1];
        }
    }
    return result;
}

function getDayData(timeData: TimeData, requestedYear: number, requestedMonth: number): QueryDayResultData | null {
    const minYear = getYear(abs(convertTime(timeData[0])));
    const maxYear = getYear(abs(convertTime(timeData[timeData.length - 1])));
    if (requestedYear < minYear || requestedYear > maxYear || requestedMonth < 0 || requestedMonth >= 12) {
        return null;
    }
    const result = Array(32);
    for (let i = 0; i <= 31; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const date = new Date(abs(item) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            if (month !== requestedMonth) continue;
            const day = date.getUTCDate();
            result[day][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const date = new Date(abs(time) * 1000);
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

export function requestYearData(jsonData: TimeDataResponse): QueryYearResultSuccessResult {
    const data = getYearData(jsonData.data);
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["updateTime"],
        data: data,
    };
}

export function requestMonthData(jsonData: TimeDataResponse, year: number): QueryResultNotSuccessResult | QueryMonthResultSuccessResult {
    const data = getMonthData(jsonData.data, year);
    if (data === null) {
        return {
            code: 404,
            status: QueryStatus.YEAR_NOT_FOUND,
            updateTime: jsonData["updateTime"],
        };
    }
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["updateTime"],
        data: data,
    }
}

export function requestDayData(jsonData: TimeDataResponse, year: number, month: number): QueryResultNotSuccessResult | QueryDayResultSuccessResult {
    const data = getDayData(jsonData.data, year, month);
    if (data === null) {
        return {
            code: 404,
            status: QueryStatus.YEAR_NOT_FOUND,
            updateTime: jsonData["updateTime"],
        };
    }
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["updateTime"],
        data: data,
    }
}

type UtcLineData = [
    x: number[],
    y: (number | null)[],
    yPR: (number | null)[],
];

function getUtcDayMs(timeSecond: number) {
    return floor(timeSecond / SECOND_PER_DAY) * SECOND_PER_DAY * 1000;
}

function previousSpecialDayMs(ms: number) {
    const date = new Date(ms);
    const month = date.getUTCMonth();
    if (month >= 0 && month <= 5) {
        return Date.UTC(date.getUTCFullYear(), 0, 1);
    } else {
        return Date.UTC(date.getUTCFullYear(), 6, 1);
    }
}

function nextSpecialDayMs(ms: number) {
    const date = new Date(ms);
    const month = date.getUTCMonth();
    if (month >= 0 && month <= 5) {
        return Date.UTC(date.getUTCFullYear(), 6, 1);
    } else {
        return Date.UTC(date.getUTCFullYear() + 1, 0, 1);
    }
}

function prevMonthMs(ms: number) {
    const d = new Date(ms);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return month == 0 ? Date.UTC(year - 1, 11, 1) : Date.UTC(year, month - 1, 1);
}

function nextMonthMs(ms: number) {
    const d = new Date(ms);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return month == 11 ? Date.UTC(year + 1, 0, 1) : Date.UTC(year, month + 1, 1);
}

function isSpecialDayMs(value: number) {
    const date = new Date(value);
    const month = date.getUTCMonth();
    return (month === 0 || month === 6) && date.getUTCDate() === 1;
}

export function utcDayToLineData(jsonData: TimeDataResponse | null): UtcLineData {
    if (!jsonData) {
        return [[], [], []];
    }
    const timeData: TimeData = jsonData.data;
    const prTimeData: TimeData = jsonData.prData;
    const realMinDayMs = getUtcDayMs(Math.min(abs(convertTime(timeData[0])), abs(convertTime(prTimeData[0])))) - MS_PER_DAY;
    const minDayMs = previousSpecialDayMs(realMinDayMs);
    const realMaxDayMs = getUtcDayMs(Math.max(abs(convertTime(timeData[timeData.length - 1])), abs(convertTime(prTimeData[prTimeData.length - 1]))));
    const maxDayMs = nextSpecialDayMs(realMaxDayMs);
    const totalDayCount = ((maxDayMs - minDayMs) / MS_PER_DAY) + 1;
    const x: number[] = Array(totalDayCount);
    const y: (number | null)[] = Array(totalDayCount).fill(0);
    const yPR: (number | null)[] = Array(totalDayCount).fill(0);
    let i: number;
    for (i = 0; i < totalDayCount; i++) {
        x[i] = minDayMs + i * MS_PER_DAY;
    }
    let currentDay = minDayMs, count = 0;
    let dayMs: number, delta: number;
    for (const item of timeData) {
        if (typeof item === "number") {
            dayMs = getUtcDayMs(abs(item));
            delta = sign(item);
        } else {
            dayMs = getUtcDayMs(abs(item[0]));
            delta = item[1] * sign(item[0]);
        }
        if (dayMs !== currentDay) {
            y[(currentDay - minDayMs) / MS_PER_DAY] = count;
            currentDay = dayMs;
            count = 0;
        }
        count += delta;
    }
    y[(currentDay - minDayMs) / MS_PER_DAY] = count;
    for (i = 1; i < totalDayCount; i++) {
        y[i]! += y[i - 1]!;
    }
    currentDay = minDayMs, count = 0;
    for (const item of prTimeData) {
        if (typeof item === "number") {
            dayMs = getUtcDayMs(abs(item));
            delta = sign(item);
        } else {
            dayMs = getUtcDayMs(abs(item[0]));
            delta = item[1] * sign(item[0]);
        }
        if (dayMs !== currentDay) {
            yPR[(currentDay - minDayMs) / MS_PER_DAY] = count;
            currentDay = dayMs;
            count = 0;
        }
        count += delta;
    }
    yPR[(currentDay - minDayMs) / MS_PER_DAY] = count;
    for (i = 1; i < totalDayCount; i++) {
        yPR[i]! += yPR[i - 1]!;
    }
    for (i = 0; i < totalDayCount; i++) {
        if (x[i] < realMinDayMs || x[i] > realMaxDayMs) {
            y[i] = yPR[i] = null;
        }
    }
    return [x, y, yPR];
}

export function fillDataWithSpecialDays(data: MonthlyData) {
    const {
        xMonth,
        prMonthMergeRate,
        prMonthTotal,
        subdomainMonth,
    } = data;
    while (!isSpecialDayMs(xMonth[0] * 1000)) {
        xMonth.unshift(prevMonthMs(xMonth[0] * 1000) / 1000);
        prMonthMergeRate.unshift(null);
        prMonthTotal.unshift(null);
        subdomainMonth.unshift(null);
    }
    while (!isSpecialDayMs(xMonth[xMonth.length - 1] * 1000)) {
        xMonth.push(nextMonthMs(xMonth[xMonth.length - 1] * 1000) / 1000);
        prMonthMergeRate.push(null);
        prMonthTotal.push(null);
        subdomainMonth.push(null);
    }
    return data;
}
