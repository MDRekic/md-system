// frontend/src/components/layout/MainLayout.jsx

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">MD System</div>

        {user && (
          <nav className="app-nav">
            <Link
              to="/calendar"
              className={`nav-link ${isActive("/calendar") ? "active" : ""}`}
            >
              Kalendar
            </Link>

            {(user.role === "ADMIN" || user.role === "SEMI_ADMIN") && (
              <>
                <Link
                  to="/jobs/new"
                  className={`nav-link ${
                    isActive("/jobs/new") ? "active" : ""
                  }`}
                >
                  Novi nalog
                </Link>

                <Link
                  to="/admin/review"
                  className={`nav-link ${
                    isActive("/admin/review") ? "active" : ""
                  }`}
                >
                  Pregled naloga
                </Link>

                <Link
                  to="/admin/companies/new"
                  className={`nav-link ${
                    isActive("/admin/companies") ? "active" : ""
                  }`}
                >
                  Nove firme
                </Link>

                <Link
                  to="/admin/technicians/new"
                  className={`nav-link ${
                    isActive("/admin/technicians") ? "active" : ""
                  }`}
                >
                  Novi tehničar
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="app-header-right">
          {user && (
            <span className="app-user">
              {user.name}{" "}
              <span className="app-user-role">({user.role})</span>
            </span>
          )}
          {user && (
            <button className="btn btn-outline" onClick={handleLogout}>
              Odjava
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
