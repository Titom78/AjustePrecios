const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { getSqlConfig } = require('./dbConfig.cjs');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ? String(process.env.CORS_ORIGIN).trim() : '';
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json());

let config;
try {
    config = getSqlConfig({ validateRequired: true });
} catch (err) {
    console.error(err.message);
    process.exit(1);
}

app.get('/api/promos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        
        // 1. Catálogo principal
        let promosReq = await pool.request().query(`
            SELECT 
                LTRIM(RTRIM(cod_promo)) as cod, 
                titulo_promo as tit, 
                desc_promo as des, 
                estado as est, 
                EsPersonalizada as per, 
                Precio_Venta as p1,
                codigo_clase_producto as cid
            FROM dbo.Promos_Enc
        `);
        
        // 2. Precios por canal
        let canalesReq = await pool.request().query(`
            SELECT 
                LTRIM(RTRIM(cod_promo)) as cod, 
                LTRIM(RTRIM(MutipleCanal)) as canal, 
                Precio_Venta as val
            FROM dbo.PrecioCanal 
            WHERE MutipleCanal IN ('1,4', '1', '4', '10')
        `);

        // 3. Clases
        let clasesReq = await pool.request().query(`SELECT codigo_clase_producto as cid, Descripcion_Clase_Producto as cls FROM dbo.Clases_Productos`);

        const promos = promosReq.recordset;
        const canales = canalesReq.recordset;
        const clases = clasesReq.recordset;

        const finalData = promos.map(p => {
            const claseObj = clases.find(c => c.cid === p.cid);
            const preciosItem = canales.filter(c => c.cod === p.cod);
            
            // Buscamos precio Llevar (1,4 o 1 o 4)
            const pLlevar = preciosItem.find(c => c.canal === '1,4' || c.canal === '1' || c.canal === '4');
            // Buscamos precio Agregador (10)
            const pAgreg = preciosItem.find(c => c.canal === '10');

            return {
                cod: p.cod,
                tit: p.tit,
                des: p.des,
                est: p.est,
                per: p.per,
                cls: claseObj ? claseObj.cls : 'GENERAL',
                p1: p.p1 || 0, // COMEDOR
                p2: pLlevar ? pLlevar.val : null, // LLEVAR
                p3: pAgreg ? pAgreg.val : null  // AGREGADORES
            };
        });

        console.log(`Enviando ${finalData.length} registros. D3037 p1: ${finalData.find(x=>x.cod==='D3037')?.p1}`);
        res.json(finalData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/modificadores/:cod', async (req, res) => {
    const cod = String(req.params.cod || '').trim();

    if (!cod) {
        return res.status(400).json({ error: 'Parametro cod requerido.' });
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('cod', sql.VarChar(30), cod);

        const result = await request.query(`
            SELECT
                Modificadores.cod_promo,
                Promos_Enc.titulo_promo,
                Promos_Enc.estado as estado_promo,
                Modificadores.Tipo as tipo_modificador,
                descripcion_tipo_modificador,
                Linea,
                codigo_producto,
                CodProd_Equiv,
                desc_modi,
                costo_extra,
                CAST(Modificadores.esdefault AS varchar(10)) as esdefault,
                Modificadores.estado as estado_modificador,
                Modificadores.Aplica_Mitades,
                MultipleCanal
            FROM dbo.Modificadores
            JOIN dbo.Promos_Enc ON dbo.Modificadores.cod_promo = Promos_Enc.cod_promo
            JOIN dbo.Tipos_Modificadores ON dbo.Modificadores.Tipo = dbo.Tipos_Modificadores.codigo_tipo_modificador
            WHERE Modificadores.cod_promo = @cod
            ORDER BY Tipo, Linea
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/precio-canales/:cod', async (req, res) => {
    const cod = String(req.params.cod || '').trim();

    if (!cod) {
        return res.status(400).json({ error: 'Parametro cod requerido.' });
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('cod', sql.VarChar(30), cod);

        const result = await request.query(`
            SELECT
                ISNULL(Clases_Productos.DESCRIPCION_CLASE_PRODUCTO, 'SIN CLASE') AS clase,
                ISNULL(PrecioCanal.CODIGO_CLASE_PRODUCTO, 'SIN CLASE') AS codigo_clase_producto,
                ISNULL(PrecioCanal.cod_promo, 'SIN PROMO') AS cod_promo,
                ISNULL(Promos_Enc.titulo_promo, 'SIN TITULO') AS titulo_promo,
                ISNULL(CAST(PrecioCanal.Nivel AS varchar(20)), 'SIN NIVEL') AS nivel,
                ISNULL(NULLIF(LTRIM(RTRIM(Tipos_Modificadores.descripcion_tipo_modificador)), ''), 'SIN MODIFICADOR') AS descripcion_tipo_modificador,
                ISNULL(NULLIF(LTRIM(RTRIM(Maestro_Productos.DESCRIPCION_CORTA_PRODUCTO)), ''), 'SIN PRODUCTO') AS descripcion_corta_producto,
                ISNULL(PrecioCanal.codigo_producto, 'SIN PRODUCTO') AS codigo_producto,
                ISNULL(PrecioCanal.Precio_Venta, 0) AS precio_venta,
                ISNULL(PrecioCanal.costo_extra, 0) AS costo_extra,
                ISNULL(PrecioCanal.MutipleCanal, 'SIN CANAL') AS mutiple_canal
            FROM dbo.PrecioCanal
            JOIN dbo.Promos_Enc
                ON dbo.PrecioCanal.cod_promo = dbo.Promos_Enc.cod_promo
            JOIN dbo.Clases_Productos
                ON dbo.PrecioCanal.CODIGO_CLASE_PRODUCTO = dbo.Clases_Productos.CODIGO_CLASE_PRODUCTO
            LEFT JOIN dbo.Tipos_Modificadores
                ON dbo.PrecioCanal.MultipleTipo = dbo.Tipos_Modificadores.codigo_tipo_modificador
            LEFT JOIN dbo.Maestro_Productos
                ON dbo.PrecioCanal.codigo_producto = dbo.Maestro_Productos.CODIGO_PRODUCTO
            WHERE PrecioCanal.cod_promo = @cod
            ORDER BY Promos_Enc.cod_promo, PrecioCanal.Nivel DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/catalogos/precio-canales', async (_req, res) => {
    try {
        const pool = await sql.connect(config);

        const modificadoresReq = await pool.request().query(`
            SELECT
                codigo_tipo_modificador,
                descripcion_tipo_modificador
            FROM dbo.Tipos_Modificadores
            ORDER BY descripcion_tipo_modificador
        `);

        const productosReq = await pool.request().query(`
            SELECT
                CODIGO_PRODUCTO,
                DESCRIPCION_CORTA_PRODUCTO
            FROM dbo.Maestro_Productos
            ORDER BY DESCRIPCION_CORTA_PRODUCTO
        `);

        res.json({
            modificadores: modificadoresReq.recordset,
            productos: productosReq.recordset,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = Number.parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Servidor API corriendo en ${HOST}:${PORT}`);
});
