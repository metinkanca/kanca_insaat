// Quiet full-area spinner shown while a page's Firestore data loads.
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Yükleniyor">
      <div className="page-loader-spinner" />
    </div>
  );
}
