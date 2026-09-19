export const enum QueryStatus {
    SUCCESS = "SUCCESS",
    INVALID_INPUT = "INVALID_INPUT",
    UPSTREAM_ERROR = "UPSTREAM_ERROR",
    DOMAIN_NOT_FOUND = "DOMAIN_NOT_FOUND",
    SERVER_ERROR = "SERVER_ERROR",
    YEAR_NOT_FOUND = "YEAR_NOT_FOUND",
}

export type HistoryItem = {
    time: number,
    type: "cname" | "ns" | "remove",
    server: string | string[] | null,
    comment: string | null,
    commit: string,
    pull: number | null,
}
export type PullInfoItem = {
    username: string,
    labels: {
        name: string,
        description: string,
    }[],
}

export type QueryResultNotSuccessResult = {
    code: 400 | 404 | 500,
    status: QueryStatus,
    upstreamCode?: number,
    updateTime?: number,
    data?: any,
}
export type QueryResultNotSuccess = {
    hasResult: true,
    result: QueryResultNotSuccessResult,
}
export type QueryResultSuccess = {
    hasResult: true,
    result: {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: number,
        name: string,
        history: HistoryItem[],
        pullInfo: {
            [pull: string]: PullInfoItem
        },
    },
}
export type QueryResultError = {
    hasResult: false,
    error: string,
}
export type QueryResult = QueryResultSuccess | QueryResultNotSuccess | QueryResultError;

export type QueryYearResultNotSuccess = QueryResultNotSuccess;
export type QueryYearResultData = {
    [year: string]: {
        "+": number,
        "-": number,
    }
}
export type QueryYearResultSuccessResult = {
    code: 200,
    status: QueryStatus.SUCCESS,
    updateTime: number,
    data: QueryYearResultData,
}
export type QueryYearResultSuccess = {
    hasResult: true,
    result: QueryYearResultSuccessResult,
}
export type QueryYearResultError = QueryResultError;
export type QueryYearResult = QueryYearResultSuccess | QueryYearResultNotSuccess | QueryYearResultError;

export type QueryMonthResultNotSuccess = QueryResultNotSuccess;
export type QueryMonthResultData = {
    "+": number,
    "-": number,
}[];
export type QueryMonthResultSuccessResult = {
    code: 200,
    status: QueryStatus.SUCCESS,
    updateTime: number,
    data: QueryMonthResultData,
};
export type QueryMonthResultSuccess = {
    hasResult: true,
    result: QueryMonthResultSuccessResult,
}
export type QueryMonthResultError = QueryResultError;
export type QueryMonthResult = QueryMonthResultSuccess | QueryMonthResultNotSuccess | QueryMonthResultError;

export type QueryDayResultNotSuccess = QueryResultNotSuccess;
export type QueryDayResultData = {
    "+": number,
    "-": number,
}[];
export type QueryDayResultSuccessResult = {
    code: 200,
    status: QueryStatus.SUCCESS,
    updateTime: number,
    data: QueryDayResultData,
}
export type QueryDayResultSuccess = {
    hasResult: true,
    result: QueryDayResultSuccessResult,
}
export type QueryDayResultError = QueryResultError;
export type QueryDayResult = QueryDayResultSuccess | QueryDayResultNotSuccess | QueryDayResultError;
