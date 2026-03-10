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
        let result = await pool.request().query("SELECT p.cod_promo, p.EsPersonalizada FROM Promos_enc p WHERE p.cod_promo = 'D3037'");
        console.log('RESULTADO SQL:', JSON.stringify(result.recordset[0]));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
test();
