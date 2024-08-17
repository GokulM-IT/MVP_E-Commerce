# What is MVP website?
An MVP website is a basic version of a web product, offering essential features to meet users' needs without unnecessary complexity. It's designed for rapid development and testing, allowing for quick validation of the product idea with minimal resources.

## Preview
![Website Preview](https://res.cloudinary.com/dhgeqswqq/image/upload/v1723924841/Gif_wpayje.gif)

## Description
Our MVP e-commerce website provides a basic yet functional platform for both customers and vendors to interact. Customers can view products, add them to their cart, place orders, and delete items from their cart. Vendors, on the other hand, can add products, view their existing products, edit product details, and delete products.

## Features

### Customer Side:
- View Products: Browse through the list of available products with details such as name, description, and price.
- Add to Cart: Select products and add them to the shopping cart for later purchase.
- Delete Cart: Remove items from the cart before placing an order.
- Place Order: Finalize the shopping process by placing an order for the items in the cart.

### Vendor Side:
- Add Products: Create new product listings with details such as name, description, price, and image.
- View Products: See a list of all products currently available for sale.
- Edit Product: Modify the details of existing products, such as updating the price or description.
- Delete Products: Remove products from the inventory that are no longer available for sale.

## Technologies Used
- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MySQL

## How to Use
1. Clone this repository: `git clone https://github.com/GokulM-IT/MVP_E-Commerce.git`
2. Navigate to the project directory: `cd MVP_E-Commerce`
3. Install dependencies: `npm install`
4. Start the development server: `node app.js`
5. View the Hosted Website
    - Open your web browser.
    - Navigate to the URL http://localhost:3000 (by default).
    - You should now see the homepage of your MVP e-commerce website in your web browser.

## MySQL Connection
1.  Open your app.js file in a text editor.
2. Locate the MySQL connection code, which looks something like this:
    ```sql
    const con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
    ```
3. Replace the 'process.env.DB_HOST', 'process.env.DB_USER', 'process.env.DB_PASSWORD', and 'process.env.DB_DATABASE' with your actual MySQL server hostname, username, password, and database name respectively.
4. Save the changes to your app.js file.

## MySQL Table Creation
### Users Table
```sql
CREATE TABLE Users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    cartId INT,
    userName VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### Products Table
```sql
CREATE TABLE Products (
    productId INT AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(255),
    price DECIMAL(10, 2),
    productDetails TEXT,
    imagePath VARCHAR(255),
    ownerId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES Users(userId)
);
```
### Cart Table
```sql
CREATE TABLE Cart (
    cartId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    productId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
```

### Orders Table
```sql
CREATE TABLE Orders (
    orderId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    productId INT,
    ownerId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    FOREIGN KEY (productId) REFERENCES Products(productId),
    FOREIGN KEY (ownerId) REFERENCES Products(ownerId)
);
```
