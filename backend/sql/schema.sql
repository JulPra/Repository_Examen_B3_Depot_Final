CREATE DATABASE Application_Cinema;

USE Application_Cinema;

CREATE TABLE Utilisateurs (
  id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
  nom_utilisateur VARCHAR(100) NOT NULL,
  prenom_utilisateur VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  mot_de_passe varchar(100) NOT NULL,
  telephone VARCHAR(20)
);

CREATE TABLE Films (
  id_film INT PRIMARY KEY AUTO_INCREMENT,
  nom_film VARCHAR(100) NOT NULL,
  salle_film FOREIGN KEY (id_seance) REFERENCES Seances(id_seance),
  duree DATETIME NOT NULL,
  description VARCHAR(500) NOT NULL
);

CREATE TABLE Seances (
  id_seance INT PRIMARY KEY AUTO_INCREMENT,
  evenement VARCHAR(100) NOT NULL,
  numero_salle INT(255) NOT NULL
);

CREATE TABLE Places (
  id_place INT PRIMARY KEY AUTO_INCREMENT,
  numero_place INT(1000) NOT NULL,
  FOREIGN KEY (numero_salle) 
      REFERENCES Seances(numero_salle)
);

CREATE TABLE Reservations (
  id_reservation INT PRIMARY KEY AUTO_INCREMENT,
  FOREIGN KEY (id_utilisateur) 
      REFERENCES Utilisateurs(id_utilisateur),
  FOREIGN KEY (id_film) 
      REFERENCES Films(id_film)
);
