USE test_db;

INSERT INTO category (name) VALUES ('paperback'), ('hardcover'), ('audiobook');

INSERT INTO book (name, author) VALUES ('Harry Potter', 'JK Rowling');
INSERT INTO book (name, author, category_id) VALUES ('Davinci Code', 'Dan Brown', 2);
INSERT INTO book (name, author, description, category_id) VALUES ('Kids Stories', 'Assorted', 'For ages 3+', 1); 

INSERT INTO tag (name) VALUES ('fiction'), ('thriller'), ('drama'), ('kids');

INSERT INTO book_tag (book_id, tag_id) VALUES (1, 1), (1, 4), (3, 4);
