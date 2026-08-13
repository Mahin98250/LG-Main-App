import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; section?: string };
type State = { hasError: boolean; error: Error | null; retryKey: number };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryKey: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin section failed", { section: this.props.section, error, info });
  }

  retry = () => {
    this.setState((s) => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }));
  };

  render() {
    if (!this.state.hasError) {
      return <div key={this.state.retryKey}>{this.props.children}</div>;
    }

    const message = this.state.error?.message || "Unknown error";
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, background: "#F0F4FF" }}>
        <div style={{ width: "min(620px, 100%)", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 20, padding: 28, boxShadow: "0 10px 35px rgba(15,27,61,.10)" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <h2 style={{ margin: "0 0 8px", color: "#0F1B3D", fontSize: 20 }}>This Admin section could not load</h2>
          <p style={{ margin: "0 0 14px", color: "#64748B", lineHeight: 1.6 }}>
            Your data has not been deleted. This section hit a temporary application error. Try loading it again.
          </p>
          <div style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, marginBottom: 18, color: "#64748B", fontSize: 12, wordBreak: "break-word" }}>
            {message}
          </div>
          <button type="button" onClick={this.retry} style={{ border: 0, borderRadius: 11, padding: "10px 16px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            ↻ Try again
          </button>
        </div>
      </div>
    );
  }
}
