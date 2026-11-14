"""
Llena la base del servidor de DESARROLLO con comparecientes y empresas ficticias.

Usa la misma lógica que el formulario interno (validaciones, declaración UAFE
y registro del envío), así que los datos quedan igual que si los hubiera
ingresado la notaría. Las cédulas y RUC son válidos en formato pero inventados.

Solo corre si el .env tiene ENTORNO=desarrollo: en producción se niega.

Uso (en el msi-server):
    docker compose exec backend python scripts/datos_prueba.py --personas 40 --empresas 10
Opciones:
    --semilla N   mismos datos cada vez (útil para repetir una prueba)
"""
import argparse
import os
import random
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings  # noqa: E402
from app.database import SessionLocal  # noqa: E402
import app.models  # noqa: E402,F401  (registra todos los modelos)
from app.models.enums import OrigenDeclaracion  # noqa: E402
from app.models.system_user import SystemUser  # noqa: E402
from app.routes.registration import _procesar  # noqa: E402
from app.services import comparecientes as svc  # noqa: E402

NOMBRES_M = ["JUAN CARLOS", "LUIS ALBERTO", "JORGE", "DIEGO FERNANDO", "ANDRÉS", "PABLO",
             "MIGUEL ÁNGEL", "SANTIAGO", "FERNANDO", "DAVID", "MARCO VINICIO", "ESTEBAN"]
NOMBRES_F = ["MARÍA JOSÉ", "ANA LUCÍA", "GABRIELA", "DANIELA", "VERÓNICA", "PAOLA",
             "CRISTINA", "SOFÍA", "CAROLINA", "LORENA", "FERNANDA", "XIMENA"]
APELLIDOS = ["ANDRADE", "BENÍTEZ", "CEVALLOS", "DÁVILA", "ESPINOSA", "FLORES", "GUERRERO",
             "HIDALGO", "JARAMILLO", "LÓPEZ", "MOREIRA", "NARVÁEZ", "ORTIZ", "PAREDES",
             "QUIROGA", "ROMERO", "SALAZAR", "TORRES", "VALENCIA", "ZAMBRANO"]
UBICACIONES = [
    ("Pichincha", "Quito", ["Iñaquito", "Cumbayá", "Conocoto", "La Magdalena", "Kennedy"], "17"),
    ("Guayas", "Guayaquil", ["Tarqui", "Ximena", "Febres Cordero"], "09"),
    ("Azuay", "Cuenca", ["El Sagrario", "Totoracocha", "Yanuncay"], "01"),
    ("Imbabura", "Ibarra", ["San Francisco", "Caranqui"], "10"),
    ("Tungurahua", "Ambato", ["Huachi Chico", "La Matriz"], "18"),
]
CALLES = ["Av. Amazonas", "Av. 10 de Agosto", "Av. de los Shyris", "Calle Juan León Mera",
          "Av. 6 de Diciembre", "Calle García Moreno", "Av. 9 de Octubre", "Calle Bolívar",
          "Av. Remigio Crespo", "Calle Sucre", "Av. Atahualpa", "Calle 24 de Mayo"]
REFERENCIAS = [None, None, None, "frente al parque", "junto a la farmacia", "edificio Torres del Norte, dpto. 3B",
               "atrás del colegio", "casa esquinera color blanco"]
OCUPACIONES = ["Comerciante", "Empleado privado", "Docente", "Médico", "Abogado", "Ingeniera civil",
               "Contadora", "Arquitecto", "Jubilado", "Agricultor"]
ACTIVIDADES = ["empleado", "independiente", "comerciante", "empresario", "jubilado", "profesional_autonomo",
               "funcionario_publico"]
ORIGENES = ["Ahorro", "Sueldo", "Crédito hipotecario del Banco Pichincha",
            "Venta de propiedad (casa en Conocoto)", "Herencia", "Utilidades del negocio"]
EMPRESAS = ["CONSTRUCTORA ANDINA", "INMOBILIARIA LOS VALLES", "COMERCIAL EL ROBLE", "AGRÍCOLA SAN JOSÉ",
            "TECNOLOGÍA DEL PACÍFICO", "SERVICIOS INTEGRALES QUITO", "IMPORTADORA DEL SUR",
            "TRANSPORTES ECUATORIANOS", "INVERSIONES MONTECRISTI", "DISTRIBUIDORA CENTRAL"]


def cedula(provincia: str) -> str:
    """Cédula con dígito verificador válido (módulo 10)."""
    base = provincia + str(random.randint(0, 5)) + "".join(str(random.randint(0, 9)) for _ in range(6))
    total = 0
    for i, d in enumerate(base):
        n = int(d) * (2 if i % 2 == 0 else 1)
        total += n - 9 if n > 9 else n
    return base + str((10 - total % 10) % 10)


def ruc_sociedad(provincia: str) -> str:
    return provincia + "9" + "".join(str(random.randint(0, 9)) for _ in range(7)) + "001"


def fecha_nacimiento(desde=25, hasta=75) -> str:
    return (date.today() - timedelta(days=random.randint(desde * 365, hasta * 365))).isoformat()


def numero_casa() -> str:
    return random.choice([
        f"{random.choice('NSEO')}{random.randint(1, 80)}-{random.randint(1, 300)}",
        f"OE{random.randint(1, 12)}-{random.randint(10, 250)}",
        str(random.randint(100, 2500)),
        "S/N",
    ])


def direccion(prefijo=""):
    provincia, canton, parroquias, cod = random.choice(UBICACIONES)
    principal, secundaria = random.sample(CALLES, 2)
    return cod, {
        f"{prefijo}province": provincia,
        f"{prefijo}canton": canton,
        f"{prefijo}parroquia": random.choice(parroquias + [None]),
        f"{prefijo}sector": random.choice([None, "La Carolina", "El Batán", "Centro", "Urdesa"]),
        f"{prefijo}main_street": principal,
        f"{prefijo}secondary_street": secundaria,
        f"{prefijo}number_street": numero_casa(),
        f"{prefijo}referencia": random.choice(REFERENCIAS),
    }


def patrimonio(completo=False):
    inmuebles = [{"tipo": random.choice(["casa", "departamento", "terreno", "oficina"]),
                  "ciudad": random.choice(["Quito", "Guayaquil", "Cuenca"]), "especificar": "",
                  "valor": str(random.randint(40, 400) * 1000)} for _ in range(random.randint(0, 2))]
    vehiculos = [{"marca": random.choice(["Toyota", "Chevrolet", "Kia", "Hyundai"]),
                  "modelo": random.choice(["Fortuner", "Sail", "Sportage", "Tucson"]),
                  "placa": f"P{random.choice('ABCDE')}C-{random.randint(1000, 9999)}",
                  "valor": str(random.randint(12, 60) * 1000)} for _ in range(random.randint(0, 2))]
    acciones = [{"entidad": random.choice(EMPRESAS) + " S.A.", "monto": str(random.randint(5, 80) * 1000)}
                for _ in range(random.randint(0, 1))]
    inversiones = random.choice([[], [{"descripcion": "Póliza a plazo fijo en Banco Pichincha por USD 15.000"}],
                                 [{"descripcion": "Fondo de acumulación en Fondos Pichincha"},
                                  {"descripcion": "Fideicomiso inmobiliario Torres del Sol"}]])
    if not completo and random.random() < 0.4:
        return None
    return {
        "inmuebles": inmuebles, "no_posee_inmuebles": completo and not inmuebles,
        "vehiculos": vehiculos, "no_posee_vehiculos": completo and not vehiculos,
        "inversiones": inversiones, "no_posee_inversiones": completo and not inversiones,
        "acciones": acciones, "no_posee_acciones": completo and not acciones,
    }


def uafe(prefijo="", rol=None, pep_probable=True, patrimonio_completo=False):
    actividad = random.choice(ACTIVIDADES)
    es_pep = pep_probable and random.random() < 0.15
    datos = {
        f"{prefijo}actividad_economica": actividad,
        f"{prefijo}empresa_trabajo": "Banco del Pacífico" if actividad == "empleado" else None,
        f"{prefijo}ingreso_mensual": str(random.choice([800, 1200, 1800, 2500, 4000, 7500])),
        f"{prefijo}rol_tramite": rol or random.choice(["vendedor", "adquirente", "otro"]),
        f"{prefijo}origen_fondos": "; ".join(random.sample(ORIGENES, random.randint(1, 2))),
        f"{prefijo}rol_tramite_otro": random.choice(["Poderdante", "Mandante", "Fiador"]),
        f"{prefijo}es_pep": es_pep,
        f"{prefijo}es_pep_indirecto": None if es_pep else False,
        f"{prefijo}patrimonio": patrimonio(patrimonio_completo),
    }
    if es_pep:
        datos.update({
            f"{prefijo}pep_institucion": random.choice(["Municipio de Quito", "Asamblea Nacional", "Ministerio de Salud"]),
            f"{prefijo}pep_cargo": random.choice(["Concejal", "Asesor", "Director"]),
            f"{prefijo}pep_fecha_inicio": fecha_nacimiento(1, 6),
            f"{prefijo}pep_ya_no_ejerce": False,
        })
    return datos


def persona(genero=None, estado=None, provincia_cod=None):
    genero = genero or random.choice(["masculino", "femenino"])
    cod, dir_ = direccion()
    nombre = random.choice(NOMBRES_M if genero == "masculino" else NOMBRES_F)
    apellidos = " ".join(random.sample(APELLIDOS, 2))
    return {
        "document_type": "cedula",
        "document_number": cedula(provincia_cod or cod),
        "names": nombre,
        "last_names": apellidos,
        "gender": genero,
        "marital_status": estado or random.choice(["soltero", "casado", "divorciado", "viudo"]),
        "nationality": "ecuatoriana",
        "birth_date": fecha_nacimiento(),
        "email": f"{nombre.split()[0].lower()}.{apellidos.split()[0].lower()}{random.randint(1, 999)}@ejemplo.com"
                 .replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u"),
        "phone": "09" + "".join(str(random.randint(0, 9)) for _ in range(8)),
        **dir_,
        "occupation": random.choice(OCUPACIONES),
        "profession": random.choice([None, "Licenciado", "Ingeniero", "Doctor"]),
        "conyugue_comparece": True,
    }


def envio_persona():
    titular = persona()
    rol = random.choice(["vendedor", "adquirente", "otro"])
    titular.update(uafe(rol=rol))
    payload = {"tipo": "persona", "calidad_participacion": "propios_derechos",
               "titular": titular, "acepta_condiciones": True, "acepta_privacidad": True}
    if titular["marital_status"] == "casado":
        if random.random() < 0.8:
            conyuge = persona(genero="femenino" if titular["gender"] == "masculino" else "masculino", estado="casado")
            conyuge.update({k: titular[k] for k in titular if k in (
                "province", "canton", "parroquia", "sector", "main_street",
                "secondary_street", "number_street", "referencia")})
            conyuge.update(uafe(rol=rol))
            titular["partner_document_number"] = conyuge["document_number"]
            conyuge["partner_document_number"] = titular["document_number"]
            payload["conyugue"] = conyuge
        else:
            titular["conyugue_comparece"] = False
            titular["razon_exclusion_conyugue"] = random.choice(["capitulacion", "adquirido_solo", "disolucion"])
    return payload


def envio_empresa():
    _, dir_emp = direccion()
    cod, dir_rep = direccion("rep_")
    rep = persona(estado="casado")
    nombre = random.choice(EMPRESAS) + " " + random.choice(["S.A.", "CÍA. LTDA.", "S.A.S."])
    empresa = {
        "ruc": ruc_sociedad(cod),
        "razon_social": nombre,
        "email": f"info{random.randint(1, 999)}@empresa-ejemplo.com",
        "phone": "02" + "".join(str(random.randint(0, 9)) for _ in range(7)),
        **dir_emp,
        "number_street": dir_emp["number_street"] if dir_emp["number_street"] != "S/N" else "N10-20",
        "actividad_empresa": random.choice(["Construcción", "Comercio al por mayor", "Servicios inmobiliarios"]),
        "ingreso_mensual": str(random.randint(20, 300) * 1000),
        "egreso_mensual": str(random.randint(10, 200) * 1000),
        "rol_tramite": random.choice(["vendedor", "adquirente"]),
        "origen_fondos": "Utilidades del negocio",
        "controlada_supercias": True,
        "rep_position": random.choice(["Gerente General", "Presidente"]),
        **{f"rep_{k}": v for k, v in rep.items() if k not in ("marital_status", "conyugue_comparece")},
        **dir_rep,
        # En empresas el sector es obligatorio (empresa y representante)
        "sector": dir_emp["sector"] or "Centro",
        "rep_sector": dir_rep["rep_sector"] or "Centro",
        **uafe("rep_", pep_probable=False, patrimonio_completo=True),
        "rep_rol_tramite": None,
        "rep_origen_fondos": None,
        "patrimonio": patrimonio(completo=True),
    }
    if random.random() < 0.5:
        empresa["socios_modalidad"] = "lista"
        empresa["socios"] = [
            {"nombres": f"{random.choice(NOMBRES_M + NOMBRES_F)} {random.choice(APELLIDOS)}",
             "tipo_documento": "cedula", "numero_documento": cedula("17"), "porcentaje": p}
            for p in (60, 40)
        ]
    else:
        empresa["socios_modalidad"] = "autorizacion"
        empresa["autoriza_consulta_supercias"] = True
    return {"tipo": "empresa", "empresa": empresa, "acepta_condiciones": True, "acepta_privacidad": True}


def main():
    ap = argparse.ArgumentParser(description="Datos ficticios para el servidor de desarrollo")
    ap.add_argument("--personas", type=int, default=30)
    ap.add_argument("--empresas", type=int, default=8)
    ap.add_argument("--semilla", type=int, default=None)
    args = ap.parse_args()

    if settings.ENTORNO.strip().lower() != "desarrollo":
        sys.exit("Este script solo corre en el servidor de desarrollo (ENTORNO=desarrollo en el .env). No se hizo nada.")

    random.seed(args.semilla)
    db = SessionLocal()
    try:
        admin = db.query(SystemUser).filter(SystemUser.activo.is_(True)).order_by(SystemUser.id).first()
        if admin is None:
            sys.exit("No hay usuarios. Primero corre: python create_admin.py")
        ctx = {"origen": OrigenDeclaracion.sistema_interno, "usuario": admin, "ip": None}

        creados = {"persona": 0, "empresa": 0}
        for tipo, cantidad, generar in (("persona", args.personas, envio_persona),
                                        ("empresa", args.empresas, envio_empresa)):
            intentos = 0
            while creados[tipo] < cantidad and intentos < cantidad * 5:
                intentos += 1
                payload = generar()
                doc = payload["empresa"]["ruc"] if tipo == "empresa" else payload["titular"]["document_number"]
                existe = svc.buscar_company(db, doc) if tipo == "empresa" else svc.buscar_party(db, doc)
                if existe:
                    continue
                try:
                    _procesar(db, payload, ctx, tipo, doc)
                    db.commit()
                    creados[tipo] += 1
                except Exception as e:  # dato repetido u otro choque: se descarta y se sigue
                    db.rollback()
                    detalle = getattr(e, "detail", e)
                    print(f"   (descartado {doc}: {detalle})")
        print(f"Listo: {creados['persona']} envíos de personas y {creados['empresa']} empresas.")
    finally:
        db.close()


if __name__ == "__main__":
    main()