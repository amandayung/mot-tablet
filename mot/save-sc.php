<?php
/* MOT/save.php:
 * This receives all of the MOT task's data passed from MOT/code-sc.js and saves it to the database.
 */

session_start(); //get the current SESSION variables
$message = "default"; //stores status message for success/failure of adding to the database (used for debugging)

//checks if the variables were sent
if (isset($_SESSION["sid"], $_SESSION["task"], $_POST["numAttendDots"], $_POST["probeTracked"],
	$_POST["response"], $_POST["correct"], $_POST["rt"], $_POST["reversals"], $_POST["trialStart"],
	$_POST["canvasWidth"], $_POST["canvasHeight"], $_POST["pxperdeg"])) {

	//store values sent, putting the values for each trial into arrays
	$sid = $_SESSION["sid"]; //subject ID (the username assigned when the subject logged in)
	$numAttendDots = explode(";", $_POST["numAttendDots"]); //number of cued dots for each trial
	$probeTracked = explode(";", $_POST["probeTracked"]); // if the queried dot was originally a cued dot for each trial
	$response = explode(";", $_POST["response"]); //subject's response for each trial
	$correct = explode(";", $_POST["correct"]); //if the subject was correct or not
	$rt = explode(";", $_POST["rt"]); //subject's response time for each trial
	$reversals = explode(";", $_POST["reversals"]); //number of reversals so far for each trial
	$trialStart = explode(";", $_POST["trialStart"]); //trial start time for each trial
	$canvasWidth = $_POST["canvasWidth"]; //HTML5 canvas width (px)
	$canvasHeight = $_POST["canvasHeight"]; //HTML5 canvas height (px)
	$pxperdeg = $_POST["pxperdeg"]; //the pixels per degree value used for the subject's setup

	$numTrials = count($response); //get total number of trials

	//initiate connection to the database using the login credentials in connectToDB.php
	try {
		include('../php_utils/connectToDB.php'); 
	} catch (Exception $e){
		die('Error : ' . $e -> getMessage());
	}
  
	//add trial data to the mot table
	$trialquery = $connection->prepare("INSERT INTO motsc (sid, time, trial, trialStart, numAttendDots, probeTracked, response, correct, rt, reversals, canvasWidth, canvasHeight, pxperdeg) " .
		"VALUES (:sid, NOW(), :trial, :trialStart, :numAttendDots, :probeTracked, :response, :correct, :rt, :reversals, :canvasWidth, :canvasHeight, :pxperdeg )"); 
		
	//setup parameters
	$trial_i = -1;
	$trialStart_i = -1;
	$numAttendDots_i = -1;
	$probeTracked_i = -1;
	$response_i = -1;
	$correct_i = -1;
	$rt_i = -1;
	$reversals_i = -1;
		
		 
	$trialquery->bindParam(":sid", $sid);
	$trialquery->bindParam(":trial", $trial_i);
	$trialquery->bindParam(":trialStart", $trialStart_i);
	$trialquery->bindParam(":numAttendDots", $numAttendDots_i);
	$trialquery->bindParam(":probeTracked", $probeTracked_i);
	$trialquery->bindParam(":response", $response_i);
	$trialquery->bindParam(":correct", $correct_i);
	$trialquery->bindParam(":rt", $rt_i);
	$trialquery->bindParam(":reversals", $reversals_i);
	$trialquery->bindParam(":canvasWidth", $canvasWidth);
	$trialquery->bindParam(":canvasHeight", $canvasHeight);
	$trialquery->bindParam(":pxperdeg", $pxperdeg);
	  
	for ($i = 0; $i < $numTrials; $i++) {
		$trial_i = $i;
		$trialStart_i = $trialStart[$i];
		$numAttendDots_i = $numAttendDots[$i];
		$probeTracked_i = $probeTracked[$i];
		$response_i = $response[$i];
		$correct_i = $correct[$i];
		$rt_i = $rt[$i];
		$reversals_i = $reversals[$i];
		
		//add each trial's data as a separate row in the table
		if ($trialquery->execute()) {
			$message = "Trial successfully added.";
		}
		else {
			$message = print_r($connection->errorInfo());
		}
	} 
 	
 	//close connection to database
 	unset($connection);
}
//only used for debugging
exit($message);

?>