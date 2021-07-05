
show tables;

CREATE TABLE test_vars (
    nums INT NOT NULL,
    big_letters VARCHAR(5) NOT NULL,
    small_letters VARCHAR(5) NOT NULL,
    PRIMARY KEY (nums, big_letters, small_letters)
);


INSERT INTO
    test_vars (nums, big_letters, small_letters)
VALUES
    (1, 'A', 'z');


SELECT 1 AS num, 'A' AS big;

SELECT 'a' AS small, 'B' AS big, 1 AS num 
UNION ALL SELECT 'b', 'A', 2 
UNION ALL SELECT 'c', 'B', 3;

select * from category;
select * from tag;

select book.name, tag.name from book_tag
inner join book on book.id = book_tag.book_id
inner join tag on tag.id = book_tag.tag_id;


-- CREATE THE SQL TABLES


-- PERFORM BASIC TESTING
select * from book where id = 1;
select * from book_tag where book_id = 1;
select book.*, category.name as c_name from book inner join category on book.category_id = category.id;



-- use a left join for optional categories
select book.*, category.name as c_name from book left join category on book.category_id = category.id;
-- get all tags for a book
select tag.name from book_tag
    inner join tag on book_tag.tag_id = tag.id
    inner join book on book_tag.book_id = book.id
    where book.id = 2;

-- do it in a single query
select book.*, tag.name as tag, category.name as category
    from book_tag
    right join tag on book_tag.tag_id = tag.id
    right join book on book_tag.book_id = book.id
    left join category on book.category_id = category.id; 
