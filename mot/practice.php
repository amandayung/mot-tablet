<?php
/* MOT/practice.php:
 * This is the practice page for the Multiple Object Tracking (MOT) task. This is where we give MOT task
 * instructions to the subject in addition to several practice trials. Once a subject successfully completes
 * the practice trials (see MOT/practicecode.js for details), then they are moved onto the full
 * task at MOT/index.php.
 */

//get access to the current SESSION variables
session_start();

// check that the participant is logged in by checking the SESSION variables
$loggedin = false;
if (isset($_SESSION["sid"]) && $_SESSION["sid"] != -1) {
	$loggedin = true;
	$_SESSION["task"] = "mot"; //note what task they're doing
}

?>

<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> 
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.01">

	<title>MOT Tutorial</title>

	<!-- required add-on to prevent unwanted behavior for the tablets we were using -->
	<script>
	 window.addEventListener("load", function() {
            function onTouchPreventDefault(event) { event.preventDefault(); };
            document.addEventListener("touchmove", onTouchPreventDefault, false);
            document.addEventListener("touchstart", onTouchPreventDefault, false);
        }, false);
    </script>

    <!-- CSS styling -->
	<link href="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/themes/black-tie/jquery-ui.css"
		type="text/css" rel="stylesheet" />
	<link href="practicestyle.css" type="text/css" rel="stylesheet" />       

	<!-- JQuery library -->
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>

	<!-- only load the extra JS if the participant has logged in already -->
	<?php if ($loggedin) { ?>
	<script type="text/javascript" src="practicecode.js"></script>
	<?php } ?>
</head>

<body>
	<?php
	if ($loggedin) { ?>
	<!-- this opens up a pop-up information window when pressed -->
	<button id="reminderButton"><img src="./img/info.png"></button>
	
	<!-- basic instructions for the task included in a pop-up window -->
	<!-- <div class="modal-container">		
	<div id="reminder">
		<h2>Instructions and Controls</h2>
		Tap the Start Trial button to begin the trial.
		<br/><br/>
		Pay attention to the sad faces and remember which ones they are once they become happy faces.
		When one of the faces changes into a question mark, tap on one of the buttons that appear:
		<br/><br/>
		<strong>Blue</strong> - indicates you think this face started as a blue face<br/>
		<strong>Yellow</strong> - indicates you think this face was always a yellow face<br/>
		<br/>
		<button id="OKButton">OK</button>
	</div>
	</div>
	 -->
	<div class="modal-container">		
		<div id="reminder">
			<h2>Les règles du jeu:</h2>
			Appuie sur le bouton "démarrer" pour commencer une partie.
			<br/><br/>
			Fais attention aux visages en bleu. Ils vont se transformer en visages jaunes et bouger dans tout les sens.  
			Au bout d'un moment tout s'arrête et l'un des visages devient un point d'interrogation (?). 
			Tu dois alors dire si, au début, ce visage était bleu ou jaune en appuyant sur le bouton : 
			<br/><br/>
			<strong>bleu</strong> - tu penses qu'au début ce visage était bleu<br/>
			<strong>jaune</strong> - tu penses qu'au début ce visage était jaune<br/>
			<br/>
			<button id="OKButton">OK</button>
		</div>
	</div>
	
	<!-- initial message presented to the participant -->
	<div id="preexpt">
	<!-- <p id="fs-check">This is the practice stage! Please tap on the the button below to read through the task instructions.</p> -->
	<p id="fs-check">Pour commencer, appuie sur le bouton "continuer".</p>
	<button id="cButton">continuer</button>
	</div>
	
	<!-- navigation buttons through the instructions -->
	<div id="content">
		<button id="backButton">back button</button>
		<button id="forwardButton">forward button</button>
		<p id="instructions"></p>
	</div>

	<!-- this checks if the HTML5 canvas is supported by the browser -->
	<canvas id="exptCanvas">
	Your browser does not support the canvas element.
	</canvas>

	<!-- practice button -->
	<button id="pracButton">entraînement</button>

	<!--start button to start the trials -->
	<div id="start-box">
		<button id="startButton">démarrer</button>
	</div>

	<!-- response buttons (if they saw a blue face or a yellow face) -->
	<div id="response-box">
		<button id="blueButton" class="response-button">bleu</button>
		<button id="yellowButton" class="response-button">jaune</button>
	</div>

	<!-- if the participant didn't log in, then let them know that they need to in order to continue. -->
	<?php } else if (!$loggedin) { ?>
	<div> <a href="../index.php?task=mot">Please login first before starting the task.</a> </div>
	<?php } ?>
</body>

</html>