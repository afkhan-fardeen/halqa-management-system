import { createTheme } from "@mui/material/styles";

const teal = {
  main: "#008080",
  light: "#66b2b2",
  dark: "#004c4c",
  contrastText: "#ffffff",
};

const heading =
  'var(--font-member-heading), "Poppins", system-ui, sans-serif';
const body = 'var(--font-member-body), "DM Sans", system-ui, sans-serif';

export function createMemberTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: teal,
      background:
        mode === "light"
          ? { default: "#FAFAF9", paper: "#FFFFFF" }
          : { default: "#111110", paper: "#242320" },
      divider: mode === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
      text:
        mode === "light"
          ? { primary: "#1C1917", secondary: "#57534E", disabled: "#A8A29E" }
          : { primary: "#FAFAF9", secondary: "#A8A29E", disabled: "#78716C" },
    },
    typography: {
      fontFamily: body,
      h1: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "2rem",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "1.75rem",
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
      },
      h3: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "1.5rem",
        lineHeight: 1.3,
        letterSpacing: "-0.015em",
      },
      h4: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "1.3125rem",
        lineHeight: 1.35,
      },
      h5: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "1.125rem",
        lineHeight: 1.4,
      },
      h6: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "1rem",
        lineHeight: 1.45,
      },
      subtitle1: {
        fontFamily: heading,
        fontWeight: 500,
        fontSize: "1rem",
        lineHeight: 1.5,
      },
      subtitle2: {
        fontFamily: heading,
        fontWeight: 500,
        fontSize: "0.9375rem",
        lineHeight: 1.5,
      },
      body1: {
        fontSize: "1.0625rem",
        lineHeight: 1.65,
      },
      body2: {
        fontSize: "0.9375rem",
        lineHeight: 1.6,
      },
      button: {
        fontFamily: heading,
        fontWeight: 600,
        fontSize: "0.9375rem",
        textTransform: "none" as const,
      },
      caption: {
        fontSize: "0.8125rem",
        lineHeight: 1.45,
      },
      overline: {
        fontFamily: heading,
        fontSize: "0.6875rem",
        letterSpacing: "0.12em",
        fontWeight: 600,
      },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 16 },
        },
      },
    },
  });
}
