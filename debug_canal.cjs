const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function test() {
    try {
        let pool = await sql.connect(config);
        console.log('--- DEBUG PRECIOCANAL D3037 ---');
        let query = `
            SELECT 
                cod_promo, 
                MutipleCanal, 
                LEN(MutipleCanal) as Longitud,
                CAST(MutipleCanal AS VARBINARY) as HexValue,
                Precio_Venta
            FROM dbo.PrecioCanal 
            WHERE cod_promo = 'D3037'
        `;
        let result = await pool.request().query(query);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
