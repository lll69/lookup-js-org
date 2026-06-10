import styled from "@emotion/styled";
import { LoadingButton } from "@mui/lab";
import { AppBar, Box, Card, Chip, CircularProgress, Container, createTheme, CssBaseline, Divider, InputAdornment, Link, Paper, Slide, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ThemeProvider, Toolbar, Tooltip, Typography, useMediaQuery, useScrollTrigger } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type HistoryItem = {
    time: number,
    type: "cname" | "ns" | "remove",
    server: string | string[] | null,
    comment: string | null,
    commit: string,
    pull: number | null,
}
type PullInfoItem = {
    username: string,
    labels: {
        name: string,
        description: string,
    }[],
}
const enum QueryStatus {
    SUCCESS = "SUCCESS",
    INVALID_INPUT = "INVALID_INPUT",
    UPSTREAM_ERROR = "UPSTREAM_ERROR",
    DOMAIN_NOT_FOUND = "DOMAIN_NOT_FOUND",
    SERVER_ERROR = "SERVER_ERROR",
    YEAR_NOT_FOUND = "YEAR_NOT_FOUND",
}
type QueryResultNotSuccess = {
    hasResult: true,
    result: {
        code: 400 | 404 | 500,
        status: QueryStatus,
        upstreamCode?: number,
        updateTime?: number,
        data?: any,
    },
}
type QueryResultSuccess = {
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
type QueryResultError = {
    hasResult: false,
    error: string,
}
type QueryResult = QueryResultSuccess | QueryResultNotSuccess | QueryResultError;

type QueryYearResultNotSuccess = QueryResultNotSuccess;
type QueryYearResultSuccess = {
    hasResult: true,
    result: {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: number,
        data: {
            [year: string]: {
                "+": number,
                "-": number,
            }
        },
    },
}
type QueryYearResultError = QueryResultError;
type QueryYearResult = QueryYearResultSuccess | QueryYearResultNotSuccess | QueryYearResultError;

type QueryMonthResultNotSuccess = QueryResultNotSuccess;
type QueryMonthResultSuccess = {
    hasResult: true,
    result: {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: number,
        data: {
            [month: string]: {
                "+": number,
                "-": number,
            }
        },
    },
}
type QueryMonthResultError = QueryResultError;
type QueryMonthResult = QueryMonthResultSuccess | QueryMonthResultNotSuccess | QueryMonthResultError;

type QueryDayResultNotSuccess = QueryResultNotSuccess;
type QueryDayResultSuccess = {
    hasResult: true,
    result: {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: number,
        data: {
            [day: string]: {
                "+": number,
                "-": number,
            }
        },
    },
}
type QueryDayResultError = QueryResultError;
type QueryDayResult = QueryDayResultSuccess | QueryDayResultNotSuccess | QueryDayResultError;

type QueryDomainResultNotSuccess = QueryResultNotSuccess;
type QueryDomainResultSuccess = {
    hasResult: true,
    result: {
        code: 200,
        status: QueryStatus.SUCCESS,
        updateTime: number,
        data: {
            "^updateTime": number,
            [time: number]: string | string[]
        },
    },
}
type QueryDomainResultError = QueryResultError;
type QueryDomainResult = QueryDomainResultSuccess | QueryDomainResultNotSuccess | QueryDomainResultError;

const API_BASE = "";

const queryStatusString = {
    [QueryStatus.SUCCESS]: "Success",
    [QueryStatus.INVALID_INPUT]: "Invalid Input",
    [QueryStatus.UPSTREAM_ERROR]: "Server Error",
    [QueryStatus.DOMAIN_NOT_FOUND]: "Domain Not Found",
    [QueryStatus.SERVER_ERROR]: "Internal Server Error",
    [QueryStatus.YEAR_NOT_FOUND]: "Year Not Found",
}

const HideOnScroll = ({ children }) => {
    const trigger = useScrollTrigger();

    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}

const boxSx = {
    my: 2,
    textAlign: "center",
};

const CenterFlexBox = styled(Box)({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
});

const domainPattern = /^(?:[a-z0-9_\-\.]+)$/;

const inputProps = {
    pattern: "^(?:[a-z0-9_\\-\\.]+)$",
    maxLength: 60,
};

const InlinePre = styled.pre({
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "inline",
    fontFamily: "'Roboto Mono', monospace",
});

const BlockPre = styled.pre({
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "inline-block",
    textAlign: "left",
    fontFamily: "'Roboto Mono', monospace",
});

const CardWithMargin = styled(Card)({
    margin: "16px 0",
    padding: "16px",
    textAlign: "left",
});

const UlNoMargin = styled.ul({
    marginBlock: "0",
});

const ClickableSummary = styled.summary({
    cursor: "pointer",
    userSelect: "none",
});

const MarginDiv = styled.div({
    height: "256px",
});

const marginTopStyle = {
    marginTop: "8px",
};

const QueryPart = memo(({ P }: { P?: boolean }) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const domainInputRef = useRef<HTMLInputElement>(null);
    const validateInput = useCallback(() => {
        const isError = !domainPattern.test(domainInputRef.current!.value);
        setError(isError);
        if (queryResult !== null) setQueryResult(null);
        return !isError;
    }, []);
    const submitQuery = useCallback(() => {
        if (!validateInput()) {
            domainInputRef.current!.focus();
            return;
        }
        setLoading(true);
        const domain = domainInputRef.current!.value;
        async function asyncFetch() {
            let response: Response;
            try {
                response = await fetch(API_BASE + "/api/domain/" + domain, { method: "GET" });
                const text = await response.text();
                setQueryResult({ hasResult: true, result: JSON.parse(text) });
                setLoading(false);
            } catch (e) {
                setLoading(false);
                // @ts-ignore
                setQueryResult({ hasResult: false, error: response && !response.ok && response.status !== 0 ? "Error: Status = " + response.status : String(e) });
            }
        }
        asyncFetch();
    }, []);
    const onKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.repeat) {
            submitQuery();
        }
    }, []);
    return <div>
        <CenterFlexBox>
            <TextField
                error={error}
                disabled={loading || P}
                id="domain"
                label="Domain"
                variant="filled"
                InputProps={{
                    endAdornment: <InputAdornment position="end">.js.org</InputAdornment>
                }}
                defaultValue={P ? "Loading..." : "lookup"}
                inputRef={domainInputRef}
                inputProps={inputProps}
                onInput={validateInput}
                onKeyDown={onKeyDown} />
            <InlinePre>&nbsp;</InlinePre>
            <LoadingButton
                variant="contained"
                disabled={error}
                loading={loading || P}
                onClick={submitQuery}>
                Lookup
            </LoadingButton>
        </CenterFlexBox>
        {queryResult !== null && (!queryResult.hasResult ? (
            <Box>
                <br />
                <InlinePre>{queryResult.error}</InlinePre>
            </Box>
        ) : queryResult.result.code !== 200 ? (
            <Box>
                <br />
                {queryResult.result.updateTime && (
                    <Typography variant="h6" component="p">
                        <b>Data Update Time:</b> <InlinePre>{new Date(queryResult.result.updateTime * 1000).toLocaleString()}</InlinePre>
                    </Typography>
                )}
                <div>
                    <InlinePre>Error: {queryStatusString[queryResult.result.status]}</InlinePre>
                </div>
                {queryResult.result.data && (
                    <details>
                        <ClickableSummary>Raw Data</ClickableSummary>
                        <BlockPre>{queryResult.result.data}</BlockPre>
                    </details>
                )}
            </Box>
        ) : (
            <Box>
                <br />
                <Typography variant="h6" component="p">
                    <b>Data Update Time:</b> <InlinePre>{new Date(queryResult.result.updateTime * 1000).toLocaleString()}</InlinePre>
                </Typography>
                <Typography variant="h6" component="p">
                    <b>Name:</b> <InlinePre>{queryResult.result.name}.js.org</InlinePre>
                </Typography>
                {queryResult.result.history.map((historyItem, i) => (
                    <CardWithMargin key={historyItem.time}>
                        <Typography variant="h5" component="div">
                            <b>{historyItem.type === "remove" ? "Remove" : (i === 0 || (queryResult as QueryResultSuccess).result.history[i - 1].type === "remove") ? "Register" : "Change"}</b>
                        </Typography>
                        <Typography variant="body2" component="div">
                            <b>Time:</b> <InlinePre>{new Date(historyItem.time * 1000).toLocaleString()}</InlinePre>
                        </Typography>
                        {historyItem.pull !== null && <>
                            {(queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull] && (
                                <Typography variant="body2" component="div">
                                    <b>User:</b> <Link target="_blank" href={"https://github.com/" + (queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull].username}><InlinePre>{(queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull].username}</InlinePre></Link>
                                </Typography>
                            )}
                            <Typography variant="body2" component="div">
                                <b>Pull Request:</b> <Link target="_blank" href={"https://github.com/js-org/js.org/pull/" + historyItem.pull}><InlinePre>#{historyItem.pull}</InlinePre></Link>
                            </Typography>
                        </>}
                        <Typography variant="body2" component="div">
                            <b>Git Commit:</b> <Link target="_blank" href={"https://github.com/js-org/js.org/commit/" + historyItem.commit}><InlinePre>{historyItem.commit.substring(0, 7)}</InlinePre></Link>
                        </Typography>
                        {historyItem.server !== null && (typeof historyItem.server === "string" ? (<>
                            <Typography variant="body2" component="div">
                                <b>{historyItem.type === "cname" ? "CNAME " : "NS "}Server:</b> <InlinePre>{historyItem.server}</InlinePre>
                            </Typography>
                            {historyItem.comment !== null && (
                                <Typography variant="body2" component="div">
                                    <b>Comment:</b> <InlinePre>{"// " + historyItem.comment}</InlinePre>
                                </Typography>
                            )}
                        </>) : (
                            <Typography variant="body2" component="div">
                                <b>{historyItem.type === "cname" ? "CNAME " : "NS "}Servers:</b>
                                <UlNoMargin>
                                    {historyItem.server.map(server => (
                                        <li key={server}><InlinePre>{server}</InlinePre></li>
                                    ))}
                                </UlNoMargin>
                            </Typography>
                        ))}
                        {historyItem.pull !== null && (queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull] && (queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull].labels.map(label => (
                            <><Tooltip key={label.name} title={label.description}><Chip label={label.name} variant="outlined" /></Tooltip>{" "}</>
                        ))}
                    </CardWithMargin>
                ))}
                <details>
                    <ClickableSummary>Raw Data</ClickableSummary>
                    <BlockPre>{JSON.stringify(queryResult.result, null, 2)}</BlockPre>
                </details>
            </Box>
        ))}
    </div>
});

const StatPart = memo(({ P }: { P?: boolean }) => {
    const [loadingYear, setLoadingYear] = useState(true);
    const [queryResultYear, setQueryResultYear] = useState<QueryYearResult | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [queryResultMonth, setQueryResultMonth] = useState<QueryMonthResult | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [loadingDay, setLoadingDay] = useState(false);
    const [queryResultDay, setQueryResultDay] = useState<QueryDayResult | null>(null);
    const [day, setDay] = useState<number | null>(null);
    const [loadingDomain, setLoadingDomain] = useState(false);
    const [queryResultDomain, setQueryResultDomain] = useState<QueryDomainResult | null>(null);
    const monthProgressRef = useRef<HTMLParagraphElement>(null);
    const monthRef = useRef<HTMLDivElement>(null);
    const dayProgressRef = useRef<HTMLParagraphElement>(null);
    const dayRef = useRef<HTMLDivElement>(null);
    const domainProgressRef = useRef<HTMLParagraphElement>(null);
    const domainRef = useRef<HTMLDivElement>(null);
    const asyncFetchYear = useCallback(async () => {
        let response: Response;
        try {
            response = await fetch(API_BASE + "/api/stat/years", { method: "GET" });
            const text = await response.text();
            setQueryResultYear({ hasResult: true, result: JSON.parse(text) });
            setLoadingYear(false);
        } catch (e) {
            setLoadingYear(false);
            // @ts-ignore
            setQueryResultYear({ hasResult: false, error: response && !response.ok && response.status !== 0 ? "Error: Status = " + response.status : String(e) });
        }
    }, []);
    useEffect(() => { if (!P) asyncFetchYear() }, []);
    const hasYearResult = (queryResultYear !== null && queryResultYear.hasResult && queryResultYear.result.status === QueryStatus.SUCCESS);
    const yearKeys = useMemo(() => (
        hasYearResult ? Object.keys(queryResultYear.result.data) : null
    ), [queryResultYear]);
    const yearXAxis = useMemo(() => (
        hasYearResult ? [{ scaleType: "band" as "band", data: yearKeys! }] : null
    ), [queryResultYear]);
    const yearSeries = useMemo(() => (
        hasYearResult ? [
            {
                data: yearKeys!.map(year => queryResultYear.result.data[year]["+"]),
                label: "Register",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
            {
                data: yearKeys!.map(year => queryResultYear.result.data[year]["-"]),
                label: "Remove",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
        ] : null
    ), [queryResultYear]);
    const asyncFetchMonth = useCallback(async (year: string) => {
        let response: Response;
        try {
            response = await fetch(API_BASE + "/api/stat/month/" + year, { method: "GET" });
            const text = await response.text();
            setQueryResultMonth({ hasResult: true, result: JSON.parse(text) });
            setLoadingMonth(false);
        } catch (e) {
            setLoadingMonth(false);
            // @ts-ignore
            setQueryResultMonth({ hasResult: false, error: response && !response.ok && response.status !== 0 ? "Error: Status = " + response.status : String(e) });
        }
    }, []);
    const onYearClick = useCallback((_, data: { dataIndex: number } | null) => {
        if (loadingMonth || data === null || typeof data.dataIndex === "undefined") return;
        const year = yearKeys![data.dataIndex];
        setLoadingMonth(true);
        setYear(parseInt(year));
        setQueryResultMonth(null);
        setQueryResultDay(null);
        setQueryResultDomain(null);
        asyncFetchMonth(year);
    }, [loadingMonth, yearKeys, asyncFetchMonth]);
    const hasMonthResult = (queryResultMonth !== null && queryResultMonth.hasResult && queryResultMonth.result.status === QueryStatus.SUCCESS);
    const monthKeys = useMemo(() => (
        hasMonthResult ? Object.keys(queryResultMonth.result.data) : null
    ), [queryResultMonth]);
    const monthXAxis = useMemo(() => (
        hasMonthResult ? [{ scaleType: "band" as "band", data: monthKeys!.map(x => year + "-" + (parseInt(x) + 1)) }] : null
    ), [queryResultMonth]);
    const monthSeries = useMemo(() => (
        hasMonthResult ? [
            {
                data: monthKeys!.map(month => queryResultMonth.result.data[month]["+"]),
                label: "Register",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
            {
                data: monthKeys!.map(month => queryResultMonth.result.data[month]["-"]),
                label: "Remove",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
        ] : null
    ), [queryResultMonth]);
    useEffect(() => {
        if (loadingMonth) {
            if (monthProgressRef.current !== null) {
                monthProgressRef.current.scrollIntoView();
            }
        }
        if (!loadingMonth && queryResultMonth !== null && queryResultMonth.hasResult && queryResultMonth.result.code === 200) {
            if (monthRef.current !== null) {
                monthRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [loadingMonth, queryResultMonth]);
    const asyncFetchDay = useCallback(async (month: string) => {
        let response: Response;
        try {
            response = await fetch(API_BASE + "/api/stat/day/" + year + "/" + month, { method: "GET" });
            const text = await response.text();
            setQueryResultDay({ hasResult: true, result: JSON.parse(text) });
            setLoadingDay(false);
        } catch (e) {
            setLoadingDay(false);
            // @ts-ignore
            setQueryResultDay({ hasResult: false, error: response && !response.ok && response.status !== 0 ? "Error: Status = " + response.status : String(e) });
        }
    }, [year]);
    const onMonthClick = useCallback((_, data: { dataIndex: number } | null) => {
        if (loadingDay || data === null || typeof data.dataIndex === "undefined") return;
        const month = monthKeys![data.dataIndex];
        setLoadingDay(true);
        setMonth(parseInt(month));
        setQueryResultDay(null);
        setQueryResultDomain(null);
        asyncFetchDay(month);
    }, [loadingDay, monthKeys, asyncFetchDay]);
    const hasDayResult = (queryResultDay !== null && queryResultDay.hasResult && queryResultDay.result.status === QueryStatus.SUCCESS);
    const dayKeys = useMemo(() => (
        hasDayResult ? Object.keys(queryResultDay.result.data).filter(day => queryResultDay.result.data[day]["+"] + queryResultDay.result.data[day]["-"] > 0) : null
    ), [queryResultDay]);
    const dayXAxis = useMemo(() => (
        hasDayResult ? [{ scaleType: "band" as "band", data: dayKeys! }] : null
    ), [queryResultDay]);
    const daySeries = useMemo(() => (
        hasDayResult ? [
            {
                data: dayKeys!.map(day => queryResultDay.result.data[day]["+"]),
                label: "Register",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
            {
                data: dayKeys!.map(day => queryResultDay.result.data[day]["-"]),
                label: "Remove",
                barLabel: "value" as "value",
                barLabelPlacement: "outside" as "outside",
            },
        ] : null
    ), [queryResultDay]);
    useEffect(() => {
        if (loadingDay) {
            if (dayProgressRef.current !== null) {
                dayProgressRef.current.scrollIntoView();
            }
        }
        if (!loadingDay && queryResultDay !== null && queryResultDay.hasResult && queryResultDay.result.code === 200) {
            if (dayRef.current !== null) {
                dayRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [loadingDay, queryResultDay]);
    const asyncFetchDomain = useCallback(async (day: string) => {
        let response: Response;
        try {
            response = await fetch(API_BASE + "/api/query/day/" + year + "/" + month + "/" + day, { method: "GET" });
            const text = await response.text();
            setQueryResultDomain({ hasResult: true, result: JSON.parse(text) });
            setLoadingDomain(false);
        } catch (e) {
            setLoadingDomain(false);
            // @ts-ignore
            setQueryResultDomain({ hasResult: false, error: response && !response.ok && response.status !== 0 ? "Error: Status = " + response.status : String(e) });
        }
    }, [year, month]);
    const onDayClick = useCallback((_, data: { dataIndex: number } | null) => {
        if (loadingDomain || data === null || typeof data.dataIndex === "undefined") return;
        const day = dayKeys![data.dataIndex];
        setLoadingDomain(true);
        setDay(parseInt(day));
        setQueryResultDomain(null);
        asyncFetchDomain(day);
    }, [loadingDomain, dayKeys, asyncFetchDomain]);
    useEffect(() => {
        if (loadingDomain) {
            if (domainProgressRef.current !== null) {
                domainProgressRef.current.scrollIntoView();
            }
        }
        if (!loadingDomain && queryResultDomain !== null && queryResultDomain.hasResult && queryResultDomain.result.code === 200) {
            if (domainRef.current !== null) {
                domainRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [loadingDomain, queryResultDomain]);
    return <div>
        <Divider />
        <Typography variant="h4" component="h2" sx={marginTopStyle}>
            Stats (UTC time)
        </Typography>
        {loadingYear && <><p><CircularProgress />{" Loading stats..."}</p></>}
        {!loadingYear && queryResultYear !== null && (!queryResultYear.hasResult ? (
            <Box>
                <br />
                <InlinePre>{queryResultYear.error}</InlinePre>
            </Box>
        ) : queryResultYear.result.code !== 200 ? (
            <Box>
                <br />
                {queryResultYear.result.updateTime && (
                    <Typography variant="h6" component="p">
                        <b>Data Update Time:</b> <InlinePre>{new Date(queryResultYear.result.updateTime * 1000).toISOString()}</InlinePre>
                    </Typography>
                )}
                <div>
                    <InlinePre>Error: {queryStatusString[queryResultYear.result.status]}</InlinePre>
                </div>
                {queryResultYear.result.data && (
                    <details>
                        <ClickableSummary>Raw Data</ClickableSummary>
                        <BlockPre>{queryResultYear.result.data}</BlockPre>
                    </details>
                )}
            </Box>
        ) : (
            <Box>
                <br />
                <Typography variant="h6" component="p">
                    <b>Data Update Time:</b> <InlinePre>{new Date(queryResultYear.result.updateTime * 1000).toISOString()}</InlinePre>
                </Typography>
                <Typography variant="h6" component="p">
                    Click a year to show monthly stats
                </Typography>
                <BarChart
                    xAxis={yearXAxis!}
                    series={yearSeries!}
                    height={400}
                    onItemClick={onYearClick}
                    onAxisClick={onYearClick} />
            </Box>
        ))}
        {loadingMonth && <><p ref={monthProgressRef}><CircularProgress />{" Loading monthly stats..."}</p></>}
        {!loadingMonth && queryResultMonth !== null && (!queryResultMonth.hasResult ? (
            <Box>
                <br />
                <InlinePre>{queryResultMonth.error}</InlinePre>
            </Box>
        ) : queryResultMonth.result.code !== 200 ? (
            <Box>
                <br />
                <div>
                    <InlinePre>Error: {queryStatusString[queryResultMonth.result.status]}</InlinePre>
                </div>
                {queryResultMonth.result.data && (
                    <details>
                        <ClickableSummary>Raw Data</ClickableSummary>
                        <BlockPre>{queryResultMonth.result.data}</BlockPre>
                    </details>
                )}
            </Box>
        ) : (
            <Box ref={monthRef}>
                <br />
                <Typography variant="h6" component="p">
                    <b>Data Update Time:</b> <InlinePre>{new Date(queryResultMonth.result.updateTime * 1000).toISOString()}</InlinePre>
                </Typography>
                <Typography variant="h6" component="p">
                    <b>Monthly stats for {year}:</b>
                </Typography>
                <Typography variant="h6" component="p">
                    Click a month to show daily stats
                </Typography>
                <BarChart
                    xAxis={monthXAxis!}
                    series={monthSeries!}
                    height={400}
                    onItemClick={onMonthClick}
                    onAxisClick={onMonthClick} />
            </Box>
        ))}
        {loadingDay && <><p ref={dayProgressRef}><CircularProgress />{" Loading daily stats..."}</p></>}
        {!loadingDay && queryResultDay !== null && (!queryResultDay.hasResult ? (
            <Box>
                <br />
                <InlinePre>{queryResultDay.error}</InlinePre>
            </Box>
        ) : queryResultDay.result.code !== 200 ? (
            <Box>
                <br />
                <div>
                    <InlinePre>Error: {queryStatusString[queryResultDay.result.status]}</InlinePre>
                </div>
                {queryResultDay.result.data && (
                    <details>
                        <ClickableSummary>Raw Data</ClickableSummary>
                        <BlockPre>{queryResultDay.result.data}</BlockPre>
                    </details>
                )}
            </Box>
        ) : (
            <Box ref={dayRef}>
                <br />
                <Typography variant="h6" component="p">
                    <b>Data Update Time:</b> <InlinePre>{new Date(queryResultDay.result.updateTime * 1000).toISOString()}</InlinePre>
                </Typography>
                <Typography variant="h6" component="p">
                    <b>Daily stats for {year}-{month! + 1}:</b>
                </Typography>
                <Typography variant="h6" component="p">
                    Click a day to show domains
                </Typography>
                <BarChart
                    xAxis={dayXAxis!}
                    series={daySeries!}
                    height={400}
                    onItemClick={onDayClick}
                    onAxisClick={onDayClick} />
            </Box>
        ))}
        {loadingDomain && <><p ref={domainProgressRef}><CircularProgress />{" Loading domains..."}</p></>}
        {!loadingDomain && queryResultDomain !== null && (!queryResultDomain.hasResult ? (
            <Box>
                <br />
                <InlinePre>{queryResultDomain.error}</InlinePre>
            </Box>
        ) : queryResultDomain.result.code !== 200 ? (
            <Box>
                <br />
                <div>
                    <InlinePre>Error: {queryStatusString[queryResultDomain.result.status]}</InlinePre>
                </div>
                {queryResultDomain.result.data && (
                    <details>
                        <ClickableSummary>Raw Data</ClickableSummary>
                        <BlockPre>{queryResultDomain.result.data}</BlockPre>
                    </details>
                )}
            </Box>
        ) : (
            <Box ref={dayRef}>
                <br />
                <Typography variant="h6" component="p">
                    <b>Domains for {year}-{month! + 1}-{day}:</b>
                </Typography>
                <Typography variant="h6" component="p">
                    <b>Data Update Time:</b> <InlinePre>{new Date(queryResultDomain.result.updateTime * 1000).toISOString()}</InlinePre>
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Domain</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Time</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.keys(queryResultDomain.result.data).sort((a, b) => Math.abs(a as any) - Math.abs(b as any)).map((time: any) => {
                                if (time === "^updateTime") return undefined;
                                time = parseInt(time);
                                const data = queryResultDomain.result.data[time];
                                if (typeof data === "string") {
                                    return (<TableRow key={time}>
                                        <TableCell>{queryResultDomain.result.data[time]}.js.org</TableCell>
                                        <TableCell>{time < 0 ? "Remove" : "Register"}</TableCell>
                                        <TableCell>{new Date(Math.abs(time) * 1000).toISOString()}</TableCell>
                                    </TableRow>);
                                } else {
                                    const timeStr = new Date(Math.abs(time) * 1000).toISOString();
                                    return data.map(domain => (<TableRow key={domain}>
                                        <TableCell>{domain}.js.org</TableCell>
                                        <TableCell>{time < 0 ? "Remove" : "Register"}</TableCell>
                                        <TableCell>{timeStr}</TableCell>
                                    </TableRow>));
                                }
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        ))}
    </div>
});

const Footer = memo(() => {
    return <div>
        <br />
        <p>The data provided may not be fully accurate or up-to-date.</p>
        <Divider />
        {"Source Code: "}
        <Link target="_blank" href="https://github.com/lll69/js-org-stats-generate">js-org-stats-generate</Link>
        {" | "}
        <Link target="_blank" href="https://github.com/lll69/lookup-js-org">lookup-js-org</Link>
    </div>
});

const IndexApp = memo(({ P }: { P?: boolean }) => {
    return <Container>
        <Box sx={boxSx}>
            <p>
                Query the registration time, registrant username, modification records, and other relevant information of JS.ORG subdomains.
                View statistical information of JS.ORG subdomains.
            </p>
            <QueryPart P={P} />
            <MarginDiv />
            <StatPart />
            <Footer />
        </Box>
    </Container>
});

export default function IndexPage({ P }: { P?: boolean }) {
    const darkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = useMemo(() => createTheme({
        palette: {
            mode: (darkMode || P) ? "dark" : "light"
        }
    }), [darkMode]);
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <HideOnScroll>
                <AppBar>
                    <Toolbar>
                        <Typography variant="h6" component="h1">
                            JS.ORG Subdomain Lookup & Stats
                        </Typography>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <Toolbar />
            <IndexApp P={P} />
        </ThemeProvider>
    );
}
