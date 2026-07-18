export default function StorefrontLoading() {
  return (
    <main className="page-section">
      <div className="loading-shell">
        <div className="loading-block loading-kicker" />
        <div className="loading-block loading-title" />
        <div className="loading-block loading-copy" />
      </div>

      <div className="loading-grid loading-grid-products" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <article key={index} className="loading-card">
            <div className="loading-block loading-media" />
            <div className="loading-card-body">
              <div className="loading-block loading-line-short" />
              <div className="loading-block loading-line-medium" />
              <div className="loading-block loading-line-shorter" />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
