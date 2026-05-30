import { LoadingButton } from "@mui/lab";
import { AppBar, Box, Button, Card, Container, createTheme, CssBaseline, FormControl, InputAdornment, OutlinedInput, Slide, TextField, ThemeProvider, Toolbar, Typography, useMediaQuery, useScrollTrigger } from "@mui/material";
import { FormEvent, memo, useCallback, useMemo, useRef, useState } from "react";

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
};

const QueryPart = memo(() => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [queryResult, setQueryResult] = useState("");
    const domainInputRef = useRef<HTMLInputElement>(null);
    const validateInput = useCallback((e: FormEvent) => {
        const isError = domainPattern.test(domainInputRef.current!.value);
        setError(!isError);
    }, []);
    const submitQuery = useCallback(() => {
        if (!validateInput) {
            domainInputRef.current!.focus();
            return;
        }
        setLoading(true);
        const domain = domainInputRef.current!.value;
        async function asyncFetch() {
            try {
                const response = await fetch("/api/domain/" + domain, { method: "POST" });
                if (!response.ok) {
                    throw Error("status = " + response.status);
                }
                const text = await response.text();
                setLoading(false);
                setQueryResult(text);
            } catch (e) {
                setLoading(false);
                setQueryResult(String(e));
            }
        }
        asyncFetch();
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
                onInput={validateInput} />
            &nbsp;
            <LoadingButton
                variant="contained"
                disabled={error}
                loading={loading}
                onClick={submitQuery}>
                Lookup
            </LoadingButton>
        </Box>
        <Box style={queryStyle}>
            <pre>{queryResult}</pre>
        </Box>
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
