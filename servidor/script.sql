USE `competencias`;

DROP TABLE IF EXISTS `competencias`;
CREATE TABLE `competencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `genero_id` int(11) unsigned,
  `director_id` int(11) unsigned,
  `actor_id` int(11) unsigned,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`genero_id`) REFERENCES `genero`(`id`),
  FOREIGN KEY (`director_id`) REFERENCES `director`(`id`),
  FOREIGN KEY (`actor_id`) REFERENCES `actor`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `competencias` (`nombre`)
VALUES ('Mejor Película'),
('Mejor Comedia?'),
('Mejor Película de Acción');

UPDATE `competencias` SET `genero_id` = 5 WHERE `id` = 2;
UPDATE `competencias` SET `genero_id` = 1 WHERE `id` = 3;

/* -------------------------------------------------------------------------- */

DROP TABLE IF EXISTS `votos`;
CREATE TABLE `votos`(
  `id` int NOT NULL AUTO_INCREMENT,
  `pelicula_id` int unsigned NOT NULL,
  `competencia_id` int NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pelicula_id`) REFERENCES `pelicula`(`id`),
  FOREIGN KEY (`competencia_id`) REFERENCES `competencias`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
