import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import InstallAppPrompt from "./InstallAppPrompt";
import StartupSplashFast from "./StartupSplashFast";
import DatabaseActivityOverlay, { emitDatabaseActivity } from "./DatabaseActivityOverlay";
import MobileBackNavigation from "./MobileBackNavigation";
import "./mobile.css";

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isSupabase = rawUrl.includes("supabase.co");
  if (!isSupabase) return originalFetch(input, init);

  const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();
  const path = rawUrl.toLowerCase();
  const isUpload = path.includes("/storage/") && ["POST", "PUT", "PATCH"].includes(method);
  const isSave = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const label = path.includes("/storage/") ? (isUpload ? "Uploading…" : method === "DELETE" ? "Removing…" : "Loading file…") : path.includes("/auth/") ? "Checking account…" : isSave ? "Saving changes…" : "Loading data…";
  const kind = isUpload ? "upload" : isSave ? "save" : path.includes("/auth/") ? "sync" : "load";

  emitDatabaseActivity(true, label, kind);
  try {
    return await originalFetch(input, init);
  } finally {
    emitDatabaseActivity(false, label, kind);
  }
};

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

window.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest("a[download]");
  if (link instanceof HTMLAnchorElement) link.target = "_self";
}, true);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <StartupSplashFast />
    <RouterProvider router={router} />
    <InstallAppPrompt />
    <DatabaseActivityOverlay />
    <MobileBackNavigation />
  </React.StrictMode>,
);
