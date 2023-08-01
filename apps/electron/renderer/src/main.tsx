import * as Sentry from "@sentry/electron/renderer";
import { init as reactInit } from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

Sentry.init(
  {
    dsn: "https://178a415c4ef2421a8f52b6c4041319af@o4505321607397376.ingest.sentry.io/4505321612705792",
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  reactInit,
);

const rootEl = document.getElementById("root");

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
