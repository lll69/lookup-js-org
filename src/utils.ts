import { QueryDayResultData, QueryDayResultSuccessResult, QueryMonthResultData, QueryMonthResultSuccessResult, QueryResultNotSuccessResult, QueryStatus, QueryYearResultData, QueryYearResultSuccessResult } from "./types";

export type TimeItem = number | [time: number, count: number];
export type TimeData = TimeItem[];
export type TimeDataResponse = { "^updateTime": number, data: TimeData };

function convertTime(item: TimeItem): number {
    return typeof item === "number" ? item : item[0];
}

function getYear(time: number) {
    return new Date(time * 1000).getUTCFullYear();
}

function getYearData(timeData: TimeData): QueryYearResultData {
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

function getMonthData(timeData: TimeData, requestedYear: number): QueryMonthResultData | null {
    const minYear = getYear(Math.abs(convertTime(timeData[0])));
    const maxYear = getYear(Math.abs(convertTime(timeData[timeData.length - 1])));
    if (requestedYear < minYear || requestedYear > maxYear) {
        return null;
    }
    const result: ({ "+": number, "-": number })[] = Array(12);
    for (let i = 0; i < 12; i++) {
        result[i] = { "+": 0, "-": 0 };
    }
    for (const item of timeData) {
        if (typeof item === "number") {
            const date = new Date(Math.abs(item) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            result[month][item < 0 ? "-" : "+"]++;
        } else {
            const time = item[0];
            const date = new Date(Math.abs(time) * 1000);
            const year = date.getUTCFullYear();
            if (year !== requestedYear) continue;
            const month = date.getUTCMonth();
            result[month][time < 0 ? "-" : "+"] += item[1];
        }
    }
    return result;
}

function getDayData(timeData: TimeData, requestedYear: number, requestedMonth: number): QueryDayResultData | null {
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

export function requestYearData(jsonData: TimeDataResponse): QueryYearResultSuccessResult {
    const data = getYearData(jsonData.data);
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["^updateTime"],
        data: data,
    };
}

export function requestMonthData(jsonData: TimeDataResponse, year: number): QueryResultNotSuccessResult | QueryMonthResultSuccessResult {
    const data = getMonthData(jsonData.data, year);
    if (data === null) {
        return {
            code: 404,
            status: QueryStatus.YEAR_NOT_FOUND,
            updateTime: jsonData["^updateTime"],
        };
    }
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["^updateTime"],
        data: data,
    }
}

export function requestDayData(jsonData: TimeDataResponse, year: number, month: number): QueryResultNotSuccessResult | QueryDayResultSuccessResult {
    const data = getDayData(jsonData.data, year, month);
    if (data === null) {
        return {
            code: 404,
            status: QueryStatus.YEAR_NOT_FOUND,
            updateTime: jsonData["^updateTime"],
        };
    }
    return {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: jsonData["^updateTime"],
        data: data,
    }
}
