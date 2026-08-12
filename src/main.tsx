import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import InstallAppPrompt from "./InstallAppPrompt";
import "./mobile.css";

const router = getRouter();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Learner's Guide: #root element was not found.");
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    }).catch((error) => {
      console.warn("Learner's Guide: service worker registration failed", error);
    });
  });
}

// Downloads must stay on the current app route. Some browsers otherwise honor
// target="_blank" on data/blob download links and open a new document/tab,
// which makes returning from a material download look like a navigation to
// the Student home screen. Normalize all in-app download links before the
// browser performs the default action.
window.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest("a[download]");
  if (link instanceof HTMLAnchorElement) link.target = "_self";
}, true);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <InstallAppPrompt />
  </React.StrictMode>,
);
