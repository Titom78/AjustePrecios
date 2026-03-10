const sql = require('mssql');

const config = {
    user: 'bcp',
    password: 'comidas1',
    server: '172.31.13.24',
    database: 'POSGC_DNS01',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function test() {
    try {
        let pool = await sql.connect(config);
        
        let promosReq = await pool.request().query(`
            SELECT TOP 1 p.cod_promo, p.titulo_promo, p.desc_promo, p.estado, p.EsPersonalizada, p.Precio_Venta, c.Descripcion_Clase_Producto
            FROM dbo.Promos_Enc p
            LEFT JOIN dbo.Clases_Productos c ON p.codigo_clase_producto = c.codigo_clase_producto
            WHERE p.cod_promo = 'D3037'
        `);
        
        let canalesReq = await pool.request().query(`
            SELECT cod_promo, MutipleCanal, Precio_Venta 
            FROM dbo.PrecioCanal 
            WHERE cod_promo = 'D3037' AND MutipleCanal IN ('1,4', '10')
        `);

        const promosRaw = promosReq.recordset;
        const canalesRaw = canalesReq.recordset;

        console.log('PROMOS RAW:', JSON.stringify(promosRaw[0], null, 2));
        console.log('CANALES RAW:', JSON.stringify(canalesRaw, null, 2));

        const getVal = (obj, key) => {
            if (!obj) return null;
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
            return foundKey ? obj[foundKey] : null;
        };

        const finalData = promosRaw.map(p => {
            const codPromo = getVal(p, 'cod_promo');
            const preciosCanal = canalesRaw.filter(c => getVal(c, 'cod_promo') === codPromo);
            
            const itemLlevar = preciosCanal.find(c => getVal(c, 'MutipleCanal') === '1,4');
            const itemAgregador = preciosCanal.find(c => getVal(c, 'MutipleCanal') === '10');

            return {
                cod: codPromo || "N/A",
                tit: getVal(p, 'titulo_promo') || "",
                des: getVal(p, 'desc_promo') || "",
                est: getVal(p, 'estado') || "I",
                per: getVal(p, 'EsPersonalizada') || "N",
                cls: getVal(p, 'Descripcion_Clase_Producto') || "GENERAL",
                p_comedor: getVal(p, 'Precio_Venta') || 0,
                p_llevar: itemLlevar ? getVal(itemLlevar, 'Precio_Venta') : 0,
                p_agreg: itemAgregador ? getVal(itemAgregador, 'Precio_Venta') : 0
            };
        });

        console.log('FINAL MAPPED DATA:', JSON.stringify(finalData[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
