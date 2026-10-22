import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { ReviewerApp } from "./ReviewerApp.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReviewerApp />
  </StrictMode>,
);
