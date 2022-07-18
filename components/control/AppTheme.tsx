import { CssBaseline, useMediaQuery } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect } from "react";
import { DarkModeContext } from "../DarkModeContext";

export default function AppTheme(props: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = React.useState(prefersDarkMode);

  useEffect(() => {
    setDarkMode(prefersDarkMode);
    if (prefersDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.toggle("dark");
    }
  }, [prefersDarkMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(","),
        },
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: "#448AFF",
            dark: "#366FCC",
            light: "#52A7FF",
          },
          messageIncoming: darkMode
            ? {
                main: "#3b3b3d",
                contrastText: "#dedede",
                border: "#565556",
              }
            : {
                main: "#e9e9eb",
                contrastText: "#363637",
                border: "#bebdbe",
              },
          messageOutgoing: {
            main: "#3c83f7",
            contrastText: "#FFF",
          },
          messageOutgoingTextMessage: {
            main: "#2ECC71",
            contrastText: "#FFF",
          },
          divider: darkMode ? "rgba(255, 255, 255, 0.1)" : "#EEEEEE",
          background: {
            default: darkMode ? "#1E1E1E" : "#FFFFFF",
            sidebar: darkMode ? "#272727" : "#e8e7e7",
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              "@global": {
                html: {
                  scrollbarColor: darkMode ? "#303030 #424242" : undefined,
                },
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {props.children}
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
}

declare module "@mui/material/styles/createPalette" {
  interface Palette {
    messageIncoming: Palette["primary"];
    messageOutgoing: Palette["primary"];
    messageOutgoingTextMessage: Palette["primary"];
  }

  interface PaletteOptions {
    messageIncoming: PaletteOptions["primary"];
    messageOutgoing: PaletteOptions["primary"];
    messageOutgoingTextMessage: PaletteOptions["primary"];
  }

  interface TypeBackground {
    sidebar: string;
  }
}
