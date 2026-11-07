CREATE DATABASE Application_Cinema;

USE Application_Cinema;

CREATE TABLE Utilisateurs (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom_utilisateur VARCHAR(100) NOT NULL,
    prenom_utilisateur VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20)
);

CREATE TABLE Films (
    id_film INT AUTO_INCREMENT PRIMARY KEY,
    nom_film VARCHAR(150) NOT NULL,
    duree INT NOT NULL,
    description VARCHAR(500) NOT NULL
);

CREATE TABLE Salles (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    numero_salle INT NOT NULL UNIQUE,
    capacite INT NOT NULL
);

CREATE TABLE Places (
    id_place INT AUTO_INCREMENT PRIMARY KEY,
    numero_place INT NOT NULL,
    id_salle INT NOT NULL,

    FOREIGN KEY (id_salle)
        REFERENCES Salles(id_salle),

    UNIQUE (id_salle, numero_place)
);

CREATE TABLE Seances (
    id_seance INT AUTO_INCREMENT PRIMARY KEY,
    id_film INT NOT NULL,
    id_salle INT NOT NULL,
    date_seance DATETIME NOT NULL,

    FOREIGN KEY (id_film)
        REFERENCES Films(id_film),

    FOREIGN KEY (id_salle)
        REFERENCES Salles(id_salle)
);

CREATE TABLE Reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    id_seance INT NOT NULL,
    id_place INT NOT NULL,
    date_reservation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'confirmee',

    FOREIGN KEY (id_utilisateur)
        REFERENCES Utilisateurs(id_utilisateur),

    FOREIGN KEY (id_seance)
        REFERENCES Seances(id_seance),

    FOREIGN KEY (id_place)
        REFERENCES Places(id_place),

    UNIQUE (id_seance, id_place)
);
