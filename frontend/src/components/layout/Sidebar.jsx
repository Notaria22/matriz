import { Link, useLocation } from "react-router";
import {
  Home,
  FileText,
  Users,
  UserCircle,
  History,
  FileEdit,
  LogOut,
  Link2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Inicio",
      path: "/",
      icon: Home,
      roles: ["admin", "notaria", "lexdata"],
    },
    {
      name: "Comparecientes",
      path: "/comparecientes",
      icon: UserCircle,
      roles: ["admin", "notaria", "lexdata"],
    },
    {
      name: "Generar Matriz",
      path: "/matrices",
      icon: FileText,
      roles: ["admin", "notaria", "lexdata"],
    },
    {
      name: "Generar Minuta",
      path: "/minutas",
      icon: FileEdit,
      roles: ["admin", "lexdata"],
    },
    {
      name: "Historial",
      path: "/historial",
      icon: History,
      roles: ["admin", "notaria", "lexdata"],
    },
    {
      name: "Registro de Clientes",
      path: "/registro",
      icon: Link2,
      roles: ["admin", "notaria", "lexdata"],
    },
    {
      name: "Gestión de Usuarios",
      path: "/usuarios",
      icon: Users,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.rol),
  );

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col fixed left-0 top-0">
      {/* Logo / Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">MáTriz</h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.nombre}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      active
                        ? "bg-primary-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
                     text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
