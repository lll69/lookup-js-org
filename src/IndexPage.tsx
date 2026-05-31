import styled from "@emotion/styled";
import { LoadingButton } from "@mui/lab";
import { AppBar, Box, Card, Chip, Container, createTheme, CssBaseline, InputAdornment, Link, Slide, TextField, ThemeProvider, Toolbar, Tooltip, Typography, useMediaQuery, useScrollTrigger } from "@mui/material";
import { KeyboardEvent, memo, useCallback, useMemo, useRef, useState } from "react";

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

const queryStatusString = {
    [QueryStatus.SUCCESS]: "Success",
    [QueryStatus.INVALID_INPUT]: "Invalid Domain",
    [QueryStatus.UPSTREAM_ERROR]: "Server Error",
    [QueryStatus.DOMAIN_NOT_FOUND]: "Domain Not Found",
    [QueryStatus.SERVER_ERROR]: "Internal Server Error",
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
});

const BlockPre = styled.pre({
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "inline-block",
    textAlign: "left",
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
                response = await fetch("/api/domain/" + domain, { method: "GET" });
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
            &nbsp;
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
                        <b>Data Updated Time:</b> <InlinePre>{new Date(queryResult.result.updateTime * 1000).toLocaleString()}</InlinePre>
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
                    <b>Data Updated Time:</b> <InlinePre>{new Date(queryResult.result.updateTime * 1000).toLocaleString()}</InlinePre>
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
                                    <b>User:</b> <Link href={"https://github.com/" + (queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull].username}><InlinePre>{(queryResult as QueryResultSuccess).result.pullInfo[historyItem.pull].username}</InlinePre></Link>
                                </Typography>
                            )}
                            <Typography variant="body2" component="div">
                                <b>Pull Request:</b> <Link href={"https://github.com/js-org/js.org/pull/" + historyItem.pull}><InlinePre>#{historyItem.pull}</InlinePre></Link>
                            </Typography>
                        </>}
                        <Typography variant="body2" component="div">
                            <b>Git Commit:</b> <Link href={"https://github.com/js-org/js.org/commit/" + historyItem.commit}><InlinePre>{historyItem.commit.substring(0, 7)}</InlinePre></Link>
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

const IndexApp = memo(({ P }: { P?: boolean }) => {
    return <Container>
        <Box sx={boxSx}>
            <p>
                Query the registration time, registrant username, modification records, and other relevant information of JS.ORG subdomains.
                View statistical information of JS.ORG subdomains.
            </p>
            <QueryPart P={P} />
        </Box>
    </Container>
});

export default function IndexPage({ P }: { P?: boolean }) {
    const darkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? "dark" : "light"
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
