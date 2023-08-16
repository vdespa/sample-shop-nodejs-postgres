const express = require('express');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 3000 // 3 seconds
});

app.use(express.static('public'));

// Front-end routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/status', (req, res) => {
    res.sendFile(__dirname + '/public/status.html');
});

app.get('/products', (req, res) => {
    res.sendFile(__dirname + '/public/products.html');
});

// API Endpoints
app.get('/api/status', async (req, res) => {
    const dbConnection = await testIfDbConnectionIsSuccessful();
    const dbExistence = await testIfDatabaseExists();
    res.json({
        appStatus: 'UP',
        dbConnection: dbConnection,
        dbExistence: 'DOWN'
    });
});

app.get('/api/products', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function testIfDbConnectionIsSuccessful() {
    const pool = new Pool({
        host: process.env.RDS_HOSTNAME,
        port: process.env.RDS_PORT,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 3000 // 3 seconds
    });
    try {
        await pool.query('SELECT NOW();');
        return 'UP';
    } catch (error) {
        return `DOWN.`;
    }
}

async function testIfDatabaseExists() {
    const pool = new Pool({
        host: process.env.RDS_HOSTNAME,
        port: process.env.RDS_PORT,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 3000 // 3 seconds
    });
    try {
        const { rows } = await pool.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.RDS_DB_NAME}'`);
        if (rows) {
            return 'UP';
        }
        return 'DOWN';
    } catch (error) {
        return `DOWN.`;
    }
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});