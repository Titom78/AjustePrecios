const sql = require('mssql');
const { getSqlConfig } = require('./dbConfig.cjs');

const config = getSqlConfig({ validateRequired: true });

async function validate() {
    try {
        console.log('--- Intentando conectar ---');
        let pool = await sql.connect(config);
        console.log('--- Conectado ---');
        
        let query = `
            SELECT TOP 2
                p.cod_promo, 
                p.titulo_promo, 
                p.desc_promo, 
                p.estado, 
                p.EsPersonalizada,
                p.Precio_Venta AS p_comedor
            FROM dbo.Promos_Enc p
        `;
        
        let result = await pool.request().query(query);
        console.log('--- RESULTADO RAW (Primeras 2 filas) ---');
        console.log(JSON.stringify(result.recordset, null, 2));
        
        if (result.recordset.length > 0) {
            console.log('\n--- KEYS EXACTAS ---');
            console.log(Object.keys(result.recordset[0]));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('--- ERROR DETECTADO ---');
        console.error(err);
        process.exit(1);
    }
}

validate();
