import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { ChevronLeft, ChevronRight, Database, RefreshCw, X } from 'lucide-react';

type SortColumn = 'cod' | 'cls' | 'tit' | 'per' | 'est' | 'p1' | 'p2' | 'p3';
type SortDirection = 'asc' | 'desc';
type EditedPriceFields = { p1: string; p2: string; p3: string; est: string };
type ModifierEditFields = { costoExtra: string; est: string };
type PrecioCanalEditFields = { precioVenta: string; costoExtra: string };
type PromoRow = {
  cod?: string;
  tit?: string;
  des?: string;
  est?: string;
  per?: string;
  cls?: string;
  p1?: number | string | null;
  p2?: number | string | null;
  p3?: number | string | null;
  [key: string]: unknown;
};
type ModificadorOption = {
  codigo_tipo_modificador?: string | number;
  descripcion_tipo_modificador?: string;
};
type ProductoOption = {
  CODIGO_PRODUCTO?: string;
  DESCRIPCION_CORTA_PRODUCTO?: string;
};
type ExistingModifierRow = {
  __isNew?: false;
  __clientId?: string;
  cod_promo?: string;
  tipo_modificador?: string | number;
  descripcion_tipo_modificador?: string;
  Linea?: string | number;
  codigo_producto?: string;
  CodProd_Equiv?: string;
  desc_modi?: string;
  costo_extra?: string | number;
  esdefault?: string | number;
  EsDefault?: string | number;
  esDefault?: string | number;
  estado_modificador?: string;
  Aplica_Mitades?: string;
  MultipleCanal?: string;
};
type AddedModifierRow = {
  __isNew: true;
  __clientId: string;
  cod_promo?: string;
  tipo_modificador: string;
  descripcion_tipo_modificador: string;
  Linea: string;
  codigo_producto: string;
  CodProd_Equiv: string;
  desc_modi: string;
  costo_extra: string;
  esdefault: string;
  EsDefault?: string;
  esDefault?: string;
  estado_modificador: string;
  Aplica_Mitades: string;
  MultipleCanal: string;
};
type ModifierRow = ExistingModifierRow | AddedModifierRow;
type ExistingPrecioCanalRow = {
  __isNew?: false;
  __clientId?: string;
  clase?: string;
  codigo_clase_producto?: string;
  cod_promo?: string;
  titulo_promo?: string;
  nivel?: string | number;
  multiple_tipo_codigo?: string;
  descripcion_tipo_modificador?: string;
  descripcion_corta_producto?: string;
  codigo_producto?: string;
  precio_venta?: string | number;
  costo_extra?: string | number;
  mutiple_canal?: string;
};
type AddedPrecioCanalRow = {
  __isNew: true;
  __clientId: string;
  clase: string;
  codigo_clase_producto: string;
  cod_promo: string;
  titulo_promo: string;
  nivel: string;
  multiple_tipo_codigo: string;
  descripcion_tipo_modificador: string;
  descripcion_corta_producto: string;
  codigo_producto: string;
  precio_venta: string;
  costo_extra: string;
  mutiple_canal: string;
};
type PrecioCanalRow = ExistingPrecioCanalRow | AddedPrecioCanalRow;

const NUMERIC_COLUMNS: SortColumn[] = ['p1', 'p2', 'p3'];
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const toSqlNumber = (value: string): string | null => {
  if (value.trim() === '') return null;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return null;
  return parsed.toFixed(2);
};

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

function App() {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('cod');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editedPrices, setEditedPrices] = useState<Record<string, EditedPriceFields>>({});
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsCode, setDetailsCode] = useState('');
  const [detailsTitle, setDetailsTitle] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsRows, setDetailsRows] = useState<ExistingModifierRow[]>([]);
  const [modExtraEdits, setModExtraEdits] = useState<Record<string, ModifierEditFields>>({});
  const [addedModifierRows, setAddedModifierRows] = useState<AddedModifierRow[]>([]);
  const [showPriceCanales, setShowPriceCanales] = useState(false);
  const [priceCanalesLoading, setPriceCanalesLoading] = useState(false);
  const [priceCanalesError, setPriceCanalesError] = useState<string | null>(null);
  const [priceCanalesRows, setPriceCanalesRows] = useState<ExistingPrecioCanalRow[]>([]);
  const [priceCanalEdits, setPriceCanalEdits] = useState<Record<string, PrecioCanalEditFields>>({});
  const [addedPriceCanalesRows, setAddedPriceCanalesRows] = useState<AddedPrecioCanalRow[]>([]);
  const [modificadorOptions, setModificadorOptions] = useState<ModificadorOption[]>([]);
  const [productoOptions, setProductoOptions] = useState<ProductoOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Ajustes Promos');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const categories = ['Ajustes Promos'];

  const showNotice = (message: string) => {
    setCopyNotice(message);
    window.setTimeout(() => setCopyNotice(null), 2200);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/promos?t=${Date.now()}`));
      const data = await response.json();
      setPromos(Array.isArray(data) ? (data as PromoRow[]) : []);
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const normalizedSearch = useMemo(() => deferredSearchTerm.trim().toLowerCase(), [deferredSearchTerm]);

  const filtered = useMemo(() => {
    if (!normalizedSearch) return promos;
    return promos.filter(p => (String(p.cod || "") + String(p.tit || "")).toLowerCase().includes(normalizedSearch));
  }, [promos, normalizedSearch]);

  const modifierDatalistOptions = useMemo(() => {
    return modificadorOptions.flatMap((item: ModificadorOption, i: number) => {
      const cod = String(item.codigo_tipo_modificador ?? '');
      const desc = String(item.descripcion_tipo_modificador ?? '');
      return [
        <option key={`tipo-cod-${cod}-${i}`} value={cod} label={desc} />,
        desc && desc !== cod ? <option key={`tipo-desc-${cod}-${i}`} value={desc} label={cod} /> : null,
      ];
    });
  }, [modificadorOptions]);

  const productDatalistOptions = useMemo(() => {
    return productoOptions.flatMap((item: ProductoOption, i: number) => {
      const cod = String(item.CODIGO_PRODUCTO ?? '');
      const desc = String(item.DESCRIPCION_CORTA_PRODUCTO ?? '');
      return [
        <option key={`prod-cod-${cod}-${i}`} value={cod} label={desc} />,
        desc && desc !== cod ? <option key={`prod-desc-${cod}-${i}`} value={desc} label={cod} /> : null,
      ];
    });
  }, [productoOptions]);

  const sortedPromos = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (NUMERIC_COLUMNS.includes(sortColumn)) {
        const aVal = parseNumeric(a[sortColumn]);
        const bVal = parseNumeric(b[sortColumn]);

        // Keep null values at the bottom to behave like spreadsheet sorting.
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aVal = String(a[sortColumn] ?? '').toLowerCase();
      const bVal = String(b[sortColumn] ?? '').toLowerCase();
      const comparison = aVal.localeCompare(bVal, 'es', { numeric: true, sensitivity: 'base' });

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortColumn, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const sortBadge = (column: SortColumn) => {
    if (sortColumn !== column) return 'A-Z';
    return sortDirection === 'asc' ? 'ASC' : 'DESC';
  };

  const getRowKey = (promo: PromoRow) => String(promo.cod ?? '');

  const getEditedField = (rowKey: string, field: keyof EditedPriceFields) => {
    return editedPrices[rowKey]?.[field] ?? '';
  };

  const handlePriceInputChange = (rowKey: string, field: keyof EditedPriceFields, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [rowKey]: {
        p1: prev[rowKey]?.p1 ?? '',
        p2: prev[rowKey]?.p2 ?? '',
        p3: prev[rowKey]?.p3 ?? '',
        est: prev[rowKey]?.est ?? '',
        [field]: value,
      },
    }));
  };

  const openModifiersModal = async (promo: PromoRow) => {
    const cod = String(promo.cod ?? '').trim();
    if (!cod) return;

    setDetailsCode(cod);
    setDetailsTitle(String(promo.tit ?? ''));
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsRows([]);
    void ensurePrecioCanalesCatalogs();

    try {
      const response = await fetch(apiUrl(`/api/modificadores/${encodeURIComponent(cod)}?t=${Date.now()}`));
      if (!response.ok) {
        throw new Error('No se pudo obtener el detalle de modificadores.');
      }
      const data = await response.json();
      setDetailsRows(Array.isArray(data) ? (data as ExistingModifierRow[]) : []);
    } catch {
      setDetailsError('No se pudo cargar la informacion de modificadores.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsError(null);
    setDetailsRows([]);
    setModExtraEdits({});
    setAddedModifierRows([]);
    setShowPriceCanales(false);
    setPriceCanalesError(null);
    setPriceCanalesRows([]);
    setPriceCanalEdits({});
    setAddedPriceCanalesRows([]);
  };

  const addModifierRow = () => {
    const newRow: AddedModifierRow = {
      __isNew: true,
      __clientId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tipo_modificador: '',
      descripcion_tipo_modificador: '',
      Linea: '',
      codigo_producto: '',
      CodProd_Equiv: '',
      desc_modi: '',
      costo_extra: '',
      esdefault: '',
      estado_modificador: '',
      Aplica_Mitades: '',
      MultipleCanal: '',
    };

    setAddedModifierRows(prev => [...prev, newRow]);
  };

  const updateAddedModifierRow = (
    clientId: string,
    field:
      | 'tipo_modificador'
      | 'descripcion_tipo_modificador'
      | 'Linea'
      | 'codigo_producto'
      | 'CodProd_Equiv'
      | 'desc_modi'
      | 'costo_extra'
      | 'esdefault'
      | 'estado_modificador'
      | 'Aplica_Mitades'
      | 'MultipleCanal',
    value: string
  ) => {
    setAddedModifierRows(prev =>
      prev.map(row => (row.__clientId === clientId ? { ...row, [field]: value } : row))
    );
  };

  const removeAddedModifierRow = (clientId: string) => {
    setAddedModifierRows(prev => prev.filter(row => row.__clientId !== clientId));
    setModExtraEdits(prev => {
      const next = { ...prev };
      delete next[`new|${clientId}`];
      return next;
    });
  };

  const onNewModifierTipoChange = (clientId: string, value: string) => {
    const raw = value.trim();
    const foundByDesc = modificadorOptions.find(
      (item: ModificadorOption) => String(item.descripcion_tipo_modificador ?? '').toLowerCase() === raw.toLowerCase()
    );
    const foundByCode = modificadorOptions.find(
      (item: ModificadorOption) => String(item.codigo_tipo_modificador ?? '').toLowerCase() === raw.toLowerCase()
    );
    const found = foundByDesc || foundByCode;

    if (found) {
      updateAddedModifierRow(clientId, 'tipo_modificador', String(found.codigo_tipo_modificador ?? ''));
      updateAddedModifierRow(clientId, 'descripcion_tipo_modificador', String(found.descripcion_tipo_modificador ?? ''));
      return;
    }

    updateAddedModifierRow(clientId, 'tipo_modificador', value);
    updateAddedModifierRow(clientId, 'descripcion_tipo_modificador', value);
  };

  const onNewModifierProductoChange = (clientId: string, value: string) => {
    const raw = value.trim();
    const foundByCode = productoOptions.find(
      (item: ProductoOption) => String(item.CODIGO_PRODUCTO ?? '').toLowerCase() === raw.toLowerCase()
    );
    const foundByDesc = productoOptions.find(
      (item: ProductoOption) => String(item.DESCRIPCION_CORTA_PRODUCTO ?? '').toLowerCase() === raw.toLowerCase()
    );
    const found = foundByCode || foundByDesc;

    if (found) {
      const code = String(found.CODIGO_PRODUCTO ?? '');
      const desc = String(found.DESCRIPCION_CORTA_PRODUCTO ?? '');
      updateAddedModifierRow(clientId, 'codigo_producto', code);
      updateAddedModifierRow(clientId, 'desc_modi', desc);
      updateAddedModifierRow(clientId, 'CodProd_Equiv', code);
      return;
    }

    updateAddedModifierRow(clientId, 'codigo_producto', value);
    updateAddedModifierRow(clientId, 'CodProd_Equiv', value);
  };

  const addPrecioCanalRow = () => {
    const seed = priceCanalesRows[0] ?? {};
    const newRow: AddedPrecioCanalRow = {
      __isNew: true,
      __clientId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      clase: String(seed.clase ?? 'SIN CLASE'),
      codigo_clase_producto: String(seed.codigo_clase_producto ?? ''),
      cod_promo: String(seed.cod_promo ?? detailsCode),
      titulo_promo: String(seed.titulo_promo ?? detailsTitle),
      nivel: String(seed.nivel ?? '0'),
      multiple_tipo_codigo: '',
      descripcion_tipo_modificador: '',
      descripcion_corta_producto: '',
      codigo_producto: '',
      precio_venta: '0',
      costo_extra: '0',
      mutiple_canal: '0',
    };

    setAddedPriceCanalesRows(prev => [...prev, newRow]);
  };

  const updateAddedPrecioCanalRow = (
    clientId: string,
    field:
      | 'nivel'
      | 'descripcion_tipo_modificador'
      | 'descripcion_corta_producto'
      | 'codigo_producto'
      | 'mutiple_canal'
      | 'codigo_clase_producto'
      | 'clase'
      | 'multiple_tipo_codigo'
      | 'precio_venta'
      | 'costo_extra',
    value: string
  ) => {
    setAddedPriceCanalesRows(prev =>
      prev.map(row => (row.__clientId === clientId ? { ...row, [field]: value } : row))
    );
  };

  const removeAddedPrecioCanalRow = (clientId: string) => {
    setAddedPriceCanalesRows(prev => prev.filter(row => row.__clientId !== clientId));
    setPriceCanalEdits(prev => {
      const next = { ...prev };
      delete next[`new|${clientId}`];
      return next;
    });
  };

  const ensurePrecioCanalesCatalogs = async () => {
    if (modificadorOptions.length > 0 && productoOptions.length > 0) return;

    try {
      const response = await fetch(apiUrl(`/api/catalogos/precio-canales?t=${Date.now()}`));
      if (!response.ok) return;
      const data = await response.json();
      setModificadorOptions(Array.isArray(data.modificadores) ? (data.modificadores as ModificadorOption[]) : []);
      setProductoOptions(Array.isArray(data.productos) ? (data.productos as ProductoOption[]) : []);
    } catch {
      // Keep workflow resilient even if catalogs fail; manual typing still works.
    }
  };

  const onNewRowModificadorChange = (clientId: string, value: string) => {
    const raw = value.trim();
    const foundByDesc = modificadorOptions.find(
      (item: ModificadorOption) => String(item.descripcion_tipo_modificador ?? '').toLowerCase() === raw.toLowerCase()
    );
    const foundByCode = modificadorOptions.find(
      (item: ModificadorOption) => String(item.codigo_tipo_modificador ?? '').toLowerCase() === raw.toLowerCase()
    );
    const found = foundByDesc || foundByCode;

    updateAddedPrecioCanalRow(clientId, 'descripcion_tipo_modificador', found ? String(found.descripcion_tipo_modificador ?? '') : value);
    updateAddedPrecioCanalRow(clientId, 'multiple_tipo_codigo', found ? String(found.codigo_tipo_modificador ?? '') : '');
  };

  const onNewRowProductoChange = (clientId: string, value: string) => {
    const raw = value.trim();
    const foundByCode = productoOptions.find(
      (item: ProductoOption) => String(item.CODIGO_PRODUCTO ?? '').toLowerCase() === raw.toLowerCase()
    );
    const foundByDesc = productoOptions.find(
      (item: ProductoOption) => String(item.DESCRIPCION_CORTA_PRODUCTO ?? '').toLowerCase() === raw.toLowerCase()
    );
    const found = foundByCode || foundByDesc;

    if (found) {
      updateAddedPrecioCanalRow(clientId, 'codigo_producto', String(found.CODIGO_PRODUCTO ?? ''));
      updateAddedPrecioCanalRow(clientId, 'descripcion_corta_producto', String(found.DESCRIPCION_CORTA_PRODUCTO ?? ''));
      return;
    }

    updateAddedPrecioCanalRow(clientId, 'codigo_producto', value);
    updateAddedPrecioCanalRow(clientId, 'descripcion_corta_producto', value);
  };

  const togglePriceCanales = async () => {
    if (showPriceCanales) {
      setShowPriceCanales(false);
      return;
    }

    setShowPriceCanales(true);
    void ensurePrecioCanalesCatalogs();
    if (priceCanalesRows.length > 0 || priceCanalesLoading) return;

    try {
      setPriceCanalesLoading(true);
      setPriceCanalesError(null);
      const response = await fetch(apiUrl(`/api/precio-canales/${encodeURIComponent(detailsCode)}?t=${Date.now()}`));
      if (!response.ok) throw new Error('No se pudo obtener Precio Canales.');
      const data = await response.json();
      setPriceCanalesRows(Array.isArray(data) ? (data as ExistingPrecioCanalRow[]) : []);
    } catch {
      setPriceCanalesError('No se pudo cargar la informacion de Precio Canales.');
    } finally {
      setPriceCanalesLoading(false);
    }
  };

  const getPriceCanalKey = (row: PrecioCanalRow, index: number) => {
    if (row.__isNew && row.__clientId) {
      return `new|${row.__clientId}`;
    }

    return [
      String(row.cod_promo ?? ''),
      String(row.nivel ?? ''),
      String(row.codigo_producto ?? ''),
      String(row.mutiple_canal ?? ''),
      String(row.codigo_clase_producto ?? ''),
      String(index),
    ].join('|');
  };

  const getPriceCanalEdit = (row: PrecioCanalRow, index: number) => {
    return priceCanalEdits[getPriceCanalKey(row, index)] ?? { precioVenta: '', costoExtra: '' };
  };

  const updatePriceCanalEdit = (
    row: PrecioCanalRow,
    index: number,
    field: keyof PrecioCanalEditFields,
    value: string
  ) => {
    const key = getPriceCanalKey(row, index);
    setPriceCanalEdits(prev => ({
      ...prev,
      [key]: {
        precioVenta: field === 'precioVenta' ? value : prev[key]?.precioVenta ?? '',
        costoExtra: field === 'costoExtra' ? value : prev[key]?.costoExtra ?? '',
      },
    }));
  };

  const buildPrecioCanalScript = (row: PrecioCanalRow, index: number): string | null => {
    const edit = getPriceCanalEdit(row, index);
    const newPrecioVenta = toSqlNumber(edit.precioVenta);
    const newCostoExtra = toSqlNumber(edit.costoExtra);

    const codPromo = escapeSqlString(String(row.cod_promo ?? '').trim());
    if (!codPromo || codPromo === 'SIN PROMO') return null;

    const nivelRaw = String(row.nivel ?? '').trim();
    const canalRaw = String(row.mutiple_canal ?? '').trim();
    const codigoProductoRaw = String(row.codigo_producto ?? '').trim();
    const codigoClaseRaw = String(row.codigo_clase_producto ?? '').trim();

    const setFields: string[] = [];
    if (newPrecioVenta !== null) setFields.push(`Precio_Venta = ${newPrecioVenta}`);
    if (newCostoExtra !== null) setFields.push(`costo_extra = ${newCostoExtra}`);

    if (row.__isNew) {
      const nivelForInsert = !Number.isNaN(Number(nivelRaw)) ? Number(nivelRaw) : 0;
      const canalForInsert = canalRaw && canalRaw !== 'SIN CANAL' ? escapeSqlString(canalRaw) : '';
      const codigoProductoForInsert = codigoProductoRaw && codigoProductoRaw !== 'SIN PRODUCTO' ? escapeSqlString(codigoProductoRaw) : '';
      const claseCodigoForInsert = codigoClaseRaw && codigoClaseRaw !== 'SIN CLASE' ? escapeSqlString(codigoClaseRaw) : '';
      const tipoDescripcionForInsert = escapeSqlString(String(row.descripcion_tipo_modificador ?? '').trim());
      const tipoCodigoForInsert = escapeSqlString(String(row.multiple_tipo_codigo ?? '').trim());

      if (!canalForInsert || !codigoProductoForInsert || !claseCodigoForInsert) return null;

      const basePrecioVenta = toSqlNumber(String(row.precio_venta ?? ''));
      const baseCostoExtra = toSqlNumber(String(row.costo_extra ?? ''));
      const precioVentaInsert = newPrecioVenta ?? basePrecioVenta;
      const costoExtraInsert = newCostoExtra ?? baseCostoExtra;

      if (precioVentaInsert === null && costoExtraInsert === null) return null;

      const multipleTipoExpr = tipoCodigoForInsert
        ? `'${tipoCodigoForInsert}'`
        : (tipoDescripcionForInsert
          ? `(SELECT TOP 1 codigo_tipo_modificador FROM dbo.Tipos_Modificadores WHERE descripcion_tipo_modificador = '${tipoDescripcionForInsert}')`
          : 'NULL');

      return [
        `-- Insertar nuevo registro PrecioCanal ${codPromo}`,
        `INSERT INTO dbo.PrecioCanal (CODIGO_CLASE_PRODUCTO, cod_promo, Nivel, MultipleTipo, codigo_producto, Precio_Venta, costo_extra, MutipleCanal) VALUES ('${claseCodigoForInsert}', '${codPromo}', ${nivelForInsert}, ${multipleTipoExpr}, '${codigoProductoForInsert}', ${precioVentaInsert ?? '0.00'}, ${costoExtraInsert ?? '0.00'}, '${canalForInsert}');`,
      ].join('\n');
    }

    if (setFields.length === 0) return null;

    const whereClauses = [`cod_promo = '${codPromo}'`];

    if (!Number.isNaN(Number(nivelRaw))) whereClauses.push(`Nivel = ${Number(nivelRaw)}`);
    if (canalRaw && canalRaw !== 'SIN CANAL') whereClauses.push(`MutipleCanal = '${escapeSqlString(canalRaw)}'`);
    if (codigoProductoRaw && codigoProductoRaw !== 'SIN PRODUCTO') whereClauses.push(`codigo_producto = '${escapeSqlString(codigoProductoRaw)}'`);
    if (codigoClaseRaw && codigoClaseRaw !== 'SIN CLASE') whereClauses.push(`CODIGO_CLASE_PRODUCTO = '${escapeSqlString(codigoClaseRaw)}'`);

    return [
      `-- Actualizar PrecioCanal ${codPromo}`,
      `UPDATE dbo.PrecioCanal SET ${setFields.join(', ')} WHERE ${whereClauses.join(' AND ')};`,
    ].join('\n');
  };

  const copyPrecioCanalScript = async (row: PrecioCanalRow, index: number) => {
    const script = buildPrecioCanalScript(row, index);
    if (!script) {
      showNotice('Ingresa un valor valido en N Precio_Venta o N Costo_Extra para generar script.');
      return;
    }

    try {
      await navigator.clipboard.writeText(script);
      showNotice('Script de Precio Canales copiado al portapapeles.');
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', script);
    }
  };

  const copyAllPrecioCanalScripts = async () => {
    const allRows = [...priceCanalesRows, ...addedPriceCanalesRows];
    const scripts = allRows
      .map((row, idx) => buildPrecioCanalScript(row, idx))
      .filter((script): script is string => script !== null);

    if (scripts.length === 0) {
      showNotice('No hay valores en N Precio_Venta o N Costo_Extra para generar script.');
      return;
    }

    const fullScript = [
      `-- Script global Precio Canales para promo: ${detailsCode}`,
      scripts.join('\n\n'),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(fullScript);
      showNotice(`Script global de Precio Canales copiado (${scripts.length} linea(s)).`);
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', fullScript);
    }
  };

  const getModifierKey = (row: ModifierRow, index: number) => {
    if (row.__isNew && row.__clientId) return `new|${row.__clientId}`;

    return [
      detailsCode,
      String(row.tipo_modificador ?? ''),
      String(row.Linea ?? ''),
      String(row.codigo_producto ?? ''),
      String(row.MultipleCanal ?? ''),
      String(index),
    ].join('|');
  };

  const getModExtraValue = (row: ModifierRow, index: number) => {
    return modExtraEdits[getModifierKey(row, index)]?.costoExtra ?? '';
  };

  const getModEstadoValue = (row: ModifierRow, index: number) => {
    return modExtraEdits[getModifierKey(row, index)]?.est ?? '';
  };

  const onModExtraChange = (row: ModifierRow, index: number, value: string) => {
    const key = getModifierKey(row, index);
    setModExtraEdits(prev => ({
      ...prev,
      [key]: {
        costoExtra: value,
        est: prev[key]?.est ?? '',
      },
    }));
  };

  const onModEstadoChange = (row: ModifierRow, index: number, value: string) => {
    const key = getModifierKey(row, index);
    setModExtraEdits(prev => ({
      ...prev,
      [key]: {
        costoExtra: prev[key]?.costoExtra ?? '',
        est: value,
      },
    }));
  };

  const buildModifierExtraScript = (row: ModifierRow, index: number): string | null => {
    if (row.__isNew) {
      const cod = escapeSqlString(String(detailsCode || row.cod_promo || '').trim());
      const tipoRaw = String(row.tipo_modificador ?? '').trim();
      const lineaRaw = String(row.Linea ?? '').trim();
      const codigoProducto = escapeSqlString(String(row.codigo_producto ?? '').trim());
      const codProdEquiv = escapeSqlString(String(row.CodProd_Equiv ?? '').trim());
      const descModi = escapeSqlString(String(row.desc_modi ?? '').trim());
      const costoExtra = toSqlNumber(String(row.costo_extra ?? '').trim()) ?? '0.00';
      const esDefaultRaw = String(row.esdefault ?? '').trim().toUpperCase();
      const estadoRaw = String(row.estado_modificador ?? '').trim().toUpperCase() || 'A';
      const aplicaMitadesRaw = String(row.Aplica_Mitades ?? '').trim();
      const canalRaw = String(row.MultipleCanal ?? '').trim();

      if (!cod || !tipoRaw || !lineaRaw || Number.isNaN(Number(lineaRaw)) || !codigoProducto) return null;

      const tipoExpr = Number.isNaN(Number(tipoRaw)) ? `'${escapeSqlString(tipoRaw)}'` : `${Number(tipoRaw)}`;
      const esDefaultValue = esDefaultRaw === 'SI' || esDefaultRaw === '1' ? 1 : 0;
      const estadoValue = estadoRaw === 'I' ? 'I' : 'A';
      const aplicaMitadesExpr = aplicaMitadesRaw ? `'${escapeSqlString(aplicaMitadesRaw)}'` : 'NULL';
      const canalExpr = canalRaw ? `'${escapeSqlString(canalRaw)}'` : 'NULL';

      return [
        `-- Insertar nuevo modificador para promo ${cod}`,
        `INSERT INTO dbo.Modificadores (cod_promo, Tipo, Linea, codigo_producto, CodProd_Equiv, desc_modi, costo_extra, esdefault, estado, Aplica_Mitades, MutipleCanal) VALUES ('${cod}', ${tipoExpr}, ${Number(lineaRaw)}, '${codigoProducto}', '${codProdEquiv}', '${descModi}', ${costoExtra}, ${esDefaultValue}, '${estadoValue}', ${aplicaMitadesExpr}, ${canalExpr});`,
      ].join('\n');
    }

    const nextValue = toSqlNumber(getModExtraValue(row, index));
    const nextEstado = getModEstadoValue(row, index).trim().toUpperCase();
    if (nextValue === null && nextEstado === '') return null;

    const cod = escapeSqlString(String(detailsCode || row.cod_promo || '').trim());
    const tipoRaw = String(row.tipo_modificador ?? '').trim();
    const codigoProducto = escapeSqlString(String(row.codigo_producto ?? '').trim());
    const canal = escapeSqlString(String(row.MultipleCanal ?? '').trim());

    if (!cod || !tipoRaw || !codigoProducto) return null;

    const tipoCondition = Number.isNaN(Number(tipoRaw))
      ? `Tipo = '${escapeSqlString(tipoRaw)}'`
      : `Tipo = ${Number(tipoRaw)}`;

    const canalCondition = canal ? ` AND MutipleCanal = '${canal}'` : '';
    const setFields: string[] = [];
    if (nextValue !== null) setFields.push(`costo_extra = ${nextValue}`);
    if (nextEstado !== '') setFields.push(`estado = '${escapeSqlString(nextEstado)}'`);

    if (setFields.length === 0) return null;

    return [
      `-- Actualizar costo extra de modificador ${cod}`,
      `UPDATE dbo.Modificadores SET ${setFields.join(', ')} WHERE cod_promo = '${cod}' AND ${tipoCondition} AND codigo_producto = '${codigoProducto}'${canalCondition};`,
    ].join('\n');
  };

  const copyModifierExtraScript = async (row: ModifierRow, index: number) => {
    const script = buildModifierExtraScript(row, index);
    if (!script) {
      showNotice('Ingresa un valor valido en N Costo_Extra o N Estado para generar el script.');
      return;
    }

    try {
      await navigator.clipboard.writeText(script);
      showNotice('Script de costo_extra copiado al portapapeles.');
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', script);
    }
  };

  const getDefaultLabel = (value: unknown) => {
    const normalized = String(value ?? '').trim();
    if (normalized === '1') return 'SI';
    if (normalized === '0') return 'NO';
    return normalized;
  };

  const getEstadoLabel = (value: unknown) => {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'A') return 'ACTIVO';
    if (normalized === 'I') return 'INACTIVO';
    return normalized;
  };

  const getEstadoBadgeClass = (label: string) => {
    if (label === 'ACTIVO') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (label === 'INACTIVO') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getDefaultBadgeClass = (label: string) => {
    if (label === 'SI') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (label === 'NO') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getAllModifierExtraScripts = () => {
    return detailsRows
      .map((row, idx) => buildModifierExtraScript(row, idx))
      .filter((script): script is string => script !== null);
  };

  const copyAllModifierExtraScripts = async () => {
    const scripts = getAllModifierExtraScripts();
    if (scripts.length === 0) {
      showNotice('No hay valores en N Costo_Extra o N Estado para generar script.');
      return;
    }

    const fullScript = [
      `-- Script global N Costo_Extra / N Estado para promo: ${detailsCode}`,
      scripts.join('\n\n'),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(fullScript);
      showNotice(`Script global de N Costo_Extra / N Estado copiado (${scripts.length} linea(s)).`);
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', fullScript);
    }
  };

  const buildSqlScript = (promo: PromoRow, rowKey: string): string | null => {
    const cod = escapeSqlString(String(promo.cod ?? '').trim());
    if (!cod) return null;

    const newP1 = toSqlNumber(getEditedField(rowKey, 'p1'));
    const newP2 = toSqlNumber(getEditedField(rowKey, 'p2'));
    const newP3 = toSqlNumber(getEditedField(rowKey, 'p3'));
    const newEst = getEditedField(rowKey, 'est').trim().toUpperCase();

    const statements: string[] = [];
    if (newP1 !== null) {
      statements.push(`UPDATE dbo.Promos_Enc SET Precio_Venta = ${newP1} WHERE cod_promo = '${cod}';`);
    }

    if (newEst !== '') {
      statements.push(`UPDATE dbo.Promos_Enc SET estado = '${escapeSqlString(newEst)}' WHERE cod_promo = '${cod}';`);
    }

    if (newP2 !== null) {
      statements.push(`UPDATE dbo.PrecioCanal SET Precio_Venta = ${newP2} WHERE cod_promo = '${cod}' AND nivel = 0 AND MutipleCanal = '1,4';`);
    }

    if (newP3 !== null) {
      statements.push(`UPDATE dbo.PrecioCanal SET Precio_Venta = ${newP3} WHERE cod_promo = '${cod}' AND nivel = 0 AND MutipleCanal = '10';`);
    }

    if (statements.length === 0) return null;

    return [
      `-- Script de actualizacion para promo: ${cod}`,
      'BEGIN TRANSACTION;',
      ...statements,
      'COMMIT TRANSACTION;',
    ].join('\n');
  };

  const copySqlScript = async (promo: PromoRow, rowKey: string) => {
    const script = buildSqlScript(promo, rowKey);

    if (!script) {
      showNotice('No hay datos nuevos para generar script en esta fila.');
      return;
    }

    try {
      await navigator.clipboard.writeText(script);
      showNotice('Script copiado al portapapeles.');
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', script);
    }
  };

  const copyAllSqlScripts = async () => {
    const scripts = promos
      .map(promo => buildSqlScript(promo, getRowKey(promo)))
      .filter((script): script is string => script !== null);

    if (scripts.length === 0) {
      showNotice('No hay filas editadas para generar script.');
      return;
    }

    const fullScript = [
      '-- Script global de actualizacion de promos',
      '-- Generado desde Price Manager',
      scripts.join('\n\n'),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(fullScript);
      showNotice(`Script global copiado (${scripts.length} promo(s)).`);
    } catch {
      window.prompt('No se pudo copiar automaticamente. Copia el script manualmente:', fullScript);
    }
  };

  const hasEditedValues = Object.values(editedPrices).some(
    entry => entry.p1.trim() !== '' || entry.p2.trim() !== '' || entry.p3.trim() !== '' || entry.est.trim() !== ''
  );

  const clearEditedPrices = () => {
    if (!hasEditedValues) return;
    setEditedPrices({});
    setShowClearModal(false);
    showNotice('Campos limpiados correctamente.');
  };

  const headerButtonClass = 'inline-flex items-center gap-2 font-black tracking-widest uppercase hover:text-slate-600 transition-colors';
  const tableMinWidthClass = sidebarVisible
    ? 'min-w-[900px] md:min-w-[1040px] xl:min-w-[1280px]'
    : 'min-w-[980px] md:min-w-[1120px] xl:min-w-[1360px]';
  const modalPriceCanalesMinWidthClass = 'min-w-[980px] md:min-w-[1140px] xl:min-w-[1260px]';
  const modalModifiersMinWidthClass = 'min-w-[1000px] md:min-w-[1160px] xl:min-w-[1260px]';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 text-[12px]">
      <nav className="bg-[#0f172a] text-white p-3 shadow-xl flex flex-wrap justify-between items-center gap-2 px-6 sticky top-0 z-50 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500 w-5 h-5" />
          <h1 className="text-lg font-black uppercase tracking-tighter">Price Manager</h1>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={copyAllSqlScripts} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all shadow-lg">
            Script de editados
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            disabled={!hasEditedValues}
            className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all shadow-lg"
          >
            Limpiar
          </button>
          <button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sincronizar DB
          </button>
        </div>
      </nav>

      <div className="mx-auto flex max-w-[98vw] flex-col gap-3 p-3 lg:flex-row lg:items-start">
        <aside className={`rounded-2xl border border-slate-200 bg-white shadow-lg lg:sticky lg:top-[78px] lg:shrink-0 ${sidebarVisible ? 'p-3 lg:w-[240px]' : 'flex items-center justify-center p-2 lg:w-[56px]'}`}>
          {sidebarVisible ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Categorias</h2>
                <button
                  type="button"
                  onClick={() => setSidebarVisible(false)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-1.5 py-1 text-slate-600 transition-colors hover:bg-slate-50"
                  title="Ocultar categorias"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-4 border-t border-slate-200 pt-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                DENNY'S HN
              </p>
              <div className="mt-3 space-y-1.5">
                {categories.map(category => {
                  const isActive = category === selectedCategory;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] font-bold transition-colors ${isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarVisible(true)}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-3 text-[11px] font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              title="Mostrar categorias"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h2 className="text-[12px] font-black uppercase tracking-wide text-slate-700">{selectedCategory}</h2>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Contenido adaptable para ajustes y edicion de promos.</p>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4 font-bold border border-red-200">{error}</div>}

          <input type="text" placeholder="Buscar..." className="w-full px-5 py-3 rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500 shadow-sm mb-6 text-[14px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-3 pt-3 text-[10px] font-semibold text-slate-500">
              Desliza horizontalmente para ver y editar: N Comedor, N LL/Auto, N Agregador y N Estado.
            </div>
            <div className="max-w-full overflow-x-auto pb-2">
            <table className={`w-full text-left ${tableMinWidthClass} text-[11px]`}>
              <thead>
                <tr className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-2.5">
                    <button type="button" onClick={() => toggleSort('cod')} className={headerButtonClass}>
                      Cod. <span className="text-[9px]">{sortBadge('cod')}</span>
                    </button>
                  </th>
                  <th className="p-2.5">
                    <button type="button" onClick={() => toggleSort('cls')} className={headerButtonClass}>
                      Clase <span className="text-[9px]">{sortBadge('cls')}</span>
                    </button>
                  </th>
                  <th className="p-2 min-w-[130px] md:min-w-[170px]">
                    <button type="button" onClick={() => toggleSort('tit')} className={headerButtonClass}>
                      Detalle <span className="text-[9px]">{sortBadge('tit')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-center">
                    <button type="button" onClick={() => toggleSort('per')} className={`${headerButtonClass} justify-center`}>
                      Pers. <span className="text-[9px]">{sortBadge('per')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-center">
                    <button type="button" onClick={() => toggleSort('est')} className={`${headerButtonClass} justify-center`}>
                      Estado <span className="text-[9px]">{sortBadge('est')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-right text-blue-600 font-bold">
                    <button type="button" onClick={() => toggleSort('p1')} className={`${headerButtonClass} justify-end text-blue-600`}>
                      P. COMEDOR <span className="text-[9px]">{sortBadge('p1')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-right text-emerald-600 font-bold">
                    <button type="button" onClick={() => toggleSort('p2')} className={`${headerButtonClass} justify-end text-emerald-600`}>
                      P. LLEV/AUTO <span className="text-[9px]">{sortBadge('p2')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-right text-orange-600 font-bold">
                    <button type="button" onClick={() => toggleSort('p3')} className={`${headerButtonClass} justify-end text-orange-600`}>
                      P. AGREGAD. <span className="text-[9px]">{sortBadge('p3')}</span>
                    </button>
                  </th>
                  <th className="p-2.5 text-center text-blue-800 font-bold">N Comedor</th>
                  <th className="p-2.5 text-center text-emerald-800 font-bold">N LL/Auto</th>
                  <th className="p-2.5 text-center text-orange-800 font-bold">N Agregador</th>
                  <th className="p-2.5 text-center text-violet-800 font-bold">N Estado</th>
                  <th className="p-2.5 text-center text-slate-700 font-bold">Script</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPromos.map((p, i) => {
                  const rowKey = getRowKey(p);
                  const isS = (p.per || '').toString().trim().toUpperCase() === 'S';
                  const pc = Number(p.p1 ?? 0);
                  const pl = p.p2 !== null && p.p2 !== undefined ? Number(p.p2) : null;
                  const pa = p.p3 !== null && p.p3 !== undefined ? Number(p.p3) : null;

                  return (
                    <tr key={`${String(p.cod ?? 'row')}-${i}`} className="hover:bg-slate-50 transition-all">
                      <td className="p-2.5 font-black text-slate-900">{p.cod}</td>
                      <td className="p-2.5 text-[10px] font-black text-indigo-500 uppercase">{p.cls}</td>
                      <td className="p-2 min-w-[120px] max-w-[170px] md:min-w-[150px] md:max-w-[200px] align-top">
                        <button
                          type="button"
                          onClick={() => openModifiersModal(p)}
                          className="w-full text-left text-[10px] font-bold leading-tight text-slate-700 underline decoration-dotted underline-offset-2 hover:text-blue-700 whitespace-normal break-words"
                        >
                          {p.tit}
                        </button>
                        {p.des && (
                          <div title={String(p.des)} className="mt-0.5 text-[8px] font-medium leading-tight text-slate-500 normal-case whitespace-normal break-words cursor-help">
                            {String(p.des)}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${isS ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-400'}`}>{isS ? 'S' : 'N'}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${p.est === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{p.est === 'A' ? 'ACTIVO' : 'INACTIVO'}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-900">L. {pc.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-700">{pl !== null ? `L. ${pl.toFixed(2)}` : '--'}</td>
                      <td className="p-2.5 text-right font-mono font-black text-orange-700">{pa !== null ? `L. ${pa.toFixed(2)}` : '--'}</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={getEditedField(rowKey, 'p1')}
                          onChange={e => handlePriceInputChange(rowKey, 'p1', e.target.value)}
                          placeholder={pc.toFixed(2)}
                          className="mx-auto w-[60px] min-w-[60px] rounded-md border border-blue-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-blue-900 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={getEditedField(rowKey, 'p2')}
                          onChange={e => handlePriceInputChange(rowKey, 'p2', e.target.value)}
                          placeholder={pl !== null ? pl.toFixed(2) : ''}
                          className="mx-auto w-[60px] min-w-[60px] rounded-md border border-emerald-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-emerald-900 outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={getEditedField(rowKey, 'p3')}
                          onChange={e => handlePriceInputChange(rowKey, 'p3', e.target.value)}
                          placeholder={pa !== null ? pa.toFixed(2) : ''}
                          className="mx-auto w-[60px] min-w-[60px] rounded-md border border-orange-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-orange-900 outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={getEditedField(rowKey, 'est')}
                          onChange={e => handlePriceInputChange(rowKey, 'est', e.target.value.toUpperCase())}
                          placeholder={String(p.est ?? '')}
                          maxLength={2}
                          className="mx-auto w-[52px] min-w-[52px] rounded-md border border-violet-200 px-1 py-0.5 text-center text-[10px] font-mono font-bold text-violet-900 uppercase outline-none focus:border-violet-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => copySqlScript(p, rowKey)}
                          className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold text-white hover:bg-slate-700"
                        >
                          <span className="hidden sm:inline">Obtener script</span>
                          <span className="sm:hidden">Script</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {loading && <div className="p-20 text-center font-black text-slate-400 animate-pulse">Sincronizando...</div>}
          </div>
        </main>
      </div>

      {detailsModalOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-900/45 p-2 sm:p-4">
          <div className="flex w-full max-w-[98vw] lg:max-w-[96vw] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-wide text-slate-800">Detalle de Modificadores</h3>
                <p className="text-[11px] font-semibold text-slate-500">{detailsCode} - {detailsTitle}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={togglePriceCanales}
                  className="rounded-md bg-indigo-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-600"
                >
                  Precio Canales
                </button>
                <button
                  type="button"
                  onClick={copyAllModifierExtraScripts}
                  className="rounded-md bg-violet-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-violet-600"
                >
                  <span className="hidden sm:inline">Script N Costo_Extra / N Estado</span>
                  <span className="sm:hidden">Script N CE / NE</span>
                </button>
                <button type="button" aria-label="Cerrar detalle de modificadores" title="Cerrar" onClick={closeDetailsModal} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-4 pt-2 text-[10px] font-semibold text-slate-500">
              Desliza horizontal y verticalmente para ver todos los campos del detalle.
            </div>

            <div className="max-h-[80vh] overflow-auto p-3">
              {showPriceCanales && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-indigo-700">Precio Canales</div>

                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={copyAllPrecioCanalScripts}
                      className="rounded-md bg-indigo-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-600"
                    >
                      <span className="hidden sm:inline">Script PC N Precio_venta / N Costo_Extra</span>
                      <span className="sm:hidden">Script PC N PV / N CE</span>
                    </button>
                  </div>

                  {priceCanalesLoading && (
                    <div className="py-3 text-center text-[11px] font-semibold text-slate-500">Cargando Precio Canales...</div>
                  )}

                  {priceCanalesError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] font-semibold text-red-700">
                      {priceCanalesError}
                    </div>
                  )}

                  {!priceCanalesLoading && !priceCanalesError && priceCanalesRows.length === 0 && (
                    <div className="rounded-md border border-slate-200 bg-white p-2 text-[11px] font-semibold text-slate-600">
                      No se encontraron registros en Precio Canales para esta promo.
                    </div>
                  )}

                  {!priceCanalesLoading && !priceCanalesError && priceCanalesRows.length > 0 && (
                    <div className="overflow-auto">
                      <table className={`w-full ${modalPriceCanalesMinWidthClass} text-left text-[10px]`}>
                        <thead className="bg-indigo-100/80 uppercase tracking-wide text-indigo-700">
                          <tr>
                            <th className="p-2">Clase</th>
                            <th className="p-2">Promo</th>
                            <th className="p-2">Titulo</th>
                            <th className="p-2 text-center">Nivel</th>
                            <th className="p-2">Modificador</th>
                            <th className="p-2">Producto</th>
                            <th className="p-2 text-right">Precio Venta</th>
                            <th className="p-2 text-right">Costo Extra</th>
                            <th className="p-2 text-center">Canal</th>
                            <th className="p-2 text-right text-indigo-700">N Precio_Venta</th>
                            <th className="p-2 text-right text-indigo-700">N Costo_Extra</th>
                            <th className="p-2 text-center">Script</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100/70 bg-white">
                          {[...priceCanalesRows, ...addedPriceCanalesRows].map((row, idx) => {
                            const edit = getPriceCanalEdit(row, idx);
                            const rowKey = row.__isNew
                              ? `new-${row.__clientId}`
                              : `${row.cod_promo ?? 'promo'}-${row.nivel ?? 'nivel'}-${row.codigo_producto ?? 'prod'}-${row.mutiple_canal ?? 'canal'}-${idx}`;

                            return (
                            <tr key={rowKey}>
                              <td className="p-2 text-slate-700">{row.clase}</td>
                              <td className="p-2 font-semibold text-slate-700">{row.cod_promo}</td>
                              <td className="p-2 text-slate-700" title={String(row.titulo_promo ?? '')}>{row.titulo_promo}</td>
                              <td className="p-2 text-center text-slate-700">
                                {row.__isNew ? (
                                  <input
                                    type="text"
                                    value={String(row.nivel ?? '')}
                                    onChange={e => updateAddedPrecioCanalRow(row.__clientId, 'nivel', e.target.value)}
                                    aria-label="NIVEL nuevo registro"
                                    title="NIVEL"
                                    placeholder="Nivel"
                                    className="mx-auto w-[56px] min-w-[56px] rounded-md border border-indigo-200 px-1 py-0.5 text-center text-[10px] font-mono font-bold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  row.nivel
                                )}
                              </td>
                              <td className="p-2 text-slate-700">
                                {row.__isNew ? (
                                  <input
                                    type="text"
                                    value={String(row.descripcion_tipo_modificador ?? '')}
                                    onChange={e => onNewRowModificadorChange(row.__clientId, e.target.value)}
                                    list="modificador-options"
                                    aria-label="MODIFICADOR nuevo registro"
                                    title="MODIFICADOR"
                                    placeholder="Modificador"
                                    className="w-full min-w-[150px] rounded-md border border-indigo-200 px-1 py-0.5 text-[10px] font-semibold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  row.descripcion_tipo_modificador
                                )}
                              </td>
                              <td className="p-2 text-slate-700">
                                {row.__isNew ? (
                                  <input
                                    type="text"
                                    value={String(row.descripcion_corta_producto ?? row.codigo_producto ?? '')}
                                    onChange={e => onNewRowProductoChange(row.__clientId, e.target.value)}
                                    list="producto-options"
                                    placeholder="Producto (codigo o descripcion)"
                                    className="w-full min-w-[120px] rounded-md border border-indigo-200 px-1 py-0.5 text-[10px] font-semibold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  row.descripcion_corta_producto
                                )}
                              </td>
                              <td className="p-2 text-right font-mono font-semibold text-slate-800">
                                {row.__isNew ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    value={String(row.precio_venta ?? '')}
                                    onChange={e => updateAddedPrecioCanalRow(row.__clientId, 'precio_venta', e.target.value)}
                                    aria-label="Precio Venta nuevo registro"
                                    title="Precio Venta"
                                    placeholder="Precio Venta"
                                    className="mx-auto w-[78px] min-w-[78px] rounded-md border border-indigo-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  Number(row.precio_venta ?? 0).toFixed(2)
                                )}
                              </td>
                              <td className="p-2 text-right font-mono font-semibold text-slate-800">
                                {row.__isNew ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    value={String(row.costo_extra ?? '')}
                                    onChange={e => updateAddedPrecioCanalRow(row.__clientId, 'costo_extra', e.target.value)}
                                    aria-label="Costo Extra nuevo registro"
                                    title="Costo Extra"
                                    placeholder="Costo Extra"
                                    className="mx-auto w-[78px] min-w-[78px] rounded-md border border-indigo-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  Number(row.costo_extra ?? 0).toFixed(2)
                                )}
                              </td>
                              <td className="p-2 text-center text-slate-700">
                                {row.__isNew ? (
                                  <input
                                    type="text"
                                    value={String(row.mutiple_canal ?? '')}
                                    onChange={e => updateAddedPrecioCanalRow(row.__clientId, 'mutiple_canal', e.target.value)}
                                    aria-label="Canal nuevo registro"
                                    title="Canal"
                                    placeholder="Canal"
                                    className="mx-auto w-[72px] min-w-[72px] rounded-md border border-indigo-200 px-1 py-0.5 text-center text-[10px] font-mono font-bold text-indigo-900 outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  row.mutiple_canal
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  inputMode="decimal"
                                  value={edit.precioVenta}
                                  onChange={e => updatePriceCanalEdit(row, idx, 'precioVenta', e.target.value)}
                                  placeholder={row.__isNew ? 'Bloqueado' : Number(row.precio_venta ?? 0).toFixed(2)}
                                  disabled={!!row.__isNew}
                                  className={`mx-auto w-[78px] min-w-[78px] rounded-md border px-1 py-0.5 text-right text-[10px] font-mono font-bold outline-none ${row.__isNew ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 text-indigo-900 focus:border-indigo-500'}`}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  inputMode="decimal"
                                  value={edit.costoExtra}
                                  onChange={e => updatePriceCanalEdit(row, idx, 'costoExtra', e.target.value)}
                                  placeholder={row.__isNew ? 'Bloqueado' : Number(row.costo_extra ?? 0).toFixed(2)}
                                  disabled={!!row.__isNew}
                                  className={`mx-auto w-[78px] min-w-[78px] rounded-md border px-1 py-0.5 text-right text-[10px] font-mono font-bold outline-none ${row.__isNew ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 text-indigo-900 focus:border-indigo-500'}`}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => copyPrecioCanalScript(row, idx)}
                                    className="rounded-md bg-indigo-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-600"
                                  >
                                    Script
                                  </button>
                                  {row.__isNew && (
                                    <button
                                      type="button"
                                      onClick={() => removeAddedPrecioCanalRow(row.__clientId)}
                                      className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white hover:bg-rose-500"
                                      title="Eliminar nueva fila"
                                      aria-label="Eliminar nueva fila"
                                    >
                                      x
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>

                      <datalist id="modificador-options">
                        {modificadorOptions.map((item: ModificadorOption, i: number) => (
                          <option
                            key={`${item.codigo_tipo_modificador ?? 'mod'}-${i}`}
                            value={String(item.descripcion_tipo_modificador ?? '')}
                            label={`${String(item.codigo_tipo_modificador ?? '')} - ${String(item.descripcion_tipo_modificador ?? '')}`}
                          />
                        ))}
                      </datalist>

                      <datalist id="producto-options">
                        {productDatalistOptions}
                      </datalist>

                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={addPrecioCanalRow}
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-300 bg-white px-2.5 py-1 text-[11px] font-black text-indigo-700 hover:bg-indigo-50"
                          title="Agregar nuevo registro"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailsLoading && <div className="py-8 text-center text-[12px] font-bold text-slate-500">Cargando modificadores...</div>}
              {detailsError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700">{detailsError}</div>}
              {!detailsLoading && !detailsError && detailsRows.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] font-semibold text-slate-600">
                  No se encontraron modificadores para esta promo.
                </div>
              )}

              {!detailsLoading && !detailsError && detailsRows.length > 0 && (
                <div>
                  <table className={`w-full ${modalModifiersMinWidthClass} text-left text-[11px]`}>
                    <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Linea</th>
                        <th className="p-2">Producto</th>
                        <th className="p-2">Equiv</th>
                        <th className="p-2">Desc. Modi</th>
                        <th className="p-2 text-right">Costo Extra</th>
                        <th className="p-2 text-center">Default</th>
                        <th className="p-2 text-center">Estado</th>
                        <th className="p-2 text-center">Mitades</th>
                        <th className="p-2 text-center">Canal</th>
                        <th className="p-2 text-center text-violet-700">N Costo_Extra</th>
                        <th className="p-2 text-center text-indigo-700">N Estado</th>
                        <th className="p-2 text-center">Script</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...detailsRows, ...addedModifierRows].map((row, idx) => {
                        const defaultLabel = getDefaultLabel(row.esdefault ?? row.EsDefault ?? row.esDefault);
                        const estadoLabel = getEstadoLabel(row.estado_modificador);
                        const rowKey = row.__isNew
                          ? `new-mod-${row.__clientId}`
                          : `${row.codigo_producto ?? 'row'}-${row.Linea ?? idx}-${idx}`;

                        return (
                        <tr key={rowKey} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-700">
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.descripcion_tipo_modificador ?? row.tipo_modificador ?? '')}
                              onChange={e => onNewModifierTipoChange(row.__clientId, e.target.value)}
                              list="tipo-modificador-options"
                              aria-label="TIPO nuevo modificador"
                              title="TIPO"
                              placeholder="Tipo (codigo o descripcion)"
                              className="w-full min-w-[120px] rounded-md border border-violet-200 px-1 py-0.5 text-[10px] font-semibold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.descripcion_tipo_modificador ?? ''
                          )}
                        </td>
                        <td className="p-2 text-slate-700">
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.Linea ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'Linea', e.target.value)}
                              aria-label="LINEA nuevo modificador"
                              title="LINEA"
                              placeholder="Linea"
                              className="w-[70px] min-w-[70px] rounded-md border border-violet-200 px-1 py-0.5 text-center text-[10px] font-semibold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.Linea ?? ''
                          )}
                        </td>
                        <td className="p-2 text-slate-700">
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.codigo_producto ?? '')}
                              onChange={e => onNewModifierProductoChange(row.__clientId, e.target.value)}
                              list="producto-options-mod"
                              aria-label="PRODUCTO nuevo modificador"
                              title="PRODUCTO"
                              placeholder="Producto (codigo o descripcion)"
                              className="w-full min-w-[120px] rounded-md border border-violet-200 px-1 py-0.5 text-[10px] font-semibold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.codigo_producto ?? ''
                          )}
                        </td>
                        <td className="p-2 text-slate-700">
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.CodProd_Equiv ?? '')}
                              readOnly
                              disabled
                              aria-label="EQUIV nuevo modificador"
                              title="EQUIV"
                              placeholder="Equiv"
                              className="w-full min-w-[100px] cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-500"
                            />
                          ) : (
                            row.CodProd_Equiv ?? ''
                          )}
                        </td>
                        <td className="p-2 text-slate-700" title={String(row.desc_modi ?? '')}>
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.desc_modi ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'desc_modi', e.target.value)}
                              aria-label="DESC MODI nuevo modificador"
                              title="DESC. MODI"
                              placeholder="Desc. modi"
                              className="w-full min-w-[140px] rounded-md border border-violet-200 px-1 py-0.5 text-[10px] font-semibold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.desc_modi ?? ''
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-800">
                          {row.__isNew ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={String(row.costo_extra ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'costo_extra', e.target.value)}
                              aria-label="COSTO EXTRA nuevo modificador"
                              title="COSTO EXTRA"
                              placeholder="0"
                              className="mx-auto w-[78px] min-w-[78px] rounded-md border border-violet-200 px-1 py-0.5 text-right text-[10px] font-mono font-bold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.costo_extra !== null && row.costo_extra !== undefined ? Number(row.costo_extra).toFixed(2) : ''
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {row.__isNew ? (
                            <select
                              value={String(row.esdefault ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'esdefault', e.target.value)}
                              aria-label="DEFAULT nuevo modificador"
                              title="DEFAULT"
                              className="mx-auto w-[74px] min-w-[74px] rounded-md border border-violet-200 bg-white px-1 py-0.5 text-center text-[10px] font-mono font-bold text-violet-900 outline-none focus:border-violet-500"
                            >
                              <option value="">--</option>
                              <option value="1">SI</option>
                              <option value="0">NO</option>
                            </select>
                          ) : (
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black ${getDefaultBadgeClass(defaultLabel)}`}>
                              {defaultLabel}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {row.__isNew ? (
                            <select
                              value={String(row.estado_modificador ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'estado_modificador', e.target.value)}
                              aria-label="ESTADO nuevo modificador"
                              title="ESTADO"
                              className="mx-auto w-[82px] min-w-[82px] rounded-md border border-violet-200 bg-white px-1 py-0.5 text-center text-[10px] font-mono font-bold text-violet-900 outline-none focus:border-violet-500"
                            >
                              <option value="">--</option>
                              <option value="A">ACTIVO</option>
                              <option value="I">INACTIVO</option>
                            </select>
                          ) : (
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black ${getEstadoBadgeClass(estadoLabel)}`}>
                              {estadoLabel}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {row.__isNew ? (
                            <select
                              value={String(row.Aplica_Mitades ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'Aplica_Mitades', e.target.value)}
                              aria-label="MITADES nuevo modificador"
                              title="MITADES"
                              className="mx-auto w-[72px] min-w-[72px] rounded-md border border-violet-200 bg-white px-1 py-0.5 text-center text-[10px] font-mono font-bold text-violet-900 outline-none focus:border-violet-500"
                            >
                              <option value="">--</option>
                              <option value="S">SI</option>
                              <option value="N">NO</option>
                            </select>
                          ) : (
                            row.Aplica_Mitades ?? ''
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {row.__isNew ? (
                            <input
                              type="text"
                              value={String(row.MultipleCanal ?? '')}
                              onChange={e => updateAddedModifierRow(row.__clientId, 'MultipleCanal', e.target.value)}
                              list="canal-options-mod"
                              aria-label="CANAL nuevo modificador"
                              title="CANAL"
                              placeholder="Canal"
                              className="mx-auto w-[74px] min-w-[74px] rounded-md border border-violet-200 px-1 py-0.5 text-center text-[10px] font-mono font-bold text-violet-900 outline-none focus:border-violet-500"
                            />
                          ) : (
                            row.MultipleCanal ?? ''
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={getModExtraValue(row, idx)}
                            onChange={e => onModExtraChange(row, idx, e.target.value)}
                            placeholder={row.__isNew ? 'Bloqueado' : row.costo_extra !== null && row.costo_extra !== undefined ? Number(row.costo_extra).toFixed(2) : ''}
                            disabled={!!row.__isNew}
                            className={`mx-auto w-[78px] min-w-[78px] rounded-md border px-1 py-0.5 text-right text-[10px] font-mono font-bold outline-none ${row.__isNew ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-violet-200 text-violet-900 focus:border-violet-500'}`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={getModEstadoValue(row, idx)}
                            onChange={e => onModEstadoChange(row, idx, e.target.value.toUpperCase())}
                            placeholder={row.__isNew ? 'Bloqueado' : String(row.estado_modificador ?? '')}
                            disabled={!!row.__isNew}
                            maxLength={2}
                            className={`mx-auto w-[64px] min-w-[64px] rounded-md border px-1 py-0.5 text-center text-[10px] font-mono font-bold uppercase outline-none ${row.__isNew ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 text-indigo-900 focus:border-indigo-500'}`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyModifierExtraScript(row, idx)}
                              className="rounded-md bg-violet-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-violet-600"
                            >
                              <span className="hidden sm:inline">Obtener script</span>
                              <span className="sm:hidden">Script</span>
                            </button>
                            {row.__isNew && (
                              <button
                                type="button"
                                onClick={() => removeAddedModifierRow(row.__clientId)}
                                className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white hover:bg-rose-500"
                                title="Eliminar nueva fila"
                                aria-label="Eliminar nueva fila"
                              >
                                x
                              </button>
                            )}
                          </div>
                        </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={addModifierRow}
                      className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white px-2.5 py-1 text-[11px] font-black text-violet-700 hover:bg-violet-50"
                      title="Agregar nuevo modificador"
                    >
                      +
                    </button>
                  </div>
                  <datalist id="tipo-modificador-options">
                    {modifierDatalistOptions}
                  </datalist>

                  <datalist id="producto-options-mod">
                    {productDatalistOptions}
                  </datalist>

                  <datalist id="canal-options-mod">
                    <option value="1,4" />
                    <option value="10" />
                    <option value="1" />
                    <option value="4" />
                    <option value="2" />
                  </datalist>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {copyNotice && (
        <div className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-md bg-slate-900/95 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg border border-slate-700">
          {copyNotice}
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 text-[11px] font-black uppercase tracking-wider text-rose-700">Confirmar limpieza</div>
            <p className="text-[12px] font-semibold text-slate-700">
              Se borraran todos los valores nuevos ingresados en esta sesion.
            </p>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              Esta accion no afecta la base de datos, solo los campos capturados en pantalla.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearEditedPrices}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-rose-500"
              >
                Limpiar ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
