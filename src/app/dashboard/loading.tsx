export default function DashboardLoading() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "calc(100vh - 3rem)" }}>
      <div className="spinner-border text-dark" style={{ width: "3rem", height: "3rem" }} role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}
