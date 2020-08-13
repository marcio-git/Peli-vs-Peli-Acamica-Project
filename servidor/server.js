require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const controlador = require('./controladores/controladores');
const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/competencias', controlador.datosCompetencias)
app.get('/generos', controlador.cargarGeneros)
app.get('/directores', controlador.cargarDirectores)
app.get('/actores', controlador.cargarActores)
app.get('/competencias/:id', controlador.getCompetencia)
app.put('/competencias/:id', controlador.editar)
app.post('/competencias/:id/voto', controlador.votar)
app.post('/competencias', controlador.crear)
app.delete('/competencias/:id/votos', controlador.reiniciar)
app.delete('/competencias/:id', controlador.eliminar)
app.get("/competencias/:id/peliculas", controlador.getPeliculas)
app.get('/competencias/:id/resultados', controlador.getResultados)

app.listen('8080', () => console.log('Escuchando...'))
