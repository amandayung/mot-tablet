<?php
/* connectToDB.php:
 * Stores your login credentials for connecting to your MySQL database.
 * host: this can stay as localhost when run on your server
 * dbname: this is the name of the database which will store your experiment data
 * username: the username of the MySQL account you wish to use for connecting to the database
 * password: the password for the above MySQL account
 */

$connection = new PDO('mysql:host=localhost;dbname=DATABASE_NAME;', 'USERNAME', 'PASSWORD');
?>