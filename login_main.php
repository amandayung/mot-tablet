<?php
// login for doing the MOT task
session_start();

//default redirect link
$redirect_link = "./index.php";

//checks if the codename was sent for login
if (isset($_POST["code_name"])) {


	$_SESSION['sid'] = htmlspecialchars($_POST["code_name"]);

	// adding this variable to determine where to redirect after task is completed
	// ** not sure if this variable is actually needed?
	$_SESSION['singleTask'] = TRUE;

	//initiate connection
	try {
		include('./php_utils/connectToDB.php'); 
	} catch (Exception $e){
		die('Error : ' . $e -> getMessage());
	}

	//add subject to the database
	$addquery = $connection->prepare("INSERT INTO subjects (sid, time) 
		VALUES (:sid,NOW())");
	$addquery->bindParam(':sid', $_SESSION['sid']);	
	$addquery->execute();

	$redirect_link = "./mot/practice.php";		

	//close connection to database
	unset($connection);
}
header('Location: ' . $redirect_link);
?>