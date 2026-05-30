import { LoadingButton } from "@mui/lab";
import { AppBar, Box, Button, Card, Container, createTheme, CssBaseline, FormControl, InputAdornment, OutlinedInput, Slide, TextField, ThemeProvider, Toolbar, Typography, useMediaQuery, useScrollTrigger } from "@mui/material";
import { CSSProperties, FormEvent, KeyboardEvent, memo, useCallback, useMemo, useRef, useState } from "react";

type HistoryItem = {
    time: number,
    type: "cname" | "ns" | "remove",
    server: string | null,
    comment: string | null,
    commit: string,
    pull: number | null,
}
type QueryResultSuccess = {
    success: true,
    result: {
        updateTime: number,
        name: string,
        history: HistoryItem[],
    },
}
type QueryResultError = {
    success: false,
    error: string,
}
type QueryResult = QueryResultSuccess | QueryResultError;

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

const queryStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const domainPattern = /^(?:[a-z0-9_\-\.]+)$/;

const inputProps = {
    pattern: "^(?:[a-z0-9_\\-\\.]+)$",
    maxLength: 60,
};

const preStyle: CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
};

const QueryPart = memo(() => {
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
            try {
                const response = await fetch("/api/domain/" + domain, { method: "GET" });
                if (!response.ok) {
                    throw Error("status = " + response.status);
                }
                const text = await response.text();
                setLoading(false);
                setQueryResult({ success: true, result: JSON.parse(text) });
            } catch (e) {
                setLoading(false);
                setQueryResult({ success: false, error: String(e) });
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
        <Box style={queryStyle}>
            <TextField
                error={error}
                disabled={loading}
                id="domain"
                label="Domain"
                variant="filled"
                InputProps={{
                    endAdornment: <InputAdornment position="end">.js.org</InputAdornment>
                }}
                defaultValue="lookup"
                inputRef={domainInputRef}
                inputProps={inputProps}
                onInput={validateInput}
                onKeyDown={onKeyDown} />
            &nbsp;
            <LoadingButton
                variant="contained"
                disabled={error}
                loading={loading}
                onClick={submitQuery}>
                Lookup
            </LoadingButton>
        </Box>
        {queryResult !== null && (!queryResult.success ? (
            <Box style={queryStyle}>
                <pre style={preStyle}>{queryResult.error}</pre>
            </Box>
        ) : (
            <Box>
                <Typography variant="h2" component="p">
                    <b>Updated Time:</b>&nbsp;<pre style={preStyle}>{new Date(queryResult.result.updateTime * 1000).toLocaleString()}</pre>
                </Typography>
                <pre style={preStyle}>{JSON.stringify(queryResult.result, null, 2)}</pre>
            </Box>
        ))}
    </div>
});

const IndexApp = memo(() => {
    return <Container>
        <Box sx={boxSx}>
            <p>
                Query the registration time, registrant username, modification records, and other relevant information of JS.ORG subdomains.
                View statistical information of JS.ORG subdomains.
            </p>
            <QueryPart />
        </Box>
    </Container>
});

export default function IndexPage() {
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
            <IndexApp />
        </ThemeProvider>
    );
}
