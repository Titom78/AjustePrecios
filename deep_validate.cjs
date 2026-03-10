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

async function deepValidate() {
    try {
        console.log('Connecting to SQL...');
        let pool = await sql.connect(config);
        
        console.log('Fetching Promos...');
        let promosReq = await pool.request().query(`
            SELECT TOP 5 p.cod_promo, p.titulo_promo, p.Precio_Venta, p.EsPersonalizada
            FROM dbo.Promos_Enc p
        `);
        
        console.log('Fetching Canales...');
        let canalesReq = await pool.request().query(`
            SELECT TOP 10 cod_promo, MutipleCanal, Precio_Venta 
            FROM dbo.PrecioCanal 
            WHERE MutipleCanal IN ('1,4', '10')
        `);

        const promos = promosReq.recordset;
        const canales = canalesReq.recordset;

        console.log('--- RAW DATA FROM SQL (FIRST PROMO) ---');
        console.log(JSON.stringify(promos[0], null, 2));

        const getProp = (obj, name) => {
            const key = Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
            return key ? obj[key] : null;
        };

        const finalData = promos.map(p => {
            const cod = getProp(p, 'cod_promo');
            const p_comedor = getProp(p, 'Precio_Venta');
            
            const canalLlevar = canales.find(c => getProp(c, 'cod_promo') === cod && getProp(c, 'MutipleCanal') === '1,4');
            const canalAgreg = canales.find(c => getProp(c, 'cod_promo') === cod && getProp(c, 'MutipleCanal') === '10');

            return {
                cod_promo: cod,
                precio_comedor: p_comedor,
                precio_llevar: canalLlevar ? getProp(canalLlevar, 'Precio_Venta') : null,
                precio_agreg: canalAgreg ? getProp(canalAgreg, 'Precio_Venta') : null
            };
        });

        console.log('--- PROCESSED DATA (TO BE SENT TO FRONTEND) ---');
        console.log(JSON.stringify(finalData[0], null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Validation failed:', err);
        process.exit(1);
    }
}

deepValidate();
