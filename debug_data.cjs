const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function debug() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT cod_promo, EsPersonalizada FROM Promos_enc WHERE cod_promo = 'D3037'");
        console.log('--- DEBUG PRODUCTO D3037 ---');
        console.log('Objeto completo:', result.recordset[0]);
        console.log('Keys encontradas:', Object.keys(result.recordset[0]));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
debug();
