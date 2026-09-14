import { Component, type ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main>
        <section className="panel">
          <h1>BookOnTime needs a refresh</h1>
          <p>Your saved data has not been removed. Reload to retry.</p>
          <button onClick={() => location.reload()}>Reload BookOnTime</button>
        </section>
      </main>
    ) : (
      this.props.children
    );
  }
}
