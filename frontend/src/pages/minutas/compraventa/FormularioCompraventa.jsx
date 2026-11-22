import { useState } from "react";
import {
  BuscadorPlantillas,
  ModalGuardarPlantilla,
  useBorradorDeUrl,
} from "../../../components/plantillas";
import { Button, Card, RichTextEditor } from "../../../components/shared";
import { ComparecienteInline } from "../../../components/comparecientes";
import { SeccionFormularioRedactar } from "../../../components/minutas";
import { useToast } from "../../../hooks/useToast";
import { apiFetch } from "../../../config/api";
import API_CONFIG from "../../../config/api";
import { descargarRespuesta } from "../../../utils/descargas";

const AclaratoriaHistoriaItem = ({
  aclaratoria,
  path,
  nivel = 0,
  onChange,
  onEliminar,
  onAgregar,
  rootAclaratorias,
}) => (
  <div
    className={`border-l-2 border-primary-300 pl-4 ${nivel > 0 ? "mt-4" : ""}`}
  >
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="font-medium text-gray-900">
          Aclaratoria {path.map((i) => i + 1).join(".")}
        </h5>
        <button
          onClick={() => onEliminar(path)}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Eliminar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título de adquisición
          </label>
          <select
            value={aclaratoria.titulo}
            onChange={(e) => onChange(path, "titulo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar</option>
            <option value="compraventa">Compraventa</option>
            <option value="donacion">Donación</option>
            <option value="permuta">Permuta</option>
            <option value="adjudicacion">Adjudicación</option>
            <option value="sucesion">Sucesión</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {aclaratoria.titulo === "otro" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especificar título
            </label>
            <input
              type="text"
              value={aclaratoria.tituloOtro}
              onChange={(e) => onChange(path, "tituloOtro", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adquirido de
          </label>
          <input
            type="text"
            value={aclaratoria.adquiridoDe}
            onChange={(e) =>
              onChange(path, "adquiridoDe", e.target.value.toUpperCase())
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de otorgamiento
          </label>
          <input
            type="date"
            value={aclaratoria.fechaOtorgamiento}
            onChange={(e) =>
              onChange(path, "fechaOtorgamiento", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de notaría
          </label>
          <input
            type="text"
            value={aclaratoria.numeroNotaria}
            onChange={(e) => onChange(path, "numeroNotaria", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: primera, 14, 22"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se convertirá automáticamente
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantón de la notaría
          </label>
          <input
            type="text"
            value={aclaratoria.cantonNotaria}
            onChange={(e) => onChange(path, "cantonNotaria", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notario
          </label>
          <input
            type="text"
            value={aclaratoria.notario}
            onChange={(e) => onChange(path, "notario", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: Alex David Mejía Viteri"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puede incluir "Doctor/a", se quita automáticamente.
          </p>
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aclaratoria.esSuplente || false}
              onChange={(e) => onChange(path, "esSuplente", e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">
              El notario es suplente
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inscripción
          </label>
          <input
            type="date"
            value={aclaratoria.fechaInscripcion}
            onChange={(e) => onChange(path, "fechaInscripcion", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantón de inscripción
          </label>
          <input
            type="text"
            value={aclaratoria.cantonInscripcion}
            onChange={(e) =>
              onChange(path, "cantonInscripcion", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si es igual, se mostrará "del mismo cantón"
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción de lo aclarado/modificado
        </label>
        <textarea
          value={aclaratoria.descripcion || ""}
          onChange={(e) => onChange(path, "descripcion", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          rows={3}
          placeholder="Ej: se aclaró que el porcentaje adquirido corresponde al cincuenta por ciento (50%) y no al total del inmueble..."
        />
      </div>
      {/* Aclaratorias anidadas */}
      {aclaratoria.aclaratorias && aclaratoria.aclaratorias.length > 0 && (
        <div className="space-y-2">
          {aclaratoria.aclaratorias.map((subAclaratoria, index) => (
            <AclaratoriaHistoriaItem
              key={subAclaratoria.id}
              aclaratoria={subAclaratoria}
              path={[...path, index]}
              nivel={nivel + 1}
              onChange={onChange}
              onEliminar={onEliminar}
              onAgregar={onAgregar}
              rootAclaratorias={rootAclaratorias}
            />
          ))}
        </div>
      )}

      <button
        onClick={() =>
          onAgregar([
            ...path,
            path.length > 0
              ? path[path.length - 1]
              : rootAclaratorias.indexOf(aclaratoria),
          ])
        }
        className="text-sm px-3 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
      >
        + Agregar aclaratoria a esta entrada
      </button>
    </div>
  </div>
);

const AclaratoriaDeclaratoriaItem = ({
  aclaratoria,
  path,
  nivel = 0,
  onChange,
  onEliminar,
  onAgregar,
  rootAclaratorias,
}) => (
  <div
    className={`border-l-2 border-primary-300 pl-4 ${nivel > 0 ? "mt-4" : ""}`}
  >
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="font-medium text-gray-900">
          Aclaratoria {path.map((i) => i + 1).join(".")}
        </h5>
        <button
          onClick={() => onEliminar(path)}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Eliminar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de otorgamiento
          </label>
          <input
            type="date"
            value={aclaratoria.fechaOtorgamiento}
            onChange={(e) =>
              onChange(path, "fechaOtorgamiento", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de notaría
          </label>
          <input
            type="text"
            value={aclaratoria.numeroNotaria}
            onChange={(e) => onChange(path, "numeroNotaria", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: primera, 14, 22"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se convertirá automáticamente
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantón de la notaría
          </label>
          <input
            type="text"
            value={aclaratoria.cantonNotaria}
            onChange={(e) => onChange(path, "cantonNotaria", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notario
          </label>
          <input
            type="text"
            value={aclaratoria.notario}
            onChange={(e) => onChange(path, "notario", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: Alex David Mejía Viteri"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puede incluir "Doctor/a", se quita automáticamente.
          </p>
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aclaratoria.esSuplente || false}
              onChange={(e) => onChange(path, "esSuplente", e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">
              El notario es suplente
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inscripción
          </label>
          <input
            type="date"
            value={aclaratoria.fechaInscripcion}
            onChange={(e) => onChange(path, "fechaInscripcion", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantón de inscripción
          </label>
          <input
            type="text"
            value={aclaratoria.cantonInscripcion}
            onChange={(e) =>
              onChange(path, "cantonInscripcion", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si es igual, se mostrará "del mismo cantón"
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción de lo aclarado/modificado
        </label>
        <textarea
          value={aclaratoria.descripcion || ""}
          onChange={(e) => onChange(path, "descripcion", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          rows={3}
          placeholder="Ej: se aclaró que el porcentaje adquirido corresponde al cincuenta por ciento (50%) y no al total del inmueble..."
        />
      </div>
      {/* Aclaratorias anidadas */}
      {aclaratoria.aclaratorias && aclaratoria.aclaratorias.length > 0 && (
        <div className="space-y-2">
          {aclaratoria.aclaratorias.map((subAclaratoria, index) => (
            <AclaratoriaDeclaratoriaItem
              key={subAclaratoria.id}
              aclaratoria={subAclaratoria}
              path={[...path, index]}
              nivel={nivel + 1}
              onChange={onChange}
              onEliminar={onEliminar}
              onAgregar={onAgregar}
              rootAclaratorias={rootAclaratorias}
            />
          ))}
        </div>
      )}

      <button
        onClick={() =>
          onAgregar([
            ...path,
            path.length > 0
              ? path[path.length - 1]
              : rootAclaratorias.indexOf(aclaratoria),
          ])
        }
        className="text-sm px-3 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
      >
        + Agregar aclaratoria a esta entrada
      </button>
    </div>
  </div>
);

// Formulario de una parte ADICIONAL de adquisición (2da, 3ra, etc.)
// Componente a nivel de módulo — evita el bug de pérdida de foco.
const HistoriaParteForm = ({
  parte,
  index,
  onFieldChange,
  onEliminar,
  onAgregarAclaratoria,
  onEliminarAclaratoria,
  onAclaratoriaChange,
}) => (
  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-900">
        Parte de Adquisición {index + 2}
      </h3>
      <button
        onClick={() => onEliminar(index)}
        className="text-red-600 hover:text-red-800 font-medium text-sm"
      >
        Eliminar esta parte
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Porcentaje adquirido en esta parte
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={parte.porcentaje}
          onChange={(e) => onFieldChange(index, "porcentaje", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ej: 50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título de adquisición
        </label>
        <select
          value={parte.titulo}
          onChange={(e) => onFieldChange(index, "titulo", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Seleccionar</option>
          <option value="compraventa">Compraventa</option>
          <option value="donacion">Donación</option>
          <option value="permuta">Permuta</option>
          <option value="adjudicacion">Adjudicación</option>
          <option value="sucesion">Sucesión</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {parte.titulo === "otro" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especificar título
          </label>
          <input
            type="text"
            value={parte.tituloOtro}
            onChange={(e) => onFieldChange(index, "tituloOtro", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adquirido de
        </label>
        <input
          type="text"
          value={parte.adquiridoDe}
          onChange={(e) =>
            onFieldChange(index, "adquiridoDe", e.target.value.toUpperCase())
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
          placeholder="Nombre de quien(es) vendieron/transfirieron esta parte"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de otorgamiento
        </label>
        <input
          type="date"
          value={parte.fechaOtorgamiento}
          onChange={(e) =>
            onFieldChange(index, "fechaOtorgamiento", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de notaría
        </label>
        <input
          type="text"
          value={parte.numeroNotaria}
          onChange={(e) =>
            onFieldChange(index, "numeroNotaria", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ej: primera, 14, 22"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantón de la notaría
        </label>
        <input
          type="text"
          value={parte.cantonNotaria}
          onChange={(e) =>
            onFieldChange(index, "cantonNotaria", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notario/Notaria
        </label>
        <input
          type="text"
          value={parte.notario}
          onChange={(e) => onFieldChange(index, "notario", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ej: Ángela Tamara Campuzano Carriel"
        />
        <p className="text-xs text-gray-500 mt-1">
          Puede incluir "Doctor/a", se quita automáticamente.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Género del Notario
        </label>
        <select
          value={parte.generoNotario || ""}
          onChange={(e) =>
            onFieldChange(index, "generoNotario", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Seleccione</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </div>

      <div className="col-span-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={parte.esSuplente || false}
            onChange={(e) =>
              onFieldChange(index, "esSuplente", e.target.checked)
            }
            className="w-4 h-4 rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">El notario es suplente</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de inscripción
        </label>
        <input
          type="date"
          value={parte.fechaInscripcion}
          onChange={(e) =>
            onFieldChange(index, "fechaInscripcion", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantón de inscripción
        </label>
        <input
          type="text"
          value={parte.cantonInscripcion}
          onChange={(e) =>
            onFieldChange(index, "cantonInscripcion", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si es igual, se mostrará "del mismo cantón"
        </p>
      </div>
    </div>

    {/* Sucesión / causante */}
    {parte.titulo === "sucesion" && (
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium text-gray-900">Datos del Causante</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del causante
            </label>
            <input
              type="text"
              value={parte.nombreCausante}
              onChange={(e) =>
                onFieldChange(
                  index,
                  "nombreCausante",
                  e.target.value.toUpperCase(),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              El causante adquirió de
            </label>
            <input
              type="text"
              value={parte.causanteAdquiridoDe}
              onChange={(e) =>
                onFieldChange(
                  index,
                  "causanteAdquiridoDe",
                  e.target.value.toUpperCase(),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de adquisición del causante
            </label>
            <select
              value={parte.causanteTitulo}
              onChange={(e) =>
                onFieldChange(index, "causanteTitulo", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar</option>
              <option value="compraventa">Compraventa</option>
              <option value="donacion">Donación</option>
              <option value="permuta">Permuta</option>
              <option value="adjudicacion">Adjudicación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          {parte.causanteTitulo === "otro" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especificar título
              </label>
              <input
                type="text"
                value={parte.causanteTituloOtro}
                onChange={(e) =>
                  onFieldChange(index, "causanteTituloOtro", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de otorgamiento
            </label>
            <input
              type="date"
              value={parte.causanteFechaOtorgamiento}
              onChange={(e) =>
                onFieldChange(
                  index,
                  "causanteFechaOtorgamiento",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de notaría
            </label>
            <input
              type="text"
              value={parte.causanteNumeroNotaria}
              onChange={(e) =>
                onFieldChange(index, "causanteNumeroNotaria", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de la notaría
            </label>
            <input
              type="text"
              value={parte.causanteCantonNotaria}
              onChange={(e) =>
                onFieldChange(index, "causanteCantonNotaria", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notario/Notaria
            </label>
            <input
              type="text"
              value={parte.causanteNotario}
              onChange={(e) =>
                onFieldChange(index, "causanteNotario", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género del Notario
            </label>
            <select
              value={parte.causanteGeneroNotario || ""}
              onChange={(e) =>
                onFieldChange(index, "causanteGeneroNotario", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccione</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parte.causanteEsSuplente || false}
                onChange={(e) =>
                  onFieldChange(index, "causanteEsSuplente", e.target.checked)
                }
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">
                El notario es suplente
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inscripción
            </label>
            <input
              type="date"
              value={parte.causanteFechaInscripcion}
              onChange={(e) =>
                onFieldChange(index, "causanteFechaInscripcion", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de inscripción
            </label>
            <input
              type="text"
              value={parte.causanteCantonInscripcion}
              onChange={(e) =>
                onFieldChange(
                  index,
                  "causanteCantonInscripcion",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    )}

    {/* Aclaratorias de esta parte */}
    <div className="border-t pt-4 space-y-3">
      <h4 className="font-medium text-gray-900">Aclaratorias de esta parte</h4>
      {parte.aclaratorias.map((aclaratoria, aIndex) => (
        <AclaratoriaHistoriaItem
          key={aclaratoria.id}
          aclaratoria={aclaratoria}
          path={[aIndex]}
          onChange={(path, field, value) =>
            onAclaratoriaChange(index, path, field, value)
          }
          onEliminar={(path) => onEliminarAclaratoria(index, path)}
          onAgregar={(path) => onAgregarAclaratoria(index, path)}
          rootAclaratorias={parte.aclaratorias}
        />
      ))}
      <button
        onClick={() => onAgregarAclaratoria(index, [])}
        className="text-sm px-3 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
      >
        + Agregar aclaratoria a esta parte
      </button>
    </div>
  </div>
);

const FormularioCompraventa = () => {
  const toast = useToast();

  // ============================================
  // ESTADOS PRINCIPALES
  // ============================================
  const [loading, setLoading] = useState(false);
  const [modalPlantillaAbierto, setModalPlantillaAbierto] = useState(false);
  const [plantillaKey, setPlantillaKey] = useState(0);
  const [borrador, setBorrador] = useState(null); // { id, codigo, nombre }
  const [vendedores, setVendedores] = useState([]);
  const [compradores, setCompradores] = useState([]);

  // ============================================
  // ANTECEDENTES
  // ============================================
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [nombreConjunto, setNombreConjunto] = useState("");
  const [predios, setPredios] = useState([]);

  // ============================================
  // UBICACIÓN (CONSTRUIDO EN)
  // ============================================
  const [ubicacion, setUbicacion] = useState({
    lote: "",
    numero: "",
    parroquia: "",
    canton: "",
    provincia: "",
    // Para propiedad común
    tipoBienComun: "",
    tipoBienComunOtro: "",
    superficieBienComun: "",
    numeroPredio: "",
    descripcionBienComun: "",
  });

  // ============================================
  // HISTORIA DE DOMINIO
  // ============================================
  const [modoHistoria, setModoHistoria] = useState("formulario");
  const [historiaManual, setHistoriaManual] = useState("");
  const [historiaFormulario, setHistoriaFormulario] = useState({
    titulo: "",
    tituloOtro: "",
    tipoSucesion: "",
    adquiridoDe: "",
    porcentaje: "",
    fechaOtorgamiento: "",
    numeroNotaria: "",
    cantonNotaria: "",
    notario: "",
    fechaInscripcion: "",
    cantonInscripcion: "",
    // Datos del causante (solo si es sucesión)
    nombreCausante: "",
    causanteAdquiridoDe: "",
    causanteTitulo: "",
    causanteTituloOtro: "",
    causanteFechaOtorgamiento: "",
    causanteNumeroNotaria: "",
    causanteCantonNotaria: "",
    causanteNotario: "",
    causanteFechaInscripcion: "",
    causanteCantonInscripcion: "",
    // NUEVO: Aclaratorias
    aclaratorias: [],
  });

  // Partes ADICIONALES de adquisición (cuando la propiedad se compró en más de
  // una transacción, ej. 50% de una manera y 50% de otra). Por defecto vacío —
  // el 95% de los casos usa solo `historiaFormulario` de arriba, sin cambios.
  const [historiaPartesAdicionales, setHistoriaPartesAdicionales] = useState(
    [],
  );

  const nuevaParteHistoria = () => ({
    id: Date.now() + Math.random(),
    titulo: "",
    tituloOtro: "",
    tipoSucesion: "",
    adquiridoDe: "",
    porcentaje: "",
    fechaOtorgamiento: "",
    numeroNotaria: "",
    cantonNotaria: "",
    notario: "",
    generoNotario: "",
    esSuplente: false,
    fechaInscripcion: "",
    cantonInscripcion: "",
    nombreCausante: "",
    causanteAdquiridoDe: "",
    causanteTitulo: "",
    causanteTituloOtro: "",
    causanteFechaOtorgamiento: "",
    causanteNumeroNotaria: "",
    causanteCantonNotaria: "",
    causanteNotario: "",
    causanteGeneroNotario: "",
    causanteEsSuplente: false,
    causanteFechaInscripcion: "",
    causanteCantonInscripcion: "",
    aclaratorias: [],
  });

  const handleAgregarParteHistoria = () => {
    setHistoriaPartesAdicionales((prev) => [...prev, nuevaParteHistoria()]);
  };

  const handleEliminarParteHistoria = (index) => {
    setHistoriaPartesAdicionales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParteHistoriaFieldChange = (index, field, value) => {
    setHistoriaPartesAdicionales((prev) =>
      prev.map((parte, i) =>
        i === index ? { ...parte, [field]: value } : parte,
      ),
    );
  };

  // Aclaratorias dentro de una parte adicional (path = [subIndices...])
  const handleAgregarAclaratoriaParteHistoria = (parteIndex, path = []) => {
    const nueva = {
      id: Date.now(),
      titulo: "",
      tituloOtro: "",
      adquiridoDe: "",
      descripcion: "",
      fechaOtorgamiento: "",
      numeroNotaria: "",
      cantonNotaria: "",
      notario: "",
      esSuplente: false,
      fechaInscripcion: "",
      cantonInscripcion: "",
      aclaratorias: [],
    };
    setHistoriaPartesAdicionales((prev) =>
      prev.map((parte, i) => {
        if (i !== parteIndex) return parte;
        if (path.length === 0) {
          return { ...parte, aclaratorias: [...parte.aclaratorias, nueva] };
        }
        const nuevaParte = { ...parte };
        let current = nuevaParte;
        for (let j = 0; j < path.length - 1; j++) {
          current = current.aclaratorias[path[j]];
        }
        current.aclaratorias[path[path.length - 1]].aclaratorias.push(nueva);
        return nuevaParte;
      }),
    );
  };

  const handleEliminarAclaratoriaParteHistoria = (parteIndex, path) => {
    setHistoriaPartesAdicionales((prev) =>
      prev.map((parte, i) => {
        if (i !== parteIndex) return parte;
        const nuevaParte = { ...parte };
        if (path.length === 1) {
          nuevaParte.aclaratorias = nuevaParte.aclaratorias.filter(
            (_, k) => k !== path[0],
          );
          return nuevaParte;
        }
        let current = nuevaParte;
        for (let j = 0; j < path.length - 2; j++) {
          current = current.aclaratorias[path[j]];
        }
        current.aclaratorias[path[path.length - 2]].aclaratorias =
          current.aclaratorias[path[path.length - 2]].aclaratorias.filter(
            (_, k) => k !== path[path.length - 1],
          );
        return nuevaParte;
      }),
    );
  };

  const handleAclaratoriaParteHistoriaChange = (
    parteIndex,
    path,
    field,
    value,
  ) => {
    setHistoriaPartesAdicionales((prev) =>
      prev.map((parte, i) => {
        if (i !== parteIndex) return parte;
        const nuevaParte = { ...parte };
        let current = nuevaParte;
        for (let j = 0; j < path.length - 1; j++) {
          current = current.aclaratorias[path[j]];
        }
        current.aclaratorias[path[path.length - 1]][field] = value;
        return nuevaParte;
      }),
    );
  };
  // ============================================
  // DECLARATORIA (SOLO HORIZONTAL)
  // ============================================
  const [modoDeclaratoria, setModoDeclaratoria] = useState("formulario");
  const [declaratoriaManual, setDeclaratoriaManual] = useState("");
  const [declaratoriaFormulario, setDeclaratoriaFormulario] = useState({
    fechaOtorgamiento: "",
    numeroNotaria: "",
    cantonNotaria: "",
    notario: "",
    fechaInscripcion: "",
    cantonInscripcion: "",
    // NUEVO: Aclaratorias
    aclaratorias: [],
  });

  // ============================================
  // LINDEROS GENERALES (NUEVO: Arrays para múltiples linderos)
  // ============================================
  const [linderosGenerales, setLinderosGenerales] = useState({
    norte: [{ metros: "", colindancia: "" }],
    sur: [{ metros: "", colindancia: "" }],
    este: [{ metros: "", colindancia: "" }],
    oeste: [{ metros: "", colindancia: "" }],
    superficie: "",
  });

  // ============================================
  // LINDEROS ESPECIFICOS (NUEVO: Con arriba/abajo)
  // ============================================
  const [tieneLInderosEspecificos, setTieneLInderosEspecificos] =
    useState(false);
  const [linderosEspecificos, setLinderosEspecificos] = useState({
    norte: [{ metros: "", colindancia: "" }],
    sur: [{ metros: "", colindancia: "" }],
    este: [{ metros: "", colindancia: "" }],
    oeste: [{ metros: "", colindancia: "" }],
    arriba: [{ metros: "", colindancia: "" }],
    abajo: [{ metros: "", colindancia: "" }],
    superficie: "",
  });

  // ============================================
  // OBJETO DEL CONTRATO
  // ============================================
  const [modoSujeto, setModoSujeto] = useState("auto");
  const [sujetoManual, setSujetoManual] = useState("");

  // ============================================
  // PRECIO Y FORMA DE PAGO
  // ============================================
  const [precioTotal, setPrecioTotal] = useState("");
  const [modoPrecio, setModoPrecio] = useState("formulario");
  const [precioManual, setPrecioManual] = useState("");
  const [partesPago, setPartesPago] = useState([
    {
      id: Date.now(),
      letra: "A",
      monto: "",
      tipoPago: "unico",
      medioPago: "",
      tipoCheque: "",
      momentoPago: "",
      momentoOtro: "",
      momentoEsFecha: false,
      esCreditoBancario: false,
      nombreBanco: "",
      cuentaDestino: "",
      numeroCuotas: "",
      valorCuota: 0,
      periodicidad: "",
      periodicidadOtra: "",
      // NUEVO: Detalle de transferencia/depósito
      tieneDetalle: false,
      detalle: {
        bancoOrigen: "",
        cuentaOrigen: "",
        tipoCuentaOrigen: "",
        bancoDestino: "",
        cuentaDestino: "",
        tipoCuentaDestino: "",
      },
    },
  ]);

  // ============================================
  // ADMINISTRADOR Y ABOGADO
  // ============================================
  const [hayAdministrador, setHayAdministrador] = useState(false);
  const [abogado, setAbogado] = useState({
    nombre: "",
    numeroMatricula: "",
    tipoMatricula: "cj",
    provincia: "",
  });

  // ============================================
  // OPCIONES
  // ============================================
  const tiposPredios = [
    "Departamento",
    "Suite",
    "Casa",
    "Loft",
    "Estacionamiento",
    "Oficina",
    "Bodega",
    "Almacén",
    "Porche",
    "Terraza",
    "Jardín Delantero",
    "Jardín Trasero",
    "Secadero",
    "Otro",
  ];

  const tiposInmuebles = [
    "Planta",
    "Planta Baja",
    "Planta Alta",
    ...tiposPredios,
  ];

  // ============================================
  // FUNCIONES - COMPARECIENTES
  // ============================================
  // ============================================
  // FUNCIÓN - CARGAR PLANTILLA
  // ============================================
  const handleCargarPlantilla = (contenido, guardado = null) => {
    if (guardado)
      setBorrador({
        id: guardado.id,
        codigo: guardado.codigo,
        nombre: guardado.nombre,
      });
    if (contenido.vendedores !== undefined) setVendedores(contenido.vendedores);
    if (contenido.compradores !== undefined)
      setCompradores(contenido.compradores);
    if (contenido.tipoPropiedad !== undefined)
      setTipoPropiedad(contenido.tipoPropiedad);
    if (contenido.nombreConjunto !== undefined)
      setNombreConjunto(contenido.nombreConjunto);
    if (contenido.predios !== undefined) setPredios(contenido.predios);
    if (contenido.ubicacion !== undefined) setUbicacion(contenido.ubicacion);
    if (contenido.modoHistoria !== undefined)
      setModoHistoria(contenido.modoHistoria);
    if (contenido.historiaManual !== undefined)
      setHistoriaManual(contenido.historiaManual);
    if (contenido.historiaFormulario !== undefined)
      setHistoriaFormulario(contenido.historiaFormulario);
    if (contenido.historiaPartesAdicionales !== undefined)
      setHistoriaPartesAdicionales(contenido.historiaPartesAdicionales);
    if (contenido.modoDeclaratoria !== undefined)
      setModoDeclaratoria(contenido.modoDeclaratoria);
    if (contenido.declaratoriaManual !== undefined)
      setDeclaratoriaManual(contenido.declaratoriaManual);
    if (contenido.declaratoriaFormulario !== undefined)
      setDeclaratoriaFormulario(contenido.declaratoriaFormulario);
    if (contenido.linderosGenerales !== undefined)
      setLinderosGenerales(contenido.linderosGenerales);
    if (contenido.tieneLInderosEspecificos !== undefined)
      setTieneLInderosEspecificos(contenido.tieneLInderosEspecificos);
    if (contenido.linderosEspecificos !== undefined)
      setLinderosEspecificos(contenido.linderosEspecificos);
    if (contenido.modoSujeto !== undefined) setModoSujeto(contenido.modoSujeto);
    if (contenido.sujetoManual !== undefined)
      setSujetoManual(contenido.sujetoManual);
    if (contenido.precioTotal !== undefined)
      setPrecioTotal(contenido.precioTotal);
    if (contenido.modoPrecio !== undefined) setModoPrecio(contenido.modoPrecio);
    if (contenido.precioManual !== undefined)
      setPrecioManual(contenido.precioManual);
    if (contenido.partesPago !== undefined) setPartesPago(contenido.partesPago);
    if (contenido.hayAdministrador !== undefined)
      setHayAdministrador(contenido.hayAdministrador);
    if (contenido.abogado !== undefined) setAbogado(contenido.abogado);
    setPlantillaKey((k) => k + 1);
  };

  useBorradorDeUrl(handleCargarPlantilla);

  const handleAgregarVendedor = () => setVendedores([...vendedores, null]);
  const handleVendedorReady = (index, data) => {
    const newVendedores = [...vendedores];
    newVendedores[index] = data;
    setVendedores(newVendedores);
  };
  const handleEliminarVendedor = (index) =>
    setVendedores(vendedores.filter((_, i) => i !== index));

  const handleAgregarComprador = () => setCompradores([...compradores, null]);
  const handleCompradorReady = (index, data) => {
    const newCompradores = [...compradores];
    newCompradores[index] = data;
    setCompradores(newCompradores);
  };
  const handleEliminarComprador = (index) =>
    setCompradores(compradores.filter((_, i) => i !== index));

  // ============================================
  // FUNCIONES - PREDIOS
  // ============================================
  const handleAgregarPredio = (esCompuesto) => {
    setPredios([
      ...predios,
      {
        id: Date.now(),
        esCompuesto,
        tipo: "",
        tipoOtro: "",
        numero: "",
        inmuebles: [
          {
            id: Date.now() + Math.random(),
            tipo: "",
            tipoOtro: "",
            numero: "",
            nivel: "",
            areaCubierta: "",
            areaDescubierta: "",
            alicuotaParcial: "",
          },
        ],
        alicuotaTotal: 0,
        alicuotaTotalManual: "",
        usarAlicuotaManual: false,
      },
    ]);
  };

  const handleEliminarPredio = (predioId) =>
    setPredios(predios.filter((p) => p.id !== predioId));

  const handlePredioChange = (predioId, field, value) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id === predioId) {
          const updated = { ...predio, [field]: value };

          // Si cambia usarAlicuotaManual a false, recalcular
          if (field === "usarAlicuotaManual" && !value) {
            const suma = updated.inmuebles.reduce((acc, inm) => {
              return acc + (parseFloat(inm.alicuotaParcial) || 0);
            }, 0);
            updated.alicuotaTotal = parseFloat(suma.toFixed(10));
          }

          return updated;
        }
        return predio;
      }),
    );
  };

  const handleAgregarInmueble = (predioId) => {
    setPredios(
      predios.map((predio) =>
        predio.id === predioId && predio.esCompuesto
          ? {
              ...predio,
              inmuebles: [
                ...predio.inmuebles,
                {
                  id: Date.now() + Math.random(),
                  tipo: "",
                  tipoOtro: "",
                  numero: "",
                  nivel: "",
                  areaCubierta: "",
                  areaDescubierta: "",
                  alicuotaParcial: "",
                },
              ],
            }
          : predio,
      ),
    );
  };

  const handleEliminarInmueble = (predioId, inmuebleId) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id === predioId) {
          const nuevosInmuebles = predio.inmuebles.filter(
            (i) => i.id !== inmuebleId,
          );

          // Recalcular alícuota total si no es manual
          let nuevaAlicuotaTotal = predio.alicuotaTotal;
          if (!predio.usarAlicuotaManual) {
            const suma = nuevosInmuebles.reduce((acc, inm) => {
              return acc + (parseFloat(inm.alicuotaParcial) || 0);
            }, 0);
            nuevaAlicuotaTotal = parseFloat(suma.toFixed(10));
          }

          return {
            ...predio,
            inmuebles: nuevosInmuebles,
            alicuotaTotal: nuevaAlicuotaTotal,
          };
        }
        return predio;
      }),
    );
  };

  const handleInmuebleChange = (predioId, inmuebleId, field, value) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id === predioId) {
          const nuevosInmuebles = predio.inmuebles.map((inmueble) => {
            if (inmueble.id === inmuebleId) {
              return { ...inmueble, [field]: value };
            }
            return inmueble;
          });

          // Recalcular alícuota total si no es manual
          let nuevaAlicuotaTotal = predio.alicuotaTotal;
          if (!predio.usarAlicuotaManual) {
            const suma = nuevosInmuebles.reduce((acc, inm) => {
              return acc + (parseFloat(inm.alicuotaParcial) || 0);
            }, 0);
            nuevaAlicuotaTotal = parseFloat(suma.toFixed(10));
          }

          return {
            ...predio,
            inmuebles: nuevosInmuebles,
            alicuotaTotal: nuevaAlicuotaTotal,
          };
        }
        return predio;
      }),
    );
  };

  // ============================================
  // FUNCIONES - LINDEROS (NUEVO: Múltiples por dirección)
  // ============================================
  const handleAgregarLindero = (direccion, esEspecifico = false) => {
    if (esEspecifico) {
      setLinderosEspecificos({
        ...linderosEspecificos,
        [direccion]: [
          ...linderosEspecificos[direccion],
          { metros: "", colindancia: "" },
        ],
      });
    } else {
      setLinderosGenerales({
        ...linderosGenerales,
        [direccion]: [
          ...linderosGenerales[direccion],
          { metros: "", colindancia: "" },
        ],
      });
    }
  };

  const handleEliminarLindero = (direccion, index, esEspecifico = false) => {
    if (esEspecifico) {
      const nuevosLinderos = linderosEspecificos[direccion].filter(
        (_, i) => i !== index,
      );
      setLinderosEspecificos({
        ...linderosEspecificos,
        [direccion]:
          nuevosLinderos.length > 0
            ? nuevosLinderos
            : [{ metros: "", colindancia: "" }],
      });
    } else {
      const nuevosLinderos = linderosGenerales[direccion].filter(
        (_, i) => i !== index,
      );
      setLinderosGenerales({
        ...linderosGenerales,
        [direccion]:
          nuevosLinderos.length > 0
            ? nuevosLinderos
            : [{ metros: "", colindancia: "" }],
      });
    }
  };

  const handleLinderoChange = (
    direccion,
    index,
    field,
    value,
    esEspecifico = false,
  ) => {
    if (esEspecifico) {
      const nuevosLinderos = [...linderosEspecificos[direccion]];
      nuevosLinderos[index][field] = value;
      setLinderosEspecificos({
        ...linderosEspecificos,
        [direccion]: nuevosLinderos,
      });
    } else {
      const nuevosLinderos = [...linderosGenerales[direccion]];
      nuevosLinderos[index][field] = value;
      setLinderosGenerales({
        ...linderosGenerales,
        [direccion]: nuevosLinderos,
      });
    }
  };

  // ============================================
  // FUNCIONES - ACLARATORIAS HISTORIA (NUEVO: Recursivas)
  // ============================================
  const handleAgregarAclaratoriaHistoria = (path = []) => {
    const nuevaAclaratoria = {
      id: Date.now(),
      titulo: "",
      tituloOtro: "",
      adquiridoDe: "",
      descripcion: "",
      fechaOtorgamiento: "",
      numeroNotaria: "",
      cantonNotaria: "",
      notario: "",
      esSuplente: false,
      fechaInscripcion: "",
      cantonInscripcion: "",
      aclaratorias: [],
    };

    if (path.length === 0) {
      setHistoriaFormulario({
        ...historiaFormulario,
        aclaratorias: [...historiaFormulario.aclaratorias, nuevaAclaratoria],
      });
    } else {
      const newHistoria = { ...historiaFormulario };
      let current = newHistoria;

      for (let i = 0; i < path.length - 1; i++) {
        current = current.aclaratorias[path[i]];
      }

      const lastIndex = path[path.length - 1];
      current.aclaratorias[lastIndex].aclaratorias.push(nuevaAclaratoria);

      setHistoriaFormulario(newHistoria);
    }
  };

  const handleEliminarAclaratoriaHistoria = (path) => {
    const newHistoria = { ...historiaFormulario };

    if (path.length === 1) {
      newHistoria.aclaratorias = newHistoria.aclaratorias.filter(
        (_, i) => i !== path[0],
      );
    } else {
      let current = newHistoria;
      for (let i = 0; i < path.length - 2; i++) {
        current = current.aclaratorias[path[i]];
      }
      current.aclaratorias[path[path.length - 2]].aclaratorias =
        current.aclaratorias[path[path.length - 2]].aclaratorias.filter(
          (_, i) => i !== path[path.length - 1],
        );
    }

    setHistoriaFormulario(newHistoria);
  };

  const handleAclaratoriaHistoriaChange = (path, field, value) => {
    const newHistoria = { ...historiaFormulario };
    let current = newHistoria;

    for (let i = 0; i < path.length - 1; i++) {
      current = current.aclaratorias[path[i]];
    }

    current.aclaratorias[path[path.length - 1]][field] = value;

    setHistoriaFormulario(newHistoria);
  };

  // ============================================
  // FUNCIONES - ACLARATORIAS DECLARATORIA (NUEVO: Recursivas)
  // ============================================
  // Handler para campos simples de declaratoria — evita pérdida de focus
  const handleDeclaratoriaFieldChange = (field, value) => {
    setDeclaratoriaFormulario((prev) => ({ ...prev, [field]: value }));
  };

  // Handler para campos simples de historia — evita pérdida de focus
  const handleHistoriaFieldChange = (field, value) => {
    setHistoriaFormulario((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgregarAclaratoriaDeclaratoria = (path = []) => {
    const nuevaAclaratoria = {
      id: Date.now(),
      descripcion: "",
      fechaOtorgamiento: "",
      numeroNotaria: "",
      cantonNotaria: "",
      notario: "",
      esSuplente: false,
      fechaInscripcion: "",
      cantonInscripcion: "",
      aclaratorias: [],
    };

    if (path.length === 0) {
      setDeclaratoriaFormulario({
        ...declaratoriaFormulario,
        aclaratorias: [
          ...declaratoriaFormulario.aclaratorias,
          nuevaAclaratoria,
        ],
      });
    } else {
      const newDeclaratoria = { ...declaratoriaFormulario };
      let current = newDeclaratoria;

      for (let i = 0; i < path.length - 1; i++) {
        current = current.aclaratorias[path[i]];
      }

      const lastIndex = path[path.length - 1];
      current.aclaratorias[lastIndex].aclaratorias.push(nuevaAclaratoria);

      setDeclaratoriaFormulario(newDeclaratoria);
    }
  };

  const handleEliminarAclaratoriaDeclaratoria = (path) => {
    const newDeclaratoria = { ...declaratoriaFormulario };

    if (path.length === 1) {
      newDeclaratoria.aclaratorias = newDeclaratoria.aclaratorias.filter(
        (_, i) => i !== path[0],
      );
    } else {
      let current = newDeclaratoria;
      for (let i = 0; i < path.length - 2; i++) {
        current = current.aclaratorias[path[i]];
      }
      current.aclaratorias[path[path.length - 2]].aclaratorias =
        current.aclaratorias[path[path.length - 2]].aclaratorias.filter(
          (_, i) => i !== path[path.length - 1],
        );
    }

    setDeclaratoriaFormulario(newDeclaratoria);
  };

  const handleAclaratoriaDeclaratoriaChange = (path, field, value) => {
    const newDeclaratoria = { ...declaratoriaFormulario };
    let current = newDeclaratoria;

    for (let i = 0; i < path.length - 1; i++) {
      current = current.aclaratorias[path[i]];
    }

    current.aclaratorias[path[path.length - 1]][field] = value;

    setDeclaratoriaFormulario(newDeclaratoria);
  };

  // ============================================
  // FUNCIONES - PRECIO Y FORMA DE PAGO
  // ============================================
  const calcularSaldoRestante = () => {
    const total = parseFloat(precioTotal) || 0;
    const sumaPagos = partesPago.reduce(
      (sum, parte) => sum + (parseFloat(parte.monto) || 0),
      0,
    );
    return total - sumaPagos;
  };

  const handleAgregarPartePago = () => {
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const nuevaLetra = letras[partesPago.length] || `${partesPago.length + 1}`;

    setPartesPago([
      ...partesPago,
      {
        id: Date.now(),
        letra: nuevaLetra,
        monto: "",
        tipoPago: "unico",
        medioPago: "",
        tipoCheque: "",
        momentoPago: "",
        momentoOtro: "",
        momentoEsFecha: false,
        esCreditoBancario: false,
        nombreBanco: "",
        cuentaDestino: "",
        numeroCuotas: "",
        valorCuota: 0,
        periodicidad: "",
        periodicidadOtra: "",
        // NUEVO
        tieneDetalle: false,
        detalle: {
          bancoOrigen: "",
          cuentaOrigen: "",
          tipoCuentaOrigen: "",
          bancoDestino: "",
          cuentaDestino: "",
          tipoCuentaDestino: "",
        },
      },
    ]);
  };

  const handleEliminarPartePago = (id) => {
    const nuevasPartes = partesPago.filter((p) => p.id !== id);
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    nuevasPartes.forEach((parte, index) => {
      parte.letra = letras[index] || `${index + 1}`;
    });
    setPartesPago(nuevasPartes);
  };

  const handlePartePagoChange = (id, field, value) => {
    setPartesPago(
      partesPago.map((parte) => {
        if (parte.id === id) {
          const updated = { ...parte, [field]: value };

          // Auto-calcular valor de cuota
          if (field === "monto" || field === "numeroCuotas") {
            if (
              updated.tipoPago === "cuotas" &&
              updated.monto &&
              updated.numeroCuotas
            ) {
              updated.valorCuota =
                parseFloat(updated.monto) / parseInt(updated.numeroCuotas);
            }
          }

          // Limpiar campos según condiciones
          if (field === "tipoPago" && value === "unico") {
            updated.numeroCuotas = "";
            updated.valorCuota = 0;
            updated.periodicidad = "";
            updated.periodicidadOtra = "";
          }

          if (field === "medioPago" && value !== "cheque") {
            updated.tipoCheque = "";
          }

          if (field === "momentoPago" && value !== "otro") {
            updated.momentoOtro = "";
          }

          if (field === "momentoEsFecha") {
            updated.momentoOtro = "";
          }

          if (field === "esCreditoBancario" && !value) {
            updated.nombreBanco = "";
            updated.cuentaDestino = "";
          }

          return updated;
        }
        return parte;
      }),
    );
  };

  // NUEVO: Manejo de detalle de transferencia/depósito
  const handleDetallePartePagoChange = (id, field, value) => {
    setPartesPago(
      partesPago.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            detalle: {
              ...p.detalle,
              [field]: value,
            },
          };
        }
        return p;
      }),
    );
  };

  // ============================================
  // COMPONENTES RECURSIVOS - ACLARATORIAS
  // ============================================

  // ============================================
  // FUNCIÓN - GENERAR MINUTA
  // ============================================
  const handleGenerarMinuta = async () => {
    // Validaciones
    if (vendedores.length === 0 || compradores.length === 0) {
      toast.error("Debe agregar al menos un vendedor y un comprador");
      return;
    }

    if (!tipoPropiedad) {
      toast.error("Debe seleccionar un tipo de propiedad");
      return;
    }

    if (tipoPropiedad === "horizontal" && predios.length === 0) {
      toast.error("Debe agregar al menos un predio");
      return;
    }

    if (!abogado.nombre || !abogado.numeroMatricula) {
      toast.error("Debe completar los datos del abogado");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tipoContrato: "compraventa",
        vendedores: vendedores.filter((v) => v !== null),
        compradores: compradores.filter((c) => c !== null),
        tipoPropiedad,
        nombreConjunto: tipoPropiedad === "horizontal" ? nombreConjunto : null,
        predios: tipoPropiedad === "horizontal" ? predios : null,
        bienComun:
          tipoPropiedad === "comun"
            ? {
                tipoBienComun: ubicacion.tipoBienComun,
                tipoBienComunOtro: ubicacion.tipoBienComunOtro,
                superficieBienComun: ubicacion.superficieBienComun,
                numeroPredio: ubicacion.numeroPredio,
                descripcionBienComun: ubicacion.descripcionBienComun,
              }
            : null,
        ubicacion: {
          lote: ubicacion.lote,
          numero: ubicacion.numero,
          parroquia: ubicacion.parroquia,
          canton: ubicacion.canton,
          provincia: ubicacion.provincia,
        },
        modoHistoria,
        historiaManual: modoHistoria === "redactar" ? historiaManual : null,
        historiaPartes:
          modoHistoria === "formulario"
            ? [historiaFormulario, ...historiaPartesAdicionales]
            : null,
        modoDeclaratoria:
          tipoPropiedad === "horizontal" ? modoDeclaratoria : null,
        declaratoriaManual:
          tipoPropiedad === "horizontal" && modoDeclaratoria === "redactar"
            ? declaratoriaManual
            : null,
        declaratoriaFormulario:
          tipoPropiedad === "horizontal" && modoDeclaratoria === "formulario"
            ? declaratoriaFormulario
            : null,
        linderosGenerales,
        tieneLInderosEspecificos:
          tipoPropiedad === "horizontal" ? tieneLInderosEspecificos : false,
        linderosEspecificos:
          tipoPropiedad === "horizontal" && tieneLInderosEspecificos
            ? linderosEspecificos
            : null,
        modoSujeto,
        sujetoManual: modoSujeto === "manual" ? sujetoManual : null,
        modoPrecio,
        precioTotal,
        partesPago: modoPrecio === "formulario" ? partesPago : null,
        precioManual: modoPrecio === "manual" ? precioManual : null,
        hayAdministrador:
          tipoPropiedad === "horizontal" ? hayAdministrador : null,
        abogado,
      };

      const response = await apiFetch(API_CONFIG.ENDPOINTS.GENERATE_MINUTA, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await descargarRespuesta(response, "minuta.docx");
        toast.success("Minuta generada exitosamente");
      } else {
        let data = null;
        try {
          data = await response.json();
        } catch (_e) {
          // respuesta no-JSON
        }
        const detalle = Array.isArray(data?.detail)
          ? data.detail.map((d) => d.msg).join(", ")
          : data?.detail;
        toast.error(
          detalle || `Error al generar minuta (código ${response.status})`,
        );
      }
    } catch (error) {
      const msg =
        typeof error?.message === "string"
          ? error.message
          : "Error de conexión al generar la minuta.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generar Minuta</h1>
            <p className="text-gray-600 mt-1">
              Complete los datos para generar la minuta
            </p>
          </div>
        </div>
        {/* BUSCADOR DE PLANTILLAS */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Cargar borrador
          </p>
          <BuscadorPlantillas
            tipoDocumento="minuta"
            tipoContrato="compraventa"
            onCargar={handleCargarPlantilla}
          />
          {borrador && (
            <p className="text-sm text-amber-900 mt-3">
              Editando el borrador{" "}
              <span className="font-mono font-semibold">{borrador.codigo}</span>{" "}
              · {borrador.nombre}
            </p>
          )}
          <p className="text-xs text-amber-600 mt-2">
            Busca por código, nombre del borrador, vendedor o cédula. Al
            seleccionar un borrador se cargan todos los datos del formulario.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* VENDEDORES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Vendedores</h2>
            <Button variant="outline" size="sm" onClick={handleAgregarVendedor}>
              + Agregar Vendedor
            </Button>
          </div>

          {vendedores.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay vendedores. Click en "Agregar Vendedor".
              </p>
            </div>
          )}

          {vendedores.map((v, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`vendedor-${plantillaKey}-${index}`}
                title={`Vendedor ${index + 1}`}
                initialData={v || null}
                onComparecienteReady={(data) =>
                  handleVendedorReady(index, data)
                }
              />
              {vendedores.length > 1 && (
                <button
                  onClick={() => handleEliminarVendedor(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 3. COMPRADORES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Compradores</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAgregarComprador}
            >
              + Agregar Comprador
            </Button>
          </div>

          {compradores.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay compradores. Click en "Agregar Comprador".
              </p>
            </div>
          )}

          {compradores.map((c, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`comprador-${plantillaKey}-${index}`}
                title={`Comprador ${index + 1}`}
                initialData={c || null}
                onComparecienteReady={(data) =>
                  handleCompradorReady(index, data)
                }
              />
              {compradores.length > 1 && (
                <button
                  onClick={() => handleEliminarComprador(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* SEPARADOR - ANTECEDENTES */}
        <div className="border-t-4 border-primary-500 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ANTECEDENTES
          </h2>
        </div>

        {/* 4. TIPO DE PROPIEDAD */}
        <Card title="Tipo de Propiedad">
          <select
            value={tipoPropiedad}
            onChange={(e) => {
              setTipoPropiedad(e.target.value);
              setNombreConjunto("");
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccione tipo de propiedad</option>
            <option value="horizontal">Propiedad Horizontal</option>
            <option value="comun">Propiedad Común</option>
          </select>
        </Card>

        {/* 5. NOMBRE DEL CONJUNTO (solo para horizontal) */}
        {tipoPropiedad === "horizontal" && (
          <Card title="Nombre del Conjunto/Edificio">
            <input
              type="text"
              value={nombreConjunto}
              onChange={(e) => setNombreConjunto(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
              placeholder="Ej: EDIFICIO MONTICELLO"
            />
          </Card>
        )}

        {/* 6. BIENES A INCLUIR (PREDIOS) */}
        {tipoPropiedad === "horizontal" && (
          <Card title="Bienes a Incluir (Predios)">
            <div className="space-y-6">
              {/* Botones para agregar predio */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-700">
                  ¿Qué tipo de predio desea agregar?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAgregarPredio(false)}
                    className="flex-1 p-4 border-2 border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-blue-900 mb-1">
                      Predio Simple
                    </div>
                    <div className="text-xs text-blue-700">
                      Un solo inmueble independiente (ej: Parqueadero, Bodega)
                    </div>
                  </button>

                  <button
                    onClick={() => handleAgregarPredio(true)}
                    className="flex-1 p-4 border-2 border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-purple-900 mb-1">
                      Predio Compuesto
                    </div>
                    <div className="text-xs text-purple-700">
                      Múltiples inmuebles relacionados (ej: Departamento con
                      porche, terraza, jardines)
                    </div>
                  </button>
                </div>
              </div>

              {/* Lista de predios */}
              {predios.length === 0 && (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-600">
                    No hay predios agregados. Seleccione el tipo de predio
                    arriba.
                  </p>
                </div>
              )}

              {predios.map((predio, predioIndex) => (
                <div
                  key={predio.id}
                  className={`border-2 rounded-lg p-6 ${
                    predio.esCompuesto
                      ? "border-purple-300 bg-purple-50"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  {/* Header del predio */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-lg font-bold ${
                          predio.esCompuesto
                            ? "text-purple-900"
                            : "text-blue-900"
                        }`}
                      >
                        PREDIO {predioIndex + 1}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          predio.esCompuesto
                            ? "bg-purple-200 text-purple-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {predio.esCompuesto ? "Compuesto" : "Simple"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEliminarPredio(predio.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar Predio
                    </button>
                  </div>

                  {/* Datos del predio */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Predio
                      </label>
                      <select
                        value={predio.tipo}
                        onChange={(e) =>
                          handlePredioChange(predio.id, "tipo", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">Seleccione tipo</option>
                        {tiposPredios.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {predio.tipo === "Otro" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Especifique el tipo
                        </label>
                        <input
                          type="text"
                          value={predio.tipoOtro}
                          onChange={(e) =>
                            handlePredioChange(
                              predio.id,
                              "tipoOtro",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Local comercial"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={predio.numero}
                        onChange={(e) =>
                          handlePredioChange(
                            predio.id,
                            "numero",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número Predial{" "}
                        <span className="text-gray-400 font-normal">
                          (opcional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={predio.numeroPredial || ""}
                        onChange={(e) =>
                          handlePredioChange(
                            predio.id,
                            "numeroPredial",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 3785047"
                      />
                    </div>
                  </div>

                  {/* Inmuebles del predio */}
                  <div className="border-t-2 border-gray-300 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {predio.esCompuesto
                        ? "Inmuebles del Predio"
                        : "Datos del Inmueble"}
                    </h4>

                    <div className="space-y-3">
                      {predio.inmuebles.map((inmueble, inmuebleIndex) => (
                        <div
                          key={inmueble.id}
                          className="border border-gray-300 rounded-lg p-4 bg-white"
                        >
                          {predio.esCompuesto && (
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-gray-700">
                                Inmueble {inmuebleIndex + 1}
                              </span>
                              {predio.inmuebles.length > 1 && (
                                <button
                                  onClick={() =>
                                    handleEliminarInmueble(
                                      predio.id,
                                      inmueble.id,
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {/* Solo mostrar tipo si es compuesto */}
                            {predio.esCompuesto && (
                              <>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Inmueble
                                  </label>
                                  <select
                                    value={inmueble.tipo}
                                    onChange={(e) =>
                                      handleInmuebleChange(
                                        predio.id,
                                        inmueble.id,
                                        "tipo",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleccione tipo</option>
                                    {tiposInmuebles.map((tipo) => (
                                      <option key={tipo} value={tipo}>
                                        {tipo}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {inmueble.tipo === "Otro" && (
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Especifique el tipo
                                    </label>
                                    <input
                                      type="text"
                                      value={inmueble.tipoOtro}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "tipoOtro",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                      placeholder="Ej: Balcón"
                                    />
                                  </div>
                                )}

                                {/* Número propio del inmueble */}
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número del Inmueble
                                    <span className="text-gray-400 font-normal ml-1">
                                      (si es diferente al número del predio)
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    value={inmueble.numero}
                                    onChange={(e) =>
                                      handleInmuebleChange(
                                        predio.id,
                                        inmueble.id,
                                        "numero",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    placeholder={`Ej: ${predio.numero || "2b"} (dejar vacío para usar el número del predio)`}
                                  />
                                </div>
                              </>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nivel{" "}
                                <span className="text-gray-400 font-normal">
                                  (opcional)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={inmueble.nivel}
                                onChange={(e) =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "nivel",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ej: N+3.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Área Cubierta (m²){" "}
                                <span className="text-gray-400 font-normal">
                                  (opcional)
                                </span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inmueble.areaCubierta}
                                onChange={(e) =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "areaCubierta",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value);
                                  if (!isNaN(num))
                                    handleInmuebleChange(
                                      predio.id,
                                      inmueble.id,
                                      "areaCubierta",
                                      num.toFixed(2),
                                    );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ej: 217.49"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Se guardará con 2 decimales (.00)
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Área Descubierta (m²){" "}
                                <span className="text-gray-400 font-normal">
                                  (opcional)
                                </span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inmueble.areaDescubierta}
                                onChange={(e) =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "areaDescubierta",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value);
                                  if (!isNaN(num))
                                    handleInmuebleChange(
                                      predio.id,
                                      inmueble.id,
                                      "areaDescubierta",
                                      num.toFixed(2),
                                    );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ej: 166.04"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Se guardará con 2 decimales (.00)
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alícuota Parcial (%)
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inmueble.alicuotaParcial}
                                onChange={(e) =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "alicuotaParcial",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value);
                                  if (!isNaN(num))
                                    handleInmuebleChange(
                                      predio.id,
                                      inmueble.id,
                                      "alicuotaParcial",
                                      parseFloat(
                                        num.toPrecision(12),
                                      ).toString(),
                                    );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ej: 11.4013256789"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Los decimales necesarios
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botón agregar inmueble (solo para compuestos) */}
                    {predio.esCompuesto && (
                      <button
                        onClick={() => handleAgregarInmueble(predio.id)}
                        className="mt-3 w-full text-sm px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        + Agregar Inmueble
                      </button>
                    )}

                    {/* Alícuota total del predio */}
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-900">
                            Alícuota Total Calculada:
                          </span>
                          <span className="text-lg font-bold text-green-700">
                            {parseFloat(
                              predio.alicuotaTotal.toPrecision(12),
                            ).toString()}
                            %
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={predio.usarAlicuotaManual}
                            onChange={(e) =>
                              handlePredioChange(
                                predio.id,
                                "usarAlicuotaManual",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                          />
                          <span className="text-sm font-medium text-yellow-900">
                            Usar alícuota total diferente (según Registro de la
                            Propiedad)
                          </span>
                        </label>

                        {predio.usarAlicuotaManual && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alícuota Total Manual (%)
                            </label>
                            <input
                              type="number"
                              step="0.0000000001"
                              value={predio.alicuotaTotalManual}
                              onChange={(e) =>
                                handlePredioChange(
                                  predio.id,
                                  "alicuotaTotalManual",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Ej: 31.2217256789"
                            />
                            <p className="text-xs text-yellow-700 mt-1">
                              Los decimales necesarios. Use este valor si
                              difiere del calculado automáticamente
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 6B. BIENES PARA PROPIEDAD COMÚN */}
        {tipoPropiedad === "comun" && (
          <Card title="Descripción del Bien (Propiedad Común)">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Bien
                </label>
                <select
                  value={ubicacion.tipoBienComun || ""}
                  onChange={(e) =>
                    setUbicacion({
                      ...ubicacion,
                      tipoBienComun: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccione el tipo de bien</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno</option>
                  <option value="solares">Solares</option>
                  <option value="fincas">Fincas</option>
                  <option value="haciendas">Haciendas</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {ubicacion.tipoBienComun === "otro" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especifique el tipo de bien
                  </label>
                  <input
                    type="text"
                    value={ubicacion.tipoBienComunOtro || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        tipoBienComunOtro: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Quinta"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie Total (m²)
                  </label>
                  <input
                    type="text"
                    value={ubicacion.superficieBienComun || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        superficieBienComun: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 1000.44"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Predio (opcional)
                  </label>
                  <input
                    type="text"
                    value={ubicacion.numeroPredio || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        numeroPredio: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Adicional (opcional)
                </label>
                <textarea
                  value={ubicacion.descripcionBienComun || ""}
                  onChange={(e) =>
                    setUbicacion({
                      ...ubicacion,
                      descripcionBienComun: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="3"
                  placeholder="Ej: Casa de dos plantas con jardín frontal y posterior..."
                />
              </div>
            </div>
          </Card>
        )}

        {/* 7. CONSTRUIDO EN */}
        {tipoPropiedad && (
          <>
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                CONSTRUIDO EN
              </h3>
            </div>

            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inmueble
                  </label>
                  <input
                    type="text"
                    value={ubicacion.lote}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, lote: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Lote de terreno"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={ubicacion.numero}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, numero: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parroquia
                  </label>
                  <input
                    type="text"
                    value={ubicacion.parroquia}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, parroquia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Nayón"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantón
                  </label>
                  <input
                    type="text"
                    value={ubicacion.canton}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, canton: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Quito"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={ubicacion.provincia}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, provincia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Pichincha"
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* 8. HISTORIA DE DOMINIO */}
        {tipoPropiedad && (
          <SeccionFormularioRedactar
            titulo="HISTORIA DE DOMINIO"
            onTextoManualChange={setHistoriaManual}
            placeholderTexto="Escriba aquí la historia de dominio del inmueble..."
            renderFormulario={() => (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de Adquisición
                    </label>
                    <select
                      value={historiaFormulario.titulo}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          titulo: e.target.value,
                          tituloOtro:
                            e.target.value === "otro"
                              ? historiaFormulario.tituloOtro
                              : "",
                          // Limpiar campos de causante si no es sucesión
                          nombreCausante:
                            e.target.value === "sucesion"
                              ? historiaFormulario.nombreCausante
                              : "",
                          causanteAdquiridoDe:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteAdquiridoDe
                              : "",
                          causanteTitulo:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteTitulo
                              : "",
                          causanteTituloOtro:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteTituloOtro
                              : "",
                          causanteFechaOtorgamiento:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteFechaOtorgamiento
                              : "",
                          causanteNumeroNotaria:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteNumeroNotaria
                              : "",
                          causanteCantonNotaria:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteCantonNotaria
                              : "",
                          causanteNotario:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteNotario
                              : "",
                          causanteFechaInscripcion:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteFechaInscripcion
                              : "",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione el título</option>
                      <option value="compraventa">Compraventa</option>
                      <option value="donacion">Donación</option>
                      <option value="sucesion">
                        Sucesión a Causa de Muerte
                      </option>
                      <option value="permuta">Permuta</option>
                      <option value="particion">
                        Partición y Adjudicación
                      </option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {historiaFormulario.titulo === "otro" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especifique el título
                      </label>
                      <input
                        type="text"
                        value={historiaFormulario.tituloOtro}
                        onChange={(e) =>
                          setHistoriaFormulario({
                            ...historiaFormulario,
                            tituloOtro: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Adjudicación judicial"
                      />
                    </div>
                  )}

                  {/* SI ES SUCESIÓN - Tipo de Sucesión */}
                  {historiaFormulario.titulo === "sucesion" && (
                    <div className="col-span-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Sucesión
                          </label>
                          <select
                            value={historiaFormulario.tipoSucesion}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                tipoSucesion: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">
                              Seleccione tipo de sucesión
                            </option>
                            <option value="testamento">Testamento</option>
                            <option value="posesion_efectiva">
                              Posesión Efectiva
                            </option>
                          </select>
                        </div>

                        <h4 className="font-semibold text-blue-900 pt-3 border-t border-blue-300">
                          Datos del Causante / Causantes
                        </h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre completo del Causante / los Causantes (de
                            quien heredaron)
                          </label>
                          <input
                            type="text"
                            value={historiaFormulario.nombreCausante}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                nombreCausante: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                            placeholder="Ej: JUAN CARLOS PÉREZ LÓPEZ"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SI NO ES SUCESIÓN - Campo "Adquirido de" */}
                  {historiaFormulario.titulo &&
                    historiaFormulario.titulo !== "sucesion" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adquirido de
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.adquiridoDe}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              adquiridoDe: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: los cónyuges CECILIA IZURIETA y HUGO HURTADO"
                        />
                      </div>
                    )}

                  {historiaPartesAdicionales.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje adquirido en esta parte
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={historiaFormulario.porcentaje}
                        onChange={(e) =>
                          handleHistoriaFieldChange(
                            "porcentaje",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 50"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Otorgamiento
                    </label>
                    <input
                      type="date"
                      value={historiaFormulario.fechaOtorgamiento}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "fechaOtorgamiento",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Notaría
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.numeroNotaria}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "numeroNotaria",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: primera, 14, 22"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se convertirá automáticamente (14 → Décimo Cuarta)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de la Notaría
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.cantonNotaria}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "cantonNotaria",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notario/Notaria
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.notario}
                      onChange={(e) =>
                        handleHistoriaFieldChange("notario", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Alex David Mejía Viteri"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Escriba el nombre normal (puede incluir "Doctor/a", se
                      quita automáticamente).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género del Notario
                    </label>
                    <select
                      value={historiaFormulario.generoNotario || ""}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "generoNotario",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={historiaFormulario.esSuplente || false}
                        onChange={(e) =>
                          setHistoriaFormulario({
                            ...historiaFormulario,
                            esSuplente: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        El notario es suplente
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inscripción
                    </label>
                    <input
                      type="date"
                      value={historiaFormulario.fechaInscripcion}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "fechaInscripcion",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de Inscripción
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.cantonInscripcion}
                      onChange={(e) =>
                        handleHistoriaFieldChange(
                          "cantonInscripcion",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si es igual al cantón de la notaría, se mostrará "del
                      mismo cantón"
                    </p>
                  </div>
                </div>

                {/* ADQUISICIÓN DEL CAUSANTE (solo si es sucesión) */}
                {historiaFormulario.titulo === "sucesion" && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-3">
                      Adquisición del Causante
                    </h4>
                    <p className="text-sm text-amber-700 mb-4">
                      Datos de cómo el causante adquirió originalmente el
                      inmueble
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          El causante lo adquirió de
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteAdquiridoDe}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteAdquiridoDe: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: los señores MARÍA LÓPEZ y PEDRO SÁNCHEZ"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título de Adquisición del Causante
                        </label>
                        <select
                          value={historiaFormulario.causanteTitulo}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteTitulo: e.target.value,
                              causanteTituloOtro:
                                e.target.value === "otro"
                                  ? historiaFormulario.causanteTituloOtro
                                  : "",
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccione el título</option>
                          <option value="compraventa">Compraventa</option>
                          <option value="donacion">Donación</option>
                          <option value="permuta">Permuta</option>
                          <option value="particion">
                            Partición y Adjudicación
                          </option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>

                      {historiaFormulario.causanteTitulo === "otro" && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Especifique el título
                          </label>
                          <input
                            type="text"
                            value={historiaFormulario.causanteTituloOtro}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                causanteTituloOtro: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Ej: Adjudicación judicial"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Otorgamiento
                        </label>
                        <input
                          type="date"
                          value={historiaFormulario.causanteFechaOtorgamiento}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteFechaOtorgamiento: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Notaría
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteNumeroNotaria}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteNumeroNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: primera, 14, 22"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se convertirá automáticamente
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de la Notaría
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteCantonNotaria}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteCantonNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notario/Notaria
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteNotario}
                          onChange={(e) =>
                            handleHistoriaFieldChange(
                              "causanteNotario",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Roberto Dueñas"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Escriba el nombre normal (puede incluir "Doctor/a", se
                          quita automáticamente).
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Género del Notario
                        </label>
                        <select
                          value={historiaFormulario.causanteGeneroNotario || ""}
                          onChange={(e) =>
                            handleHistoriaFieldChange(
                              "causanteGeneroNotario",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccione</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              historiaFormulario.causanteEsSuplente || false
                            }
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                causanteEsSuplente: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span className="text-sm text-gray-700">
                            El notario es suplente
                          </span>
                        </label>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Inscripción
                        </label>
                        <input
                          type="date"
                          value={historiaFormulario.causanteFechaInscripcion}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteFechaInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de Inscripción
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteCantonInscripcion}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteCantonInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si es igual, se mostrará "del mismo cantón"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NUEVO: ACLARATORIAS */}
                {historiaFormulario.aclaratorias.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Aclaratorias</h4>
                    {historiaFormulario.aclaratorias.map(
                      (aclaratoria, index) => (
                        <AclaratoriaHistoriaItem
                          key={aclaratoria.id}
                          aclaratoria={aclaratoria}
                          path={[index]}
                          onChange={handleAclaratoriaHistoriaChange}
                          onEliminar={handleEliminarAclaratoriaHistoria}
                          onAgregar={handleAgregarAclaratoriaHistoria}
                          rootAclaratorias={historiaFormulario.aclaratorias}
                        />
                      ),
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleAgregarAclaratoriaHistoria()}
                  className="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                >
                  + Agregar Aclaratoria
                </button>

                {/* NUEVO: Partes adicionales de adquisición */}
                {historiaPartesAdicionales.length > 0 && (
                  <div className="space-y-6 border-t-2 border-amber-200 pt-6 mt-2">
                    {(() => {
                      const totalPorcentaje =
                        (parseFloat(historiaFormulario.porcentaje) || 0) +
                        historiaPartesAdicionales.reduce(
                          (acc, p) => acc + (parseFloat(p.porcentaje) || 0),
                          0,
                        );
                      const cuadra = Math.abs(totalPorcentaje - 100) < 0.01;
                      return (
                        <div
                          className={`p-3 rounded-lg border text-sm font-medium ${
                            cuadra
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          Total adquirido entre todas las partes:{" "}
                          {totalPorcentaje}%{" "}
                          {cuadra ? "✓" : "⚠️ debería sumar 100%"}
                        </div>
                      );
                    })()}

                    {historiaPartesAdicionales.map((parte, index) => (
                      <HistoriaParteForm
                        key={parte.id}
                        parte={parte}
                        index={index}
                        onFieldChange={handleParteHistoriaFieldChange}
                        onEliminar={handleEliminarParteHistoria}
                        onAgregarAclaratoria={
                          handleAgregarAclaratoriaParteHistoria
                        }
                        onEliminarAclaratoria={
                          handleEliminarAclaratoriaParteHistoria
                        }
                        onAclaratoriaChange={
                          handleAclaratoriaParteHistoriaChange
                        }
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAgregarParteHistoria}
                  className="w-full px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium border border-amber-300"
                >
                  + Agregar Otra Parte de Adquisición
                </button>
                <p className="text-xs text-gray-500 -mt-2">
                  Use esto solo si la propiedad se adquirió en más de una
                  transacción (ej. 50% de una manera y 50% de otra).
                </p>
              </div>
            )}
          />
        )}

        {/* 9. DECLARATORIA DE PROPIEDAD HORIZONTAL */}
        {tipoPropiedad === "horizontal" && (
          <SeccionFormularioRedactar
            titulo="DECLARATORIA DE PROPIEDAD HORIZONTAL"
            onTextoManualChange={setDeclaratoriaManual}
            placeholderTexto="Escriba aquí la declaratoria de propiedad horizontal..."
            renderFormulario={() => (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Otorgamiento
                    </label>
                    <input
                      type="date"
                      value={declaratoriaFormulario.fechaOtorgamiento}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "fechaOtorgamiento",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Notaría
                    </label>
                    <input
                      type="text"
                      value={declaratoriaFormulario.numeroNotaria}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "numeroNotaria",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: primera, 14, 22"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se convertirá automáticamente (22 → Vigésimo Segunda)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de la Notaría
                    </label>
                    <input
                      type="text"
                      value={declaratoriaFormulario.cantonNotaria}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "cantonNotaria",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notario/Notaria
                    </label>
                    <input
                      type="text"
                      value={declaratoriaFormulario.notario}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange("notario", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Paola Andrade Torres"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Escriba el nombre normal (puede incluir "Doctor/a", se
                      quita automáticamente).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género del Notario
                    </label>
                    <select
                      value={declaratoriaFormulario.generoNotario || ""}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "generoNotario",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declaratoriaFormulario.esSuplente || false}
                        onChange={(e) =>
                          setDeclaratoriaFormulario({
                            ...declaratoriaFormulario,
                            esSuplente: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        El notario es suplente
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inscripción
                    </label>
                    <input
                      type="date"
                      value={declaratoriaFormulario.fechaInscripcion}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "fechaInscripcion",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de Inscripción
                    </label>
                    <input
                      type="text"
                      value={declaratoriaFormulario.cantonInscripcion}
                      onChange={(e) =>
                        handleDeclaratoriaFieldChange(
                          "cantonInscripcion",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si es igual al cantón de la notaría, se mostrará "del
                      mismo cantón"
                    </p>
                  </div>
                </div>

                {/* NUEVO: ACLARATORIAS */}
                {declaratoriaFormulario.aclaratorias.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Aclaratorias</h4>
                    {declaratoriaFormulario.aclaratorias.map(
                      (aclaratoria, index) => (
                        <AclaratoriaDeclaratoriaItem
                          key={aclaratoria.id}
                          aclaratoria={aclaratoria}
                          path={[index]}
                          onChange={handleAclaratoriaDeclaratoriaChange}
                          onEliminar={handleEliminarAclaratoriaDeclaratoria}
                          onAgregar={handleAgregarAclaratoriaDeclaratoria}
                          rootAclaratorias={declaratoriaFormulario.aclaratorias}
                        />
                      ),
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleAgregarAclaratoriaDeclaratoria()}
                  className="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                >
                  + Agregar Aclaratoria
                </button>
              </div>
            )}
          />
        )}

        {/* Continúa con Linderos en la siguiente parte... */}
        {/* 10. LINDEROS GENERALES */}
        {tipoPropiedad && (
          <>
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                LINDEROS GENERALES
              </h3>
            </div>

            <Card>
              <div className="space-y-6">
                {/* NORTE */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Norte
                    </label>
                    <button
                      onClick={() => handleAgregarLindero("norte")}
                      className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                    >
                      + Agregar lindero norte
                    </button>
                  </div>
                  {linderosGenerales.norte.map((lindero, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <input
                          type="text"
                          value={lindero.metros}
                          onChange={(e) =>
                            handleLinderoChange(
                              "norte",
                              index,
                              "metros",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Metros (ej: 37.84)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lindero.colindancia}
                          onChange={(e) =>
                            handleLinderoChange(
                              "norte",
                              index,
                              "colindancia",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Colindancia (ej: con propiedad del señor...)"
                        />
                        {linderosGenerales.norte.length > 1 && (
                          <button
                            onClick={() =>
                              handleEliminarLindero("norte", index)
                            }
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SUR */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sur
                    </label>
                    <button
                      onClick={() => handleAgregarLindero("sur")}
                      className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                    >
                      + Agregar lindero sur
                    </button>
                  </div>
                  {linderosGenerales.sur.map((lindero, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <input
                          type="text"
                          value={lindero.metros}
                          onChange={(e) =>
                            handleLinderoChange(
                              "sur",
                              index,
                              "metros",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Metros"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lindero.colindancia}
                          onChange={(e) =>
                            handleLinderoChange(
                              "sur",
                              index,
                              "colindancia",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Colindancia"
                        />
                        {linderosGenerales.sur.length > 1 && (
                          <button
                            onClick={() => handleEliminarLindero("sur", index)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ESTE */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Este
                    </label>
                    <button
                      onClick={() => handleAgregarLindero("este")}
                      className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                    >
                      + Agregar lindero este
                    </button>
                  </div>
                  {linderosGenerales.este.map((lindero, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <input
                          type="text"
                          value={lindero.metros}
                          onChange={(e) =>
                            handleLinderoChange(
                              "este",
                              index,
                              "metros",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Metros"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lindero.colindancia}
                          onChange={(e) =>
                            handleLinderoChange(
                              "este",
                              index,
                              "colindancia",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Colindancia"
                        />
                        {linderosGenerales.este.length > 1 && (
                          <button
                            onClick={() => handleEliminarLindero("este", index)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* OESTE */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Oeste
                    </label>
                    <button
                      onClick={() => handleAgregarLindero("oeste")}
                      className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                    >
                      + Agregar lindero oeste
                    </button>
                  </div>
                  {linderosGenerales.oeste.map((lindero, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <input
                          type="text"
                          value={lindero.metros}
                          onChange={(e) =>
                            handleLinderoChange(
                              "oeste",
                              index,
                              "metros",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Metros"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lindero.colindancia}
                          onChange={(e) =>
                            handleLinderoChange(
                              "oeste",
                              index,
                              "colindancia",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Colindancia"
                        />
                        {linderosGenerales.oeste.length > 1 && (
                          <button
                            onClick={() =>
                              handleEliminarLindero("oeste", index)
                            }
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Superficie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie Total
                  </label>
                  <input
                    type="text"
                    value={linderosGenerales.superficie}
                    onChange={(e) =>
                      setLinderosGenerales({
                        ...linderosGenerales,
                        superficie: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 1000.44"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    En metros cuadrados y decímetros cuadrados
                  </p>
                </div>
              </div>
            </Card>

            {/* LINDEROS ESPECÍFICOS - SOLO PARA HORIZONTAL */}
            {tipoPropiedad === "horizontal" && (
              <Card title="Linderos Específicos (Opcional)">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={tieneLInderosEspecificos}
                    onChange={(e) =>
                      setTieneLInderosEspecificos(e.target.checked)
                    }
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ¿Los inmuebles tienen linderos específicos diferentes a los
                    generales?
                  </span>
                </label>

                {tieneLInderosEspecificos && (
                  <div className="space-y-6 border-t pt-4">
                    {/* NORTE */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Norte
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("norte", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero norte
                        </button>
                      </div>
                      {linderosEspecificos.norte.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "norte",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "norte",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Colindancia"
                            />
                            {linderosEspecificos.norte.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("norte", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* SUR */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Sur
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("sur", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero sur
                        </button>
                      </div>
                      {linderosEspecificos.sur.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "sur",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "sur",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Colindancia"
                            />
                            {linderosEspecificos.sur.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("sur", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ESTE */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Este
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("este", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero este
                        </button>
                      </div>
                      {linderosEspecificos.este.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "este",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "este",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Colindancia"
                            />
                            {linderosEspecificos.este.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("este", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* OESTE */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Oeste
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("oeste", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero oeste
                        </button>
                      </div>
                      {linderosEspecificos.oeste.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "oeste",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "oeste",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Colindancia"
                            />
                            {linderosEspecificos.oeste.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("oeste", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ARRIBA - NUEVO */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Arriba
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("arriba", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero arriba
                        </button>
                      </div>
                      {linderosEspecificos.arriba.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "arriba",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "arriba",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Ej: con losa del departamento superior"
                            />
                            {linderosEspecificos.arriba.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("arriba", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ABAJO - NUEVO */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Abajo
                        </label>
                        <button
                          onClick={() => handleAgregarLindero("abajo", true)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero abajo
                        </button>
                      </div>
                      {linderosEspecificos.abajo.map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <div>
                            <input
                              type="text"
                              value={lindero.metros}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "abajo",
                                  index,
                                  "metros",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Metros"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  "abajo",
                                  index,
                                  "colindancia",
                                  e.target.value,
                                  true,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Ej: con contrapiso del departamento inferior"
                            />
                            {linderosEspecificos.abajo.length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero("abajo", index, true)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Superficie específica */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Superficie Específica
                      </label>
                      <input
                        type="text"
                        value={linderosEspecificos.superficie}
                        onChange={(e) =>
                          setLinderosEspecificos({
                            ...linderosEspecificos,
                            superficie: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 85.50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Superficie específica del inmueble (si difiere de la
                        general)
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* Continúa con Objeto del Contrato, Precio, etc. en la siguiente parte... */}
        {/* 11. OBJETO DEL CONTRATO */}
        {tipoPropiedad && (
          <>
            <div className="border-t-4 border-primary-500 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  OBJETO DEL CONTRATO
                </h2>
                <Button
                  variant={modoSujeto === "manual" ? "primary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setModoSujeto(modoSujeto === "auto" ? "manual" : "auto")
                  }
                >
                  {modoSujeto === "auto"
                    ? "Redactar Manualmente"
                    : "Usar Datos del Formulario"}
                </Button>
              </div>
            </div>

            {modoSujeto === "manual" ? (
              <Card>
                <p className="text-sm text-gray-600 mb-3">
                  Redacte manualmente el objeto del contrato:
                </p>
                <RichTextEditor
                  onChange={setSujetoManual}
                  placeholder="Escriba aquí el objeto del contrato..."
                  minHeight="12rem"
                />
              </Card>
            ) : (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">ℹ️</div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      El objeto del contrato se generará automáticamente
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Se usarán los datos de vendedores, compradores y bienes
                      que ingresó arriba. Si necesita personalizar el texto, use
                      el botón "Redactar Manualmente".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 12. PRECIO Y FORMA DE PAGO */}
        {tipoPropiedad && (
          <>
            <div className="border-t-4 border-primary-500 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  PRECIO Y FORMA DE PAGO
                </h2>
                <Button
                  variant={modoPrecio === "manual" ? "primary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setModoPrecio(
                      modoPrecio === "formulario" ? "manual" : "formulario",
                    )
                  }
                >
                  {modoPrecio === "formulario"
                    ? "✏️ Redactar Manualmente"
                    : "📋 Usar Formulario"}
                </Button>
              </div>
            </div>

            {modoPrecio === "manual" ? (
              <Card>
                <p className="text-sm text-gray-600 mb-3">
                  Redacte manualmente la cláusula de precio y forma de pago:
                </p>
                <RichTextEditor
                  onChange={setPrecioManual}
                  placeholder="Escriba aquí la cláusula de precio y forma de pago..."
                  minHeight="16rem"
                />
              </Card>
            ) : (
              <>
                {/* PRECIO TOTAL */}
                <Card title="Precio Total">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-700">$</span>
                    <input
                      type="number"
                      value={precioTotal}
                      onChange={(e) => setPrecioTotal(e.target.value)}
                      className="flex-1 text-2xl font-bold px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="340000"
                      step="0.01"
                    />
                    <span className="text-lg text-gray-600">USD</span>
                  </div>
                </Card>

                {/* PARTES DE PAGO */}
                <Card title="Forma de Pago">
                  <div className="space-y-6">
                    {partesPago.map((parte) => (
                      <div
                        key={parte.id}
                        className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50"
                      >
                        {/* Header de la parte */}
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">
                            Parte {parte.letra})
                          </h3>
                          {partesPago.length > 1 && (
                            <button
                              onClick={() => handleEliminarPartePago(parte.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Monto */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monto de esta parte
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-700">
                                $
                              </span>
                              <input
                                type="number"
                                value={parte.monto}
                                onChange={(e) =>
                                  handlePartePagoChange(
                                    parte.id,
                                    "monto",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="70000"
                                step="0.01"
                              />
                            </div>
                          </div>

                          {/* Tipo de Pago */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de Pago
                            </label>
                            <select
                              value={parte.tipoPago}
                              onChange={(e) =>
                                handlePartePagoChange(
                                  parte.id,
                                  "tipoPago",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="unico">Pago Único</option>
                              <option value="cuotas">
                                Pago en Cuotas Iguales
                              </option>
                            </select>
                          </div>

                          {/* SI ES PAGO ÚNICO */}
                          {parte.tipoPago === "unico" && (
                            <>
                              {/* Medio de Pago */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Medio de Pago
                                </label>
                                <select
                                  value={parte.medioPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "medioPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione medio de pago
                                  </option>
                                  <option value="transferencia">
                                    Transferencia Bancaria
                                  </option>
                                  <option value="deposito">
                                    Depósito Bancario
                                  </option>
                                  <option value="cheque">Cheque</option>
                                  <option value="efectivo">Efectivo</option>
                                </select>
                              </div>

                              {/* NUEVO: Detalle de Transferencia */}
                              {parte.medioPago === "transferencia" && (
                                <div className="border-t pt-4 mt-4">
                                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                      type="checkbox"
                                      checked={parte.tieneDetalle}
                                      onChange={(e) =>
                                        handlePartePagoChange(
                                          parte.id,
                                          "tieneDetalle",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      ¿Agregar detalle de transferencia?
                                    </span>
                                  </label>

                                  {parte.tieneDetalle && (
                                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de origen
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Pichincha"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cuenta de origen
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 2100123456"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de origen
                                        </label>
                                        <select
                                          value={parte.detalle.tipoCuentaOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Guayaquil"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cuenta de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 3200654321"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de destino
                                        </label>
                                        <select
                                          value={
                                            parte.detalle.tipoCuentaDestino
                                          }
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* NUEVO: Detalle de Depósito */}
                              {parte.medioPago === "deposito" && (
                                <div className="border-t pt-4 mt-4">
                                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                      type="checkbox"
                                      checked={parte.tieneDetalle}
                                      onChange={(e) =>
                                        handlePartePagoChange(
                                          parte.id,
                                          "tieneDetalle",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      ¿Agregar detalle de depósito?
                                    </span>
                                  </label>

                                  {parte.tieneDetalle && (
                                    <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Pacífico"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Número de cuenta de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 4500987654"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de destino
                                        </label>
                                        <select
                                          value={
                                            parte.detalle.tipoCuentaDestino
                                          }
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Si es Cheque - Tipo de Cheque */}
                              {parte.medioPago === "cheque" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Cheque
                                  </label>
                                  <select
                                    value={parte.tipoCheque}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "tipoCheque",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleccione tipo</option>
                                    <option value="certificado">
                                      Cheque Certificado
                                    </option>
                                    <option value="gerencia">
                                      Cheque de Gerencia
                                    </option>
                                    <option value="vista">
                                      Cheque a la Vista
                                    </option>
                                  </select>
                                </div>
                              )}

                              {/* Momento de Pago */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Momento de Pago
                                </label>
                                <select
                                  value={parte.momentoPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "momentoPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">Seleccione momento</option>
                                  <option value="ya_pagado">
                                    Ya pagado (en forma previa)
                                  </option>
                                  <option value="al_firmar">
                                    Al momento de la firma
                                  </option>
                                  <option value="despues_inscribir">
                                    Después de inscribir en Registro
                                  </option>
                                  <option value="otro">
                                    Otro (especificar)
                                  </option>
                                </select>
                              </div>

                              {/* Si es Otro momento */}
                              {parte.momentoPago === "otro" && (
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={parte.momentoEsFecha || false}
                                      onChange={(e) =>
                                        handlePartePagoChange(
                                          parte.id,
                                          "momentoEsFecha",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">
                                      Es una fecha específica
                                    </span>
                                  </label>

                                  {parte.momentoEsFecha ? (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de pago
                                      </label>
                                      <input
                                        type="date"
                                        value={parte.momentoOtro}
                                        onChange={(e) =>
                                          handlePartePagoChange(
                                            parte.id,
                                            "momentoOtro",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Se convertirá automáticamente a letras
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Especifique el momento de pago
                                      </label>
                                      <input
                                        type="text"
                                        value={parte.momentoOtro}
                                        onChange={(e) =>
                                          handlePartePagoChange(
                                            parte.id,
                                            "momentoOtro",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Ej: dentro de 30 días hábiles"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* SI ES PAGO EN CUOTAS */}
                          {parte.tipoPago === "cuotas" && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de Cuotas
                                  </label>
                                  <input
                                    type="number"
                                    value={parte.numeroCuotas}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "numeroCuotas",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="6"
                                    min="1"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor por Cuota (auto-calculado)
                                  </label>
                                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                                    <span className="font-bold text-gray-700">
                                      $
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {parte.valorCuota
                                        ? parte.valorCuota.toFixed(2)
                                        : "0.00"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Periodicidad
                                </label>
                                <select
                                  value={parte.periodicidad}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "periodicidad",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione periodicidad
                                  </option>
                                  <option value="mensual">Mensual</option>
                                  <option value="trimestral">Trimestral</option>
                                  <option value="semestral">Semestral</option>
                                  <option value="anual">Anual</option>
                                  <option value="otro">
                                    Otro (especificar)
                                  </option>
                                </select>
                              </div>

                              {parte.periodicidad === "otro" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Especifique la periodicidad
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.periodicidadOtra}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "periodicidadOtra",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ej: cada 45 días"
                                  />
                                </div>
                              )}

                              {/* Medio de Pago para cuotas */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Medio de Pago
                                </label>
                                <select
                                  value={parte.medioPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "medioPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione medio de pago
                                  </option>
                                  <option value="transferencia">
                                    Transferencia Bancaria
                                  </option>
                                  <option value="deposito">
                                    Depósito Bancario
                                  </option>
                                  <option value="cheque">Cheque</option>
                                  <option value="efectivo">Efectivo</option>
                                </select>
                              </div>

                              {/* Si es Cheque - Tipo */}
                              {parte.medioPago === "cheque" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Cheque
                                  </label>
                                  <select
                                    value={parte.tipoCheque}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "tipoCheque",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleccione tipo</option>
                                    <option value="certificado">
                                      Cheque Certificado
                                    </option>
                                    <option value="gerencia">
                                      Cheque de Gerencia
                                    </option>
                                    <option value="vista">
                                      Cheque a la Vista
                                    </option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}

                          {/* CRÉDITO BANCARIO (aplica para ambos tipos) */}
                          <div className="border-t pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={parte.esCreditoBancario}
                                onChange={(e) =>
                                  handlePartePagoChange(
                                    parte.id,
                                    "esCreditoBancario",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Proviene de crédito bancario
                              </span>
                            </label>

                            {parte.esCreditoBancario && (
                              <div className="mt-3 space-y-3 pl-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Banco
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.nombreBanco}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "nombreBanco",
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                                    placeholder="Ej: BANCO DEL PACÍFICO"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cuenta Destino
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.cuentaDestino}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "cuentaDestino",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ej: a la cuenta que determinen los VENDEDORES"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Resumen y botón agregar */}
                    <div className="border-t-2 border-gray-300 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Precio Total: ${precioTotal || "0"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total asignado: $
                            {partesPago
                              .reduce(
                                (sum, p) => sum + (parseFloat(p.monto) || 0),
                                0,
                              )
                              .toFixed(2)}
                          </p>
                          <p
                            className={`text-lg font-bold ${calcularSaldoRestante() === 0 ? "text-green-600" : "text-orange-600"}`}
                          >
                            Saldo restante: $
                            {calcularSaldoRestante().toFixed(2)}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAgregarPartePago}
                        >
                          + Agregar Parte de Pago
                        </Button>
                      </div>

                      {calcularSaldoRestante() !== 0 && precioTotal && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ La suma de las partes debe ser igual al precio
                            total
                          </p>
                        </div>
                      )}

                      {calcularSaldoRestante() === 0 && precioTotal && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ La suma de las partes coincide con el precio
                            total
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {/* 13. ADMINISTRADOR */}
        {tipoPropiedad === "horizontal" && (
          <Card title="Administrador del Condominio">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hayAdministrador}
                onChange={(e) => setHayAdministrador(e.target.checked)}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                ¿El condominio tiene administrador nombrado?
              </span>
            </label>

            {!hayAdministrador && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Se incluirá en la minuta la declaración juramentada de que
                  no existe administrador nombrado
                </p>
              </div>
            )}

            {hayAdministrador && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Si existe administrador, NO se incluirá la cláusula de
                  declaración
                </p>
              </div>
            )}
          </Card>
        )}

        {/* 14. DATOS DEL ABOGADO */}
        <div className="border-t-4 border-primary-500 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            DATOS DEL ABOGADO
          </h2>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo del Abogado
              </label>
              <input
                type="text"
                value={abogado.nombre}
                onChange={(e) =>
                  setAbogado({
                    ...abogado,
                    nombre: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                placeholder="Ej: MARIELA VERA SOSA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Matrícula
                </label>
                <select
                  value={abogado.tipoMatricula}
                  onChange={(e) =>
                    setAbogado({ ...abogado, tipoMatricula: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cj">Consejo de la Judicatura</option>
                  <option value="colegio">Colegio de Abogados</option>
                </select>
              </div>

              {abogado.tipoMatricula === "colegio" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia del Colegio
                  </label>
                  <input
                    type="text"
                    value={abogado.provincia}
                    onChange={(e) =>
                      setAbogado({ ...abogado, provincia: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Pichincha"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Matrícula
              </label>
              <input
                type="text"
                value={abogado.numeroMatricula}
                onChange={(e) =>
                  setAbogado({ ...abogado, numeroMatricula: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: 17-2023-1717"
              />
            </div>
          </div>
        </Card>

        {/* BOTONES FINALES */}
        <div className="flex justify-between items-center pt-6 pb-12">
          <button
            onClick={() => setModalPlantillaAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {borrador ? "Guardar borrador" : "Guardar como borrador"}
          </button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerarMinuta}
            disabled={loading}
          >
            {loading ? "Generando..." : "Generar Minuta"}
          </Button>
        </div>
      </div>

      {/* MODAL GUARDAR PLANTILLA */}
      <ModalGuardarPlantilla
        abierto={modalPlantillaAbierto}
        onCerrar={() => setModalPlantillaAbierto(false)}
        onGuardado={(data) => {
          setModalPlantillaAbierto(false);
          setBorrador({
            id: data.id,
            codigo: data.codigo,
            nombre: data.nombre,
          });
          toast.success(`Borrador ${data.codigo} guardado`);
        }}
        borrador={borrador}
        tipoDocumento="minuta"
        tipoContrato="compraventa"
        nombreVendedor={(() => {
          const v = vendedores[0];
          if (!v) return "";
          if (v.esEmpresa) return v.razonSocial || "";
          return (
            [v.nombres, v.apellidos].filter(Boolean).join(" ") ||
            v.nombreCompleto ||
            ""
          );
        })()}
        contenido={{
          vendedores,
          compradores,
          tipoPropiedad,
          nombreConjunto,
          predios,
          ubicacion,
          modoHistoria,
          historiaManual,
          historiaFormulario,
          historiaPartesAdicionales,
          modoDeclaratoria,
          declaratoriaManual,
          declaratoriaFormulario,
          linderosGenerales,
          tieneLInderosEspecificos,
          linderosEspecificos,
          modoSujeto,
          sujetoManual,
          precioTotal,
          modoPrecio,
          precioManual,
          partesPago,
          hayAdministrador,
          abogado,
        }}
      />
    </div>
  );
};

export default FormularioCompraventa;
