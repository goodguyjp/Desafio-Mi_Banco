//CREATE DATABASE banco;

// CREATE TABLE transferencias( 
//   descripcion varchar(50) NOT NULL,
//   fecha varchar(10) NOT NULL,
//   monto INT NOT NULL,
//   cuenta_origen INT NOT NULL, 
//   cuenta_destino INT NOT NULL  
//   );

//   CREATE TABLE cuentas (
//       id INT PRIMARY KEY,
//        saldo DECIMAL CHECK (saldo >= 0)
       
//     );

const {Pool} = require('pg');

const config = {
    user: "postgres",
    password: "admin",
    host: "localhost",
    database: "banco",
    port: 5500,
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000
};

const pool = new Pool(config);

const argumentos = process.argv.slice(2);
const funcion = argumentos[0];
const cuenta_origen = argumentos[1];
const cuenta_destino = argumentos[2];
const fecha = argumentos[3];
const monto = argumentos[4];
const descripcion = argumentos[5];

const nuevaTransferencia = async () => {
    const actualizarCuentaOrigen = {
        text: `UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2 RETURNING*;`,
        values: [monto, cuenta_origen]
    };
    const actualizarCuentaDestino = {
        text: `UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2 RETURNING*;`,
        values: [monto, cuenta_destino]
    };

    const nuevaTransf = {
        text: `INSERT INTO transferencias values($1, $2, $3, $4, $5) RETURNING*;`,
        values: [descripcion, fecha, monto, cuenta_origen, cuenta_destino]
    };
    try{
        await pool.query('BEGIN');
        const resultado = await pool.query(nuevaTransf)
        await pool.query(actualizarCuentaOrigen);
        await pool.query(actualizarCuentaDestino);
        console.log('Transferencia realizada con exito');
        console.log('Ultima transferencia registrada: ', resultado.rows[0]);
        await pool.query('COMMIT');
        
    } catch(error){
        await pool.query('ROLLBACK');

        console.log("Error código: " + error.code);

        console.log("Detalle del error: " + error.detail);

        console.log("Tabla originaria del error: " + error.table);

        console.log("Restricción violada en el campo: " + error.constraint);

    }finally {
        pool.end();
    }
};

// node index.js nueva 'Prestamo' '11-04-2022' 5000 1 2

const consultaTransferencia = async () =>{
    const resultado = await pool.query(`SELECT * FROM transferencias WHERE cuenta_origen = ${cuenta_origen} LIMIT 10`);
    console.log(`Las ultimas transferencias de la cuenta ${cuenta_origen} son: `);
    console.log(resultado.rows);
    pool.end();
}

const consultaSaldo = async () => {
    try{
    
    const {rows: [{saldo}]} = await pool.query(`SELECT * from cuentas WHERE id= ${cuenta_origen}`);
    console.log(`El saldo de la cuenta (${cuenta_origen}) es: ${saldo}`);
    pool.end();

    } catch(error){
        console.log(error);
    }finally{
        pool.end();
    };
    
};

(async() => {
   
        if(funcion === 'nueva'){
            await nuevaTransferencia();
        }else if(funcion === 'consulta'){
            await consultaTransferencia();
        }else if(funcion === 'consulta-saldo'){
            await consultaSaldo();
        }else{
            console.log("funcion incorrecta");
        }

})();