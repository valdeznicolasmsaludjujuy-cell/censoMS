import { useRef, useState } from "react";
import { AlertCircle, Download, FileUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type ImportRow = {
  fila: number;
  apellido_nombre: string;
  dni: string;
  cuil: string;
  sexo: string;
  fecha_nacimiento: string;
  udo: string;
  relacion_laboral: string;
  categoria: string;
  escalafon: string;
  agrupamiento: string;
  dependencia: string;
  funcion: string;
};

type ImportResult = {
  fila: number;
  estado: "importado" | "omitido" | "error";
  mensaje: string;
};

const headers: (keyof Omit<ImportRow, "fila">)[] = [
  "udo",
  "apellido_nombre",
  "dni",
  "cuil",
  "sexo",
  "fecha_nacimiento",
  "relacion_laboral",
  "categoria",
  "escalafon",
  "agrupamiento",
  "dependencia",
  "funcion",
];

const headerAliases: Record<(typeof headers)[number], string[]> = {
  udo: ["udopresupuestaria"],
  apellido_nombre: ["apellidoynombre"],
  dni: ["dni"],
  cuil: ["cuil"],
  sexo: ["sexo"],
  fecha_nacimiento: ["fechadenac", "fechadenacimiento"],
  relacion_laboral: ["relacionlaboral"],
  categoria: ["categoria"],
  escalafon: ["escalafon"],
  agrupamiento: ["agrupamiento"],
  dependencia: ["dependencia"],
  funcion: ["funcion"],
};

const CSV_TEMPLATE =
  "UDO PRESUPUESTARIA;APELLIDO Y NOMBRE;DNI;CUIL;SEXO;FECHA DE NAC.;RELACION LABORAL;CATEGORIA;ESCALAFON;AGRUPAMIENTO;DEPENDENCIA;FUNCION\r\n";

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [";", ",", "\t"];
  let best = ";";
  let max = -1;
  for (const candidate of candidates) {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') {
        if (quoted && firstLine[i + 1] === '"') i++;
        else quoted = !quoted;
      } else if (!quoted && firstLine[i] === candidate) {
        count++;
      }
    }
    if (count > max) {
      max = count;
      best = candidate;
    }
  }
  return best;
}

function parseCsv(text: string, delimiter: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      record.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(cell);
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("El archivo tiene un campo de texto entre comillas sin cerrar.");
  record.push(cell);
  if (record.some((value) => value.trim())) records.push(record);
  return records;
}

function normalizeDate(value: string) {
  const date = value.trim();
  if (!date) return "";
  let year: number;
  let month: number;
  let day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(date);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (local) {
    day = Number(local[1]);
    month = Number(local[2]);
    year = Number(local[3]);
  } else {
    throw new Error("Fecha inválida; usá DD/MM/AAAA o AAAA-MM-DD.");
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("La fecha no existe.");
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function normalizeIdentifier(value: string) {
  return value.trim().replace(/\.0$/, "").replace(/\D/g, "");
}

// Exported so the CSV parsing and validation rules can be covered by unit tests.
// eslint-disable-next-line react-refresh/only-export-components
export function parseImportRows(text: string) {
  const records = parseCsv(text.replace(/^\uFEFF/, ""), detectDelimiter(text));
  if (records.length < 2) throw new Error("El CSV no contiene filas de datos.");

  const headerRow = records[0];
  if (!headerRow) throw new Error("No se encontró la fila de encabezados.");
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const indexes = new Map<(typeof headers)[number], number>();
  for (const header of headers) {
    const index = normalizedHeaders.findIndex((value) => headerAliases[header].includes(value));
    if (index < 0) throw new Error(`Falta la columna requerida “${header}” en el archivo.`);
    indexes.set(header, index);
  }

  const rows: ImportRow[] = [];
  const results: ImportResult[] = [];
  records.slice(1).forEach((values, index) => {
    const get = (header: (typeof headers)[number]) =>
      (values[indexes.get(header) ?? -1] ?? "").trim();
    const row: ImportRow = {
      fila: index + 2,
      apellido_nombre: get("apellido_nombre"),
      dni: normalizeIdentifier(get("dni")),
      cuil: normalizeIdentifier(get("cuil")),
      sexo: get("sexo").trim().toUpperCase(),
      fecha_nacimiento: "",
      udo: get("udo"),
      relacion_laboral: get("relacion_laboral"),
      categoria: get("categoria"),
      escalafon: get("escalafon"),
      agrupamiento: get("agrupamiento"),
      dependencia: get("dependencia"),
      funcion: get("funcion"),
    };
    let message: string | null = null;
    if (!row.apellido_nombre) message = "Falta apellido y nombre.";
    else if (!row.dni && !row.cuil) message = "Se requiere DNI o CUIL para detectar duplicados.";
    else if (row.dni && !/^\d{7,8}$/.test(row.dni)) message = "El DNI debe tener 7 u 8 dígitos.";
    else if (row.cuil && !/^\d{11}$/.test(row.cuil)) message = "El CUIL debe tener 11 dígitos.";
    else {
      try {
        row.fecha_nacimiento = normalizeDate(get("fecha_nacimiento"));
      } catch (error) {
        message = error instanceof Error ? error.message : "Fecha de nacimiento inválida.";
      }
    }
    if (message) results.push({ fila: row.fila, estado: "error", mensaje: message });
    else rows.push(row);
  });
  return { rows, results };
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseResults(value: Json): ImportResult[] {
  if (!Array.isArray(value))
    throw new Error("El servidor devolvió un resultado de importación inválido.");
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry["fila"] !== "number" ||
      (entry["estado"] !== "importado" &&
        entry["estado"] !== "omitido" &&
        entry["estado"] !== "error") ||
      typeof entry["mensaje"] !== "string"
    ) {
      throw new Error("El servidor devolvió un resultado de importación inválido.");
    }
    return {
      fila: entry["fila"],
      estado: entry["estado"],
      mensaje: entry["mensaje"],
    };
  });
}

function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function ImportarPersonalDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [importing, setImporting] = useState(false);

  async function selectFile(file?: File) {
    if (!file) return;
    setLoadingFile(true);
    setErrorMessage("");
    setResults([]);
    setRows([]);
    setFileName(file.name);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("El archivo supera el límite de 5 MB.");
      const parsed = parseImportRows(await file.text());
      if (parsed.rows.length + parsed.results.length > 1000)
        throw new Error("La importación admite hasta 1.000 filas por archivo.");
      setRows(parsed.rows);
      setResults(parsed.results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    } finally {
      setLoadingFile(false);
    }
  }

  async function importRows() {
    setImporting(true);
    setErrorMessage("");
    try {
      const payload: Json[] = rows.map((row) => ({
        fila: row.fila,
        apellido_nombre: row.apellido_nombre,
        dni: row.dni,
        cuil: row.cuil,
        sexo: row.sexo,
        fecha_nacimiento: row.fecha_nacimiento,
        udo: row.udo,
        relacion_laboral: row.relacion_laboral,
        categoria: row.categoria,
        escalafon: row.escalafon,
        agrupamiento: row.agrupamiento,
        dependencia: row.dependencia,
        funcion: row.funcion,
      }));
      const { data, error } = await supabase.rpc("importar_personas_legajos", {
        p_filas: payload,
      });
      if (error) throw error;
      const importedResults = parseResults(data);
      setResults((current) => [...current, ...importedResults].sort((a, b) => a.fila - b.fila));
      setRows([]);
      onImported();
      const importedCount = importedResults.filter((item) => item.estado === "importado").length;
      const skipped = importedResults.filter((item) => item.estado === "omitido").length;
      const failed = importedResults.filter((item) => item.estado === "error").length;
      const summary = `Importación: ${importedCount} importados, ${skipped} omitidos y ${failed} con errores.`;
      if (failed) toast.error(summary);
      else if (skipped) toast.warning(summary);
      else toast.success(summary);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo completar la importación.",
      );
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFileName("");
    setRows([]);
    setResults([]);
    setErrorMessage("");
    if (fileInput.current) fileInput.current.value = "";
  }

  const importedCount = results.filter((item) => item.estado === "importado").length;
  const skippedCount = results.filter((item) => item.estado === "omitido").length;
  const errorCount = results.filter((item) => item.estado === "error").length;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !importing) {
          onOpenChange(false);
          reset();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar personal desde Excel (CSV)</DialogTitle>
          <DialogDescription>
            Guardá la hoja de Excel como CSV UTF-8 y seleccioná el archivo. Se aceptan separadores
            coma o punto y coma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadText("plantilla_personal.csv", CSV_TEMPLATE)}
            >
              <Download className="h-4 w-4" /> Descargar plantilla
            </Button>
            <Button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={loadingFile || importing}
            >
              {loadingFile ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Seleccionar CSV
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
          </div>
          {fileName && <p className="text-sm text-muted-foreground">Archivo: {fileName}</p>}

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-sm text-amber-800 dark:text-amber-200">
            La base no tiene un campo UDO directo en el legajo y este archivo no incluye sector. La
            columna UDO se validará, pero no se guardará ni aparecerá en la planilla hasta que se
            asigne un sector desde la estructura organizativa.
          </div>

          {rows.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
              <p className="text-sm font-medium">
                {rows.length} filas listas para importar
                {results.length > 0 && ` · ${results.length} filas con errores de formato`}
              </p>
              <p className="text-xs text-muted-foreground">
                Los duplicados por DNI o CUIL y los valores que no coincidan con catálogos se
                omitirán y aparecerán en el reporte.
              </p>
              <div className="max-h-44 overflow-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2">Fila</th>
                      <th className="p-2">Apellido y nombre</th>
                      <th className="p-2">DNI</th>
                      <th className="p-2">CUIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row) => (
                      <tr key={row.fila} className="border-t">
                        <td className="p-2">{row.fila}</td>
                        <td className="p-2">{row.apellido_nombre}</td>
                        <td className="p-2">{row.dni || "—"}</td>
                        <td className="p-2">{row.cuil || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">
                    Se muestran las primeras 10 filas.
                  </p>
                )}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Resultado: {importedCount} importados · {skippedCount} omitidos · {errorCount} con
                  errores
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadText(
                      "reporte_importacion.csv",
                      [
                        "FILA;ESTADO;MENSAJE",
                        ...results.map((result) =>
                          [result.fila, result.estado, csvCell(result.mensaje)].join(";"),
                        ),
                      ].join("\r\n"),
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Descargar reporte
                </Button>
              </div>
              <div className="max-h-48 overflow-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2">Fila</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={`${result.fila}-${result.estado}`} className="border-t">
                        <td className="p-2">{result.fila}</td>
                        <td className="p-2">{result.estado}</td>
                        <td className="p-2">{result.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
            disabled={importing}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={() => void importRows()}
            disabled={!rows.length || importing}
          >
            {importing && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {importing ? "Importando…" : `Importar ${rows.length} filas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
