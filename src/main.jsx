import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { PromptProvider } from "./Context/Context.jsx";

createRoot(document.getElementById("root")).render(
  <PromptProvider>
    <App />
  </PromptProvider>
);
