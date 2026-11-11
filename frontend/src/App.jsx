import { Routes, Route, Navigate } from "react-router";
import { ToastContainer } from "./components/shared";
import { MainLayout, ProtectedRoute } from "./components/layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import GestionUsuariosPage from "./pages/GestionUsuariosPage";
import ComparecientesPage from "./pages/ComparecientesPage";
import ImprimirDeclaracionPage from "./pages/ImprimirDeclaracionPage";
import { useAuth } from "./context/AuthContext";
import TestInlinePage from "./pages/TestInlinePage";
import MatricesIndexPage from "./pages/matrices/MatricesIndexPage";
import FormularioMatrizCompraventa from "./pages/matrices/compraventa/FormularioCompraventa";
import FormularioMatrizPromesa from "./pages/matrices/promesa/FormularioPromesa";
import FormularioMatrizCesion from "./pages/matrices/cesion/FormularioCesion";
import FormularioMatrizDonacion from "./pages/matrices/donacion/FormularioDonacion";
import MinutasIndexPage from "./pages/minutas/MinutasIndexPage";
import FormularioCompraventa from "./pages/minutas/compraventa/FormularioCompraventa";
import FormularioPromesa from "./pages/minutas/promesa/FormularioPromesa";
import SeleccionTipoPoderPage from "./pages/minutas/poder/SeleccionTipoPoderPage";
import FormularioPoder from "./pages/minutas/poder/FormularioPoder";
import RegistroClientePage from "./pages/registro/RegistroClientePage";
import GestionTokensPage from "./pages/registro/GestionTokensPage";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout>
                <GestionUsuariosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/comparecientes"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ComparecientesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Declaración para imprimir y firmar (sin menú) */}
        <Route
          path="/comparecientes/imprimir/:tipo/:documento"
          element={
            <ProtectedRoute>
              <ImprimirDeclaracionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-inline"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TestInlinePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Registro público de clientes — sin login */}
        <Route path="/registro/:token" element={<RegistroClientePage />} />

        {/* Gestión de tokens — requiere login */}
        <Route
          path="/registro"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GestionTokensPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/matrices"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MatricesIndexPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrices/compraventa"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FormularioMatrizCompraventa />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrices/promesa"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FormularioMatrizPromesa />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrices/cesion"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FormularioMatrizCesion />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrices/donacion"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FormularioMatrizDonacion />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutas/poder"
          element={
            <ProtectedRoute allowedRoles={["admin", "lexdata"]}>
              <MainLayout>
                <SeleccionTipoPoderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutas/poder/:tipoPoderId"
          element={
            <ProtectedRoute allowedRoles={["admin", "lexdata"]}>
              <MainLayout>
                <FormularioPoder />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutas"
          element={
            <ProtectedRoute allowedRoles={["admin", "lexdata"]}>
              <MainLayout>
                <MinutasIndexPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutas/compraventa"
          element={
            <ProtectedRoute allowedRoles={["admin", "lexdata"]}>
              <MainLayout>
                <FormularioCompraventa />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutas/promesa"
          element={
            <ProtectedRoute allowedRoles={["admin", "lexdata"]}>
              <MainLayout>
                <FormularioPromesa />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
