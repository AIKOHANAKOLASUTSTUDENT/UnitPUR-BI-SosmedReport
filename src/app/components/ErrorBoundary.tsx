import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Ensure the error is visible in production logs too.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Crash:", error);
  }

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message || "Something went wrong.";
    const stack = this.state.error.stack;

    return (
      <div
        style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 12 }}>Something went wrong.</h2>
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>{message}</div>
        {stack ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#0b1220",
              color: "#e5e7eb",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {stack}
          </pre>
        ) : null}
        <div style={{ marginTop: 12, color: "#64748b" }}>
          See console for details.
        </div>
      </div>
    );
  }
}
