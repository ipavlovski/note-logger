DROP DATABASE IF EXISTS test_db;
CREATE DATABASE IF NOT EXISTS test_db;
USE test_db;

CREATE TABLE category (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE book (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    author VARCHAR(128) NOT NULL,
    description VARCHAR(128),
    category_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY (category_id) REFERENCES category (id)
);

CREATE TABLE tag (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE book_tag (
    book_id INT NOT NULL,
    tag_id INT NOT NULL,
    tagged_at DATETIME DEFAULT NOW(),
    PRIMARY KEY (book_id, tag_id),
    FOREIGN KEY (book_id) REFERENCES book (id),
    FOREIGN KEY (tag_id) REFERENCES tag (id)
);