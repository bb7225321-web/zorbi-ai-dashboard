import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { PosApp } from "./pos/App";
import "./index.css";

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown runtime error", stack: error.stack || "" };
  }
  componentDidCatch(err: Error) {
    console.error("[preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 break-words text-xs text-slate-500">{this.state.message}</p>
            {this.state.stack && (
              <pre className="mt-3 max-h-40 overflow-auto rounded border border-slate-200 p-2 text-left text-[10px] leading-4 text-slate-500">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** If the platform toolbar crashes it renders nothing instead of the whole app. */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <PosApp />
    </RootErrorBoundary>
  </StrictMode>,
);
