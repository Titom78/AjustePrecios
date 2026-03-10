const sql = require('mssql');
const config = {
    user: 'bcp',
    password: 'comidas1',
    server: '172.31.13.24',
    database: 'POSGC_DNS01',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

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
