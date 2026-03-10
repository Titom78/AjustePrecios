const net = require('net');
const { getDbTarget, assertDbEnvVars } = require('./dbConfig.cjs');

assertDbEnvVars();

const client = new net.Socket();
const { host, port } = getDbTarget();

console.log(`Intentando conectar a ${host}:${port}...`);

client.setTimeout(5000);

client.connect(port, host, function() {
    console.log('>>> EXITO: El puerto 1433 está ABIERTO. La red está OK.');
    process.exit(0);
});

client.on('error', function(err) {
    console.log('>>> ERROR DE RED: No se pudo alcanzar el servidor.');
    console.log('Detalle:', err.message);
    process.exit(1);
});

client.on('timeout', function() {
    console.log('>>> ERROR: Tiempo de espera agotado. El servidor no responde.');
    client.destroy();
    process.exit(1);
});
