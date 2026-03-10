const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function test() {
    try {
        let pool = await sql.connect(config);
        let query = `
            SELECT TOP 1
                p.cod_promo, 
                p.Precio_Venta AS p_comedor,
                MAX(CASE WHEN pc.MutipleCanal = '1,4' THEN pc.Precio_Venta ELSE NULL END) AS p_llevar
            FROM dbo.Promos_Enc p
            LEFT JOIN dbo.PrecioCanal pc ON p.cod_promo = pc.cod_promo
            WHERE p.cod_promo = 'D3037'
            GROUP BY p.cod_promo, p.Precio_Venta
        `;
        let result = await pool.request().query(query);
        console.log('RESULTADO REAL SQL:', result.recordset[0]);
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
test();
