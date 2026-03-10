const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function test() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT p.cod_promo, p.EsPersonalizada FROM Promos_enc p WHERE p.cod_promo = 'D3037'");
        console.log('RESULTADO SQL:', JSON.stringify(result.recordset[0]));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
test();
