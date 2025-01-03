const { query } = require("express");
const connection = require("../config/db");

const getallbooks = async () => {
  try {
    const [books] = await connection.query(`select * from book`);

    return books;
  } catch (e) {
    console.log("Error=> ", e);
    return null;
  }
};

const getonebook = async (bookId) => {
  try {
    const [book] = await connection.query(
      `select * from book where book_id=?`,
      [bookId]
    );

    return book[0];
  } catch (e) {
    console.log("Error=> ", e);
    return null;
  }
};

const addNewBook = async (req) => {
  try {
    // Destructure the request body
    console.log("Request Body:", req.body);
    const { title, count, author, category, description, image } = req.body;

  

    // Perform the insert query
    const [result] = await connection.query(
      `
            INSERT INTO book(title, count, author, category, description_of_book, image) 
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [title, count, author, category, description, image]
    );

    // Check if the insertion was successful
    if (!result.insertId) {
      throw new Error("Failed to insert the book into the database");
    }

    // Fetch the newly added book
    const [newBook] = await connection.query(
      "SELECT * FROM book WHERE book_id = ?",
      [result.insertId]
    );

    // Check if book data was returned
    if (newBook.length === 0) {
      throw new Error("Book not found after insertion");
    }

    // Return the newly added book
    return newBook[0];
  } catch (e) {
    console.error("Cannot add New Book:", e.message);
    return null;
  }
};

const deleteBook = async (req) => {
  const bookId = req.params.Id;

  try {
    const deletedBook = await connection.query(
      `delete from book where book_id=?`,
      [bookId]
    );

    return true;
  } catch (e) {
    console.error("Cannot delete Book", { e });
    return null;
  }
};
const borrow = async (req, res) => {
  const { member_id, book_id } = req.body; // Extract both from request body
  if (!member_id || !book_id) {
    return res
      .status(400)
      .json({ message: "Both member_id and book_id are required." });
  }

  const borrowDate = new Date();
  const returnDate = new Date();
  returnDate.setDate(borrowDate.getDate() + 7);

  try {


    // Proceed with borrowing the book
    const [result] = await connection.query(
      `INSERT INTO borrow (member_id, book_id, fines_value, borrow_date, return_date) 
            VALUES (?, ?, ?, ?, ?)`,
      [
        member_id,
        book_id,
        null, // Assuming no fines applied for now
        borrowDate.toISOString().slice(0, 19).replace("T", " "),
        returnDate.toISOString().slice(0, 19).replace("T", " "),
      ]
    );



    // Return borrow details
    await connection.query(
      `update book set count = (count-1) where book_id = ?`,
      [book_id]
    );
  
    const [borrowBook] = await connection.query(
      `SELECT b.borrow_id, m.name_member, b.borrow_date, b.return_date, bk.title AS book_title
            FROM borrow b
            JOIN members m ON b.member_id = m.member_id
            JOIN book bk ON b.book_id = bk.book_id
            WHERE b.member_id = ? AND b.book_id = ? AND return_date IS not  NULL`,
      [member_id, book_id]
    );
    console.log(borrowBook);
    return borrowBook; // Returning borrow details
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  }
};

//return book

module.exports = {
  getallbooks,
  getonebook,
  addNewBook,
  deleteBook,
  borrow,
};
