const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function inspect() {
    try {
        let pool = await sql.connect(config);
        console.log('--- INSPECCION PRECIOCANAL D3037 ---');
        let result = await pool.request().query("SELECT cod_promo, MutipleCanal, Precio_Venta FROM dbo.PrecioCanal WHERE cod_promo = 'D3037'");
        console.table(result.recordset);
        
        console.log('\n--- INSPECCION PROMOS_ENC D3037 ---');
        let result2 = await pool.request().query("SELECT cod_promo, Precio_Venta FROM dbo.Promos_Enc WHERE cod_promo = 'D3037'");
        console.table(result2.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
inspect();
