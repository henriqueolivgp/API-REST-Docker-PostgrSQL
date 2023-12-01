const express =require("express");

const app = express();
const port = 8080;

const {Pool} = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
});

app.get('/', (req,res) => {

    res.send("Hello World!!");

});

app.use(express.json());

async function createAlbumsTable() {
    try{
        const query = `
        CREATE TABLE IF NOT EXISTS albums (
            id SERIAL PRIMARY KEY,
            title VARCHAR(350) NOT NULL,
            artist VARCHAR(350) NOT NULL,
            price NUMERIC(10, 2)
        );
        `;
        await pool.query(query);
        console.log('Albums table created');
    }catch (err){
        console.error(err);
        console.error('Albums table creation failed');
    }
}

createAlbumsTable();

// create new album
app.post('/albums', async (req, res) => {
    // Validate the incoming JSON data
    const { title, artist, price } = req.body;
    console.log(req.body);
    if (!title || !artist || !price) {
    return res.status(400).send('One of the title, or artist, or priceis missing in the data');
    }
    try {
    // try to send data to the database
    const query = `
    INSERT INTO albums (title, artist, price)
    VALUES ($1, $2, $3)
    RETURNING id;
    `;
    const values = [title, artist, price];
    const result = await pool.query(query, values);
    res.status(201).send({ message: 'New Album created', albumId:
    result.rows[0].id });
    } catch (err) {
    console.error(err);
    res.status(500).send('some error has occured');
    }
    });

// get all
app.get('/albums', async (req, res) => {
    try{
        const query = `SELECT * FROM albums;`;
        const {rows} = await pool.query(query);
        res.status(200).json(rows); 
    }catch(err){
        console.error(err);
        res.status(500).send('failed');
    }
});

// update album
app.put('/albums/:id', async (req,res) => {
    try{
        const {id} = req.params;
        const {title, artist, price} = req.body;

        if(!title && !artist && !price){
            return res.status(400).send('provide a failed (title, artist or price) ');
        }
        const query = `
            UPDATE albums
            SET title = COALESCE($1, title),
                artist = COALESCE($2, artist),
                price = COALESCE($3, price)
            WHERE id = $4
            RETURNING *;
        `;
        const {rows} =await pool.query(query, [title, artist, price, id]);

        if (rows.length === 0){
            return res.status(404).send('Cannot find anything');
        }
        res.status(200).json(rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).send('Some error has occured failed');
    }
});

// delete album
app.delete('/albums/:id', async (req,res) => {

    try{
        const {id} = req.params;
        const query = `DELETE FROM albums WHERE id = $1 RETURNING *;`;
        const {rows} = await pool.query(query,[id]);

        if(rows.length === 0){
            return res.status(404).send('we have not found the album');
        }
        
        res.status(200).json(rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).send('some error has occured');
    }

});

app.listen(port, () => {

    console.log(`Example app listening on port ${port}`);

});

