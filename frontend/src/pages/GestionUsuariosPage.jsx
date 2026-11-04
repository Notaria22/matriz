import { useState, useEffect, useCallback } from "react";
import { Card, Button, FormField, Modal } from "../components/shared";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../config/api";
import API_CONFIG from "../config/api";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

const GestionUsuariosPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    username: "",
    password: "",
    rol: "notaria",
    iniciales: "",
    cargoNotarial: "",
    genero: "",
    activo: true,
  });
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch(API_CONFIG.ENDPOINTS.SYSTEM_USERS);

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        username: user.username,
        password: "",
        rol: user.rol,
        iniciales: user.iniciales || "",
        cargoNotarial: user.cargo_notarial || "",
        genero: user.genero || "",
        activo: user.activo,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: "",
        username: "",
        password: "",
        rol: "notaria",
        iniciales: "",
        cargoNotarial: "",
        genero: "",
        activo: true,
      });
    }
    setErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nombre: "",
      username: "",
      password: "",
      rol: "notaria",
      iniciales: "",
      cargoNotarial: "",
      genero: "",
      activo: true,
    });
    setErrors({});
    setShowPassword(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.username.trim()) {
      newErrors.username = "El usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username = "El usuario debe tener al menos 3 caracteres";
    }

    if (!editingUser && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    if (formData.cargoNotarial && !formData.genero) {
      newErrors.genero = "Indique el género del notario";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        username: formData.username.trim().toLowerCase(),
        rol: formData.rol,
        iniciales: formData.iniciales.trim() || null,
        // "" quita el cargo notarial al editar
        cargo_notarial: formData.cargoNotarial || (editingUser ? "" : null),
        genero: formData.cargoNotarial
          ? formData.genero
          : editingUser
            ? ""
            : null,
      };

      if (editingUser) {
        dataToSend.activo = formData.activo;
        if (formData.password) {
          dataToSend.password = formData.password;
        }
      } else {
        dataToSend.password = formData.password;
      }

      const url = editingUser
        ? `${API_CONFIG.ENDPOINTS.SYSTEM_USERS}/${editingUser.id}`
        : API_CONFIG.ENDPOINTS.SYSTEM_USERS;

      const response = await apiFetch(url, {
        method: editingUser ? "PUT" : "POST",
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          data.message ||
            (editingUser ? "Usuario actualizado" : "Usuario creado"),
        );
        handleCloseModal();
        fetchUsers();
      } else {
        toast.error(data.detail || data.message || "Error al guardar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar usuario");
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"?`)) {
      return;
    }

    try {
      const response = await apiFetch(
        `${API_CONFIG.ENDPOINTS.SYSTEM_USERS}/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Usuario eliminado exitosamente");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || data.message || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const getRoleBadge = (rol) => {
    const styles = {
      admin: "bg-red-100 text-red-800",
      lexdata: "bg-purple-100 text-purple-800",
      notaria: "bg-blue-100 text-blue-800",
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[rol]}`}>
        {rol.charAt(0).toUpperCase() + rol.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenModal()}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.rol)}
                      {user.cargo_notarial && (
                        <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          {user.cargo_notarial === "titular"
                            ? user.genero === "femenino"
                              ? "Notaria titular"
                              : "Notario titular"
                            : user.genero === "femenino"
                              ? "Notaria suplente"
                              : "Notario suplente"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.nombre)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre Completo" required error={errors.nombre}>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="input-field"
              placeholder="Ej: Juan Pérez"
            />
          </FormField>

          <FormField
            label="Usuario"
            required
            error={errors.username}
            hint={
              editingUser
                ? "No se puede cambiar el usuario"
                : "Minimo 3 caracteres"
            }
          >
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="input-field"
              placeholder="Ej: jperez"
              disabled={!!editingUser}
            />
          </FormField>

          <FormField
            label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
            required={!editingUser}
            error={errors.password}
            hint="Mínimo 6 caracteres"
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-field pr-10"
                placeholder={
                  editingUser ? "Dejar vacío para no cambiar" : "••••••"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </FormField>

          <FormField label="Rol" required>
            <select
              value={formData.rol}
              onChange={(e) =>
                setFormData({ ...formData, rol: e.target.value })
              }
              className="input-field"
            >
              <option value="notaria">Notaría</option>
              <option value="lexdata">Lexdata</option>
              <option value="admin">Administrador</option>
            </select>
          </FormField>

          <FormField
            label="Iniciales"
            hint="Ej: M.V.S, A.C, E.D.H (para matrizador)"
          >
            <input
              type="text"
              value={formData.iniciales}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  iniciales: e.target.value.toUpperCase(),
                })
              }
              className="input-field uppercase"
              placeholder="Ej: M.V.S"
              maxLength="10"
            />
          </FormField>

          <FormField
            label="Cargo notarial"
            hint="Solo para el notario titular y el suplente: aparecen como opción de notario al generar matrices y poderes."
          >
            <select
              value={formData.cargoNotarial}
              onChange={(e) =>
                setFormData({ ...formData, cargoNotarial: e.target.value })
              }
              className="input-field"
            >
              <option value="">No es notario</option>
              <option value="titular">Notario titular</option>
              <option value="suplente">Notario suplente</option>
            </select>
          </FormField>

          {formData.cargoNotarial && (
            <FormField
              label="Género"
              required
              error={errors.genero}
              hint="Para los tratamientos en la escritura (Notario / Notaria)."
            >
              <select
                value={formData.genero}
                onChange={(e) =>
                  setFormData({ ...formData, genero: e.target.value })
                }
                className="input-field"
              >
                <option value="">Seleccione</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </FormField>
          )}

          {editingUser && (
            <FormField label="Estado">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Usuario activo</span>
              </label>
            </FormField>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? "Actualizar" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GestionUsuariosPage;
