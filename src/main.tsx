import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./app/Approutes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><AppRoutes /></StrictMode>
);
