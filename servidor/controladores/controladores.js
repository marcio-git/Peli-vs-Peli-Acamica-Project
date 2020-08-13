const connection = require('../lib/conexionbd');
const mysql = require('mysql');

const controlador = {

  cargarDatos: (tabla, res) => {
    let consulta = "SELECT * FROM ??";
    connection.query(consulta, tabla, (error, results) => {
      if (error) return res.status(500).json(error)
      if (results.length == 0) {
        console.log(`Hubo un error en su consulta ${error.message}`)
        return res.status(404).send(`Error en su consulta: cargar ${tabla}`)
      }
      return res.status(200).send(JSON.stringify(results))
    })
  },
  
  datosCompetencias: (req, res) => {
    controlador.cargarDatos('competencias', res)
  },

  cargarGeneros: (req, res) => {
    controlador.cargarDatos('genero', res)
  },

  cargarActores: (req, res) => {
    controlador.cargarDatos('actor', res)
  },

  cargarDirectores: (req, res) => {
    controlador.cargarDatos('director', res)
  },

  /* -------------------------------------------------------------------------- */

  getPeliculas: (req, res) => {
    let idCompetencia = req.params.id
    let competencia = "SELECT * FROM ?? WHERE id = ?";
    let inserts = ['competencias', idCompetencia]
    let consulta = mysql.format(competencia, inserts);
    //obtiene nombre de competencia
    connection.query(consulta, (error, results) => {
      if (error) {
        console.log('Hubo un error en su consulta ' + error.message)
        return res.status(404).send('Error en su consulta: obtener peliculas')
      }
      let response = {
        'competencia': results[0].nombre
      }
      let condicion = ''
      //recorre por cada clave del objeto obtenido de la 1ra consulta
      Object.keys(results[0]).forEach(key => {
        if (results[0][key]) {
          switch (key) {
            case 'actor_id':
              condicion += condicion.length === 0 ? ' WHERE ' : ' AND ';
              condicion += `p.id in (SELECT pelicula_id FROM actor_pelicula WHERE actor_id = ${results[0].actor_id})
              `;
              break;
            case 'genero_id':
              condicion += condicion.length === 0 ? ' WHERE ' : ' AND ';
              condicion += `p.genero_id = ${results[0].genero_id}
              `;
              break;
            case 'director_id':
              condicion += condicion.length === 0 ? ' WHERE ' : ' AND ';
              condicion += `p.director in (SELECT nombre FROM director WHERE id = ${results[0].director_id})
              `;
              break;
            default:
              break;
          }
        }
      });
    
      let peliculasRandom = `SELECT DISTINCT p.id, p.titulo, p.poster 
          FROM pelicula AS p ${condicion} 
          ORDER BY RAND() LIMIT 2`;

      //obtiene peliculas
      connection.query(peliculasRandom, (error, results) => {
        if (error) {
          console.log('Hubo un error en su consulta ' + error.message)
          return res.status(404).send('Error en su consulta: obtener peliculas' + error.message)
        }
        response.peliculas = results
        res.status(200).send(JSON.stringify(response))
      })
    })
  },
  /* -------------------------------------------------------------------------- */

  getCompetencia: (req, res) => {
    let consulta = `SELECT c.nombre, g.nombre as genero_nombre, a.nombre as actor_nombre, d.nombre as director_nombre 
        FROM competencias c 
        LEFT OUTER JOIN genero g ON c.genero_id = g.id
        LEFT OUTER JOIN actor a ON c.actor_id = a.id
        LEFT OUTER JOIN director d ON c.director_id = d.id 
        WHERE c.id = ?`;
      
      connection.query(consulta, req.params.id,(error, results) => {
        if (error) {
          console.log(`Hubo un error obteniendo competencias ${error.message}`)
          return res.status(500).send(`Error obteniendo competencias ${error.message}`)
        }
        if (results == []) {
          console.log('Hubo un error encontraron resultados')
          return res.status(404).send(`No se encontraron resultados`)
        }
        res.status(200).send(JSON.stringify(results[0]))
      })
  },

  /* -------------------------------------------------------------------------- */

  getResultados: (req, res) => {
    let idCompetencia = parseInt(req.params.id)
    let consulta = `SELECT competencia_id, competencias.nombre, pelicula_id, titulo, pelicula.poster, COUNT(*) AS votos 
        FROM votos 
        JOIN competencias 
        ON votos.competencia_id = competencias.id 
        JOIN pelicula 
        ON votos.pelicula_id = pelicula.id 
        WHERE votos.competencia_id = ? 
        GROUP BY competencia_id, pelicula_id 
        HAVING votos >= 1 
        ORDER BY votos DESC LIMIT 3;`
    
    connection.query(consulta, idCompetencia, (error, results) => {
      if (error) {
        console.log('Error obtener resultados ' + error.message)
        res.status(500).send('Error Resultados')
      }
      let response = {
        'resultados': results
      }
      consulta = `SELECT nombre FROM competencias WHERE id = ?`
      connection.query(consulta, idCompetencia, 
        (error, results) => {
          if (error) {
            console.log('Hubo un error en la consulta', error.message);
            return res.status(500).send('Hubo un error en la consulta');
        }
          if (results.length == 0) {
            console.log('Error obtener competencia ' + error.message)
            return res.status(404).send('Error Resultados')
          }
          response.competencia = results[0].nombre
          res.status(200).send(JSON.stringify(response))
        })
    })
  },

  /* -------------------------------------------------------------------------- */

  votar: (req, res) => {
    let pelicula = req.body.idPelicula;
    let idCompetencia = req.params.id
    let consulta = `INSERT INTO ?? (pelicula_id, competencia_id) VALUES (?,?)`
    let inserts = ['votos', pelicula, idCompetencia]
    consulta = mysql.format(consulta, inserts)

    connection.query(consulta, (error, results) => {
      if (error) {
        console.log('Error de inserción ' + error.message)
        res.status(500).send('Error')
      }
      res.status(200).send(`Se actualizo la tabla votos: Pelicula: ${pelicula} - Competencia: ${idCompetencia}`)
    })
  },

  /* -------------------------------------------------------------------------- */

  crear: (req, res) => {
    let competencia = req.body.nombre
    let genero = req.body.genero === '0' ? null : parseInt(req.body.genero);
    let director = req.body.director === '0' ? null : parseInt(req.body.director);
    let actor = req.body.actor === '0' ? null : parseInt(req.body.actor);

    //se comprueba que el nombre exista
    if (!competencia || competencia == '') {
      return res.status(422).send(`Por favor ingrese un nombre`);
    }
    //se verifica si la competencia existe
    connection.query('SELECT * FROM ?? WHERE nombre = ?', ['competencias', competencia], 
    (error, results) => {
      if (error) {
        console.log('Error ' + error.message)
        return res.status(404).send(`Hubo un error al consultar la existencia de la competencia`);
      }
      if (results.length !== 0) {
        res.status(422).send(`La competencia '${competencia}' ya existe 😔`);
        return;
      }

      //se valida que existan al menos dos competencias con los filtros
      //COUNT(DISTINCT titulo) me sirve para evitar que cuente las peliculas mas de una vez si tienen mas de un director
      let consulta = `SELECT COUNT(DISTINCT titulo) AS total FROM pelicula 
        JOIN (actor, genero, director, actor_pelicula, director_pelicula) 
          ON (actor.id = actor_id 
            AND genero.id = pelicula.genero_id 
            AND director.id = director_id 
            AND pelicula.id = actor_pelicula.pelicula_id 
            AND pelicula.id = director_pelicula.pelicula_id) 
        WHERE 1 = 1`
      
      let genero_id = genero
      let actor_id = actor
      let director_id = director
      genero == null ? genero_id = false : consulta+=` AND genero_id = ?`
      actor == null ? actor_id = false : consulta+=` AND actor_id = ?`
      director == null ? director_id = false : consulta+=` AND director_id = ?`

      let inserts = [genero_id, actor_id, director_id]
      //se filtra el array
      inserts = inserts.filter(e => e !== false)

      connection.query(consulta, inserts, (error, results) => {
        if (error) {
          console.log('Error ' + error.message)
          return res.status(500).send('Hubo un error: validación 2 peliculas')
        } else if (results[0].total < 1 || results[0].total === undefined) {
          return res.status(422).send('No es posible crear una competencia con los filtros que eligió');
        }
        consulta = `INSERT INTO ?? (nombre, genero_id, director_id, actor_id) VALUES (?,?,?,?)`
        inserts = ['competencias', competencia, genero, director, actor]
        consulta = mysql.format(consulta, inserts)

        //se ejecuta la inserción
        connection.query(consulta, (error, results) => {
          if (error) return res.status(500).json(error)
          if (results.affectedRows < 1) {
            console.log(error.message)
            return res.status(404).send('Error en su consulta: cargar directores')
          }
          res.status(200).send('Competencia creada');
        })
      })
    })
  },

  /* -------------------------------------------------------------------------- */

  reiniciar: (req, res) => {
    let idCompetencia = req.params.id
    let eliminar = `DELETE FROM ?? WHERE competencia_id = ?`

    connection.query(eliminar, ['votos', idCompetencia], (error, results) => {
        if (error) {
            console.log("Error reiniciar", error.message);
            return res.status(500).send(error);
        }
        res.status(202).send('Operación exitosa')
    });
  },

  /* -------------------------------------------------------------------------- */

  eliminar: (req, res) => {
    let idCompetencia = req.params.id

    //1ro se elimina de la tabla votos
    let eliminar = `DELETE FROM ?? WHERE competencia_id = ?`
    connection.query(eliminar, ['votos', idCompetencia], 
    (error, results) => {
      if (error) {
        console.log("Error eliminar", error.message);
        return res.status(500).send(error);
      }
      
      //2do se elimina de la tabla competencias
      eliminar = `DELETE FROM ?? WHERE id = ?`
      connection.query(eliminar, ['competencias', idCompetencia],
      (error, results) => {
        if (error) {
          console.log("Error eliminar", error.message);
          return res.status(500).send(error);
        }
        res.status(202).send('Operación exitosa')
      })
    })
  },

  /* -------------------------------------------------------------------------- */

  editar: (req, res) => {
    let idCompetencia = parseInt(req.params.id)
    let nombreCompetencia = req.body.nombre
    let tabla = 'competencias'

    //se comprueba que el nombre exista
    if (!nombreCompetencia || nombreCompetencia == '') {
      return res.status(422).send(`Por favor ingrese un nombre`);
    }
    //se comprueba que el nuevo nombre de la competencias exista
    let consulta = `SELECT ?? FROM ?? WHERE nombre = ?;`
    connection.query(consulta, ['nombre', tabla, nombreCompetencia], 
      (error, results) => {
        if (error) return res.status(500).json(error)
        if (results == undefined || results.length !== 0) {
          return res.status(422).send('Ese nombre ya existe 😔');
        }
        //se actualiza el nuevo nombre
        let editar = `UPDATE ?? SET nombre = ? WHERE id = ?;`
        let inserts = [tabla, nombreCompetencia, idCompetencia]
        editar = mysql.format(editar, inserts)
        connection.query(editar, (error, results) => {
          if (error) return res.status(500).json(error)
          if (results[0] == undefined) {
            return res.status(202).send('Operación exitosa');
          }
        })
      })
  }
}

/* -------------------------------------------------------------------------- */

module.exports = controlador
