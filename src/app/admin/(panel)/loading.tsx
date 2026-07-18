export default function AdminLoading() {
  return (
    <>
      <div className="admin-header">
        <div className="loading-block loading-admin-title" />
        <div className="loading-block loading-admin-pill" />
      </div>

      <div className="loading-admin-grid" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <section key={index} className="loading-admin-card">
            <div className="loading-block loading-line-short" />
            <div className="loading-block loading-admin-stat" />
            <div className="loading-block loading-line-medium" />
          </section>
        ))}
      </div>

      <div className="loading-admin-panel" aria-hidden="true">
        <div className="loading-block loading-line-medium" />
        <div className="loading-block loading-line-long" />
        <div className="loading-block loading-line-long" />
        <div className="loading-block loading-line-medium" />
      </div>
    </>
  );
}
