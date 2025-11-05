import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from "@mui/material";

type Mode = "light" | "dark";
type Ctx = { mode: Mode; toggle: () => void; setMode: (m: Mode) => void };

const ThemeCtx = createContext<Ctx | null>(null);

// Lee modo inicial (localStorage -> clave legacy -> prefers-color-scheme)
function getInitialMode(): Mode {
  try {
    const saved = localStorage.getItem("tdah_theme");
    if (saved === "light" || saved === "dark") return saved;
    const legacy = localStorage.getItem("tdah_dark"); // true/false usado antes
    if (legacy !== null) return legacy === "true" ? "dark" : "light";
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(getInitialMode);

  // Aplica clase .dark, guarda en storage y ajusta theme-color de la barra
  useEffect(() => {
    const root = document.documentElement;
    const isDark = mode === "dark";
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = mode;
    try {
      localStorage.setItem("tdah_theme", mode);
    } catch {}
    // color de la barra del navegador móvil
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (meta) meta.content = isDark ? "#0b1220" : "#ffffff";
  }, [mode]);

  // Sincroniza entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "tdah_theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setMode(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const ctx: Ctx = useMemo(() => ({ mode, toggle, setMode }), [mode]);

  // Tema MUI acorde al modo
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? { background: { default: "rgb(2 6 23)", paper: "rgb(2 6 23)" } }
            : {}),
        },
        components: {
          MuiDialog: {
            styleOverrides: {
              paper: { borderRadius: 12 },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeCtx.Provider value={ctx}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeCtx.Provider>
  );
}

export function useThemeMode() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useThemeMode debe usarse dentro de <AppThemeProvider>");
  return v;
}
