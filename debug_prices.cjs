const sql = require('mssql');
const config = {
    user: 'bcp',
    password: 'comidas1',
    server: '172.31.13.24',
    database: 'POSGC_DNS01',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

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
