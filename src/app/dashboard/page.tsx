import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <h2 className="h4 mb-4">Dashboard</h2>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card text-bg-primary">
            <div className="card-body">
              <h5 className="card-title">Clientes</h5>
              <p className="card-text display-6">0</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-bg-success">
            <div className="card-body">
              <h5 className="card-title">Citas</h5>
              <p className="card-text display-6">0</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-bg-warning">
            <div className="card-body">
              <h5 className="card-title">Ingresos</h5>
              <p className="card-text display-6">$0</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="card">
          <div className="card-header">Bienvenido</div>
          <div className="card-body">
            <p className="card-text">
              Has iniciado sesión como <strong>{user.email}</strong>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
