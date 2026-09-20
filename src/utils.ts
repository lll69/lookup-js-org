import { QueryDayResultData, QueryDayResultSuccessResult, QueryMonthResultData, QueryMonthResultSuccessResult, QueryResultNotSuccessResult, QueryStatus, QueryYearResultData, QueryYearResultSuccessResult } from "./types";

export type TimeItem = number | [time: number, count: number];
export type TimeData = TimeItem[];
export type TimeDataResponse = { "updateTime": number, data: TimeData };

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
    y: number[],
];

function getUtcDayMs(timeSecond: number) {
    return floor(timeSecond / SECOND_PER_DAY) * SECOND_PER_DAY * 1000;
}

export function utcDayToLineData(jsonData: TimeDataResponse | null): UtcLineData {
    if (!jsonData) {
        return [[], []];
    }
    const timeData: TimeData = jsonData.data;
    const minDayMs = getUtcDayMs(abs(convertTime(timeData[0]))) - MS_PER_DAY;
    const maxDayMs = getUtcDayMs(abs(convertTime(timeData[timeData.length - 1])));
    const totalDayCount = ((maxDayMs - minDayMs) / MS_PER_DAY) + 1;
    const x: number[] = Array(totalDayCount);
    const y: number[] = Array(totalDayCount).fill(0);
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
        y[i] += y[i - 1];
    }
    x.length--;
    y.length--;
    return [x, y];
}
