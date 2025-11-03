// src/main.tsx o src/index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./app/AppRoutes";
import "./index.css";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// (opcional) español
import "dayjs/locale/es";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <AppRoutes />
    </LocalizationProvider>
  </StrictMode>
);
