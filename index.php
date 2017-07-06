<!-- index.php:
	 This is the starting page for the study, and requires the participant to login.
	 This experiment is meant to be run on a tablet and has French instructions.
-->

<?php
// start storing PHP session variables
session_start();
?>

<!DOCTYPE html>
<html lang="fr">
<head>

	<title>MOT</title>

	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta charset="UTF-8">

	<!-- CSS styling -->
	<link rel="stylesheet" href="css/style.css" />
	<link rel="stylesheet" href="js/jquery-ui.min.css">	 
	<link rel="stylesheet" href="js/jquery-ui.structure.min.css">	 
	<link rel="stylesheet" href="js/jquery-ui.theme.min.css">	 

	<!-- JQuery library -->
	<script src="js/jquery-1.9.1.min.js"></script>
	<script src="js/jquery-ui.min.js"></script>


	
	<!-- additional JS functions -->
	<script>
		// get the current time
	    function getDate(){
	    	var end = new Date();
	    	var hdiff = (-1) * end.getTimezoneOffset()/60;
	    	end.setHours(end.getHours() + hdiff);
	    	tt = end.toISOString().slice(0, 19).replace('T', ' ');
	    	return tt;
	    }

  		// this function is used to add a hidden field to a form, which contains the current time 
	    function writeDate(nname){
	    	var ttt = "<input type='hidden' name ='" + nname + "' id = '" + nname + "' value = '" + getDate() + "'>";
	    	$('input')
	    	document.write(ttt);
	    }
    </script>


</head>
<body>
	<div class="central_region">
		<div class="header">
			<!-- you can add your own logo here -->
			<img src="./img/UNIGE70.gif"  height="94px" class="logo_unige" />

			<!-- a code/username is required to participate -->
			<h1> Bonjour, <br>ecris ici ton code </h1>			
		</div>

		<div class="leftColumn">
			<form class="login_form" action="login_main.php" method="post" name="login_form">
				<ul>
					<li>
						<!-- check that the field has been filled in -->
						<input type="text" name="code_name" id="code_name" 
						required 
						oninvalid="setCustomValidity('Veuillez remplir ce champ')" 
						>					
					</li>

					<!-- submit button to login to the task -->
					<li>
						<button class="submit" type="submit">OK</button>
					</li>
				</ul>

				<!-- store the start time -->
				<script type="text/javascript"> writeDate('timeStarted'); </script>
				<input type="hidden" name="code" id="code">					
			</form>
		</div>

		<div class="footer">
		</div>
	</div>
</body>
</html>