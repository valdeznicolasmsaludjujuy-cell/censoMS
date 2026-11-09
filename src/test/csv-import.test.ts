import { describe, expect, it } from "vitest";
import { parseImportRows } from "@/components/admin/ImportarPersonalDialog";

const headers =
  "UDO PRESUPUESTARIA;APELLIDO Y NOMBRE;DNI;CUIL;SEXO;FECHA DE NAC.;RELACION LABORAL;CATEGORIA;ESCALAFON;AGRUPAMIENTO;DEPENDENCIA;FUNCION";

describe("CSV personnel import parsing", () => {
  it("parses semicolon-delimited Excel CSV, quoted names and Argentine dates", () => {
    const result = parseImportRows(
      `${headers}\r\n"UDO 1";"Pérez, Ana";12.345.678;20-12345678-9;Femenino;31/12/1980;Planta;A1;General;Administrativo;Hospital;Jefa`,
    );

    expect(result.results).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      fila: 2,
      apellido_nombre: "Pérez, Ana",
      dni: "12345678",
      cuil: "20123456789",
      sexo: "FEMENINO",
      fecha_nacimiento: "1980-12-31",
      udo: "UDO 1",
      relacion_laboral: "Planta",
      categoria: "A1",
      escalafon: "General",
      agrupamiento: "Administrativo",
      dependencia: "Hospital",
      funcion: "Jefa",
    });
  });

  it("accepts comma-delimited CSV and header accents", () => {
    const result = parseImportRows(
      "UDO PRESUPUESTARIA,APELLIDO Y NOMBRE,DNI,CUIL,SEXO,FECHA DE NAC.,RELACIÓN LABORAL,CATEGORÍA,ESCALAFÓN,AGRUPAMIENTO,DEPENDENCIA,FUNCIÓN\n" +
        '1,"Nombre, Apellido",12345678,,M,1980-12-31,,,,,,',
    );

    expect(result.rows[0]).toMatchObject({
      apellido_nombre: "Nombre, Apellido",
      sexo: "M",
      fecha_nacimiento: "1980-12-31",
    });
    expect(result.results).toEqual([]);
  });

  it("reports invalid identifiers and rows without duplicate keys", () => {
    const result = parseImportRows(
      `${headers}\n1;Persona Uno;123;;F;;;;;;;;\n1;Persona Dos;;;;;;;;;;;`,
    );

    expect(result.rows).toHaveLength(0);
    expect(result.results).toEqual([
      { fila: 2, estado: "error", mensaje: "El DNI debe tener 7 u 8 dígitos." },
      {
        fila: 3,
        estado: "error",
        mensaje: "Se requiere DNI o CUIL para detectar duplicados.",
      },
    ]);
  });
});
