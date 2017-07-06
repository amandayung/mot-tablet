/* MOT/practicecode.js:
 * This code controls the display of instructions to the subject, sets up the practice trials, and then presents the practice trials to
 * the subject. After completing the designated number of practice trials (see the below variables for specifics), it will allow the user 
 * to move onto the full task. The practice trial data is then saved to the database.
 * **NOTE**: you must set the MOT.pxperdeg value yourself to match your setup! **
 */

// *********************** VARIABLES ************************ //
var MOT = {}; //storage for all variables in this task

MOT.exptLink = "sc.php"; //link to main page of full task

// Screen Calibration variables ----------------------------------
// *** You will need to set the pixels per degree value yourself based on your setup!
// The values below were ones used for our study, based on our tablet's dimensions and resolution
MOT.pxperdeg = 44.96; //calculated pixels per degree, based on a 30cm viewing distance away from the screen

// Instruction variables ----------------------------------------
//instruction text per page
/*
MOT.text = 
["This task requires you to attend to moving objects presented on the screen. We will explain the process step by step.",
"At the beginning of each trial, there will be multiple faces within a gray area. There are two types: yellow happy faces and blue sad faces.",
"These faces will be moving around the gray area throughout the trial. Track the blue sad faces amongst the other faces.",
"After a short period of time, the sad faces will change to yellow happy faces. You will need to keep tracking the faces that were initially blue.", 
"When the trial ends, one face will appear with a question mark and two buttons will appear. If you think this face started as a blue face, tap the <strong>blue button</strong>. Otherwise, if it was always a yellow face, tap the <strong>yellow button</strong>.",
"Now try a few practice trials. If you need a reminder about the controls, tap the \"i\" icon in the bottom left corner.",
"Make sure you are comfortable with the instructions and key responses before you begin. You can go back in the instructions if necessary. When you're ready, tap the Start button."];
*/
MOT.text =
["Dans ce jeu, tout se passe sur ce disque gris...<br>On va tout t'expliquer pas à pas. <br>Appuie sur la flèche en haut à droite pour continuer.",
"Au début de chaque partie, tu verras plusieurs visages sur le disque gris. Certains sont <strong>jaunes</strong> et d'autres sont <strong>bleus</strong>. Appuie sur la flèche en haut à droite pour continuer.",
"Ces visages vont alors se mettre à bouger. Attention! Il ne faut pas perdre de vue les visages <strong>bleus</strong>. Appuie sur la flèche en haut à droite pour continuer.",
"Après quelques instants, les visages bleus deviennent jaune : continue à suivre ces visages-là et fais attention à ne pas les confondre avec les autres. Appuie sur la flèche en haut à droite pour continuer.",
"A la fin de la partie, un point d'interrogation (?) apparaît sur l'un des visages. Est-ce que ce visage-là était jaune ou bleu au tout début de la partie? Un bouton jaune et un bouton bleu vont apparaître en bas de l'écran pour que tu donnes ta réponse. Maintenant appuie sur la flèche en haut à droite pour continuer.",
"On va faire quelques essais pour s'échauffer. Si tu oublies les règles, appuie sur le bouton  \"i\" en bas à gauche de l'écran. Appuie sur le bouton \"démarrer\" pour démarrer un essai." ,
"Installe-toi confortablement, concentre-toi. <br>Quand tu seras prêt appuie sur le bouton \"démarrer\"."];

//reference label for each instruction page
MOT.pageLabels = ["start", "faces", "cue", "move", "query", "practice", "end"];

//instruction page setup
MOT.curPage = 0; //keeps track of current page
MOT.highestPage = 0; //keeps track of the highest page the subject has gotten to

//text after demo completion
//MOT.noticeText = "Great! You can now continue through the instructions.";
MOT.noticeText = "Super! Nous sommes prêt à démarrer.";

//stimuli and trial variables ----------------------------------

//setup the images used for the stimuli
MOT.img = new Array(new Image(), new Image(), new Image());
var imgDir = "./img/"; //image directory
MOT.img[0].src = imgDir + "happy_face.png"; //happy, yellow face
MOT.img[1].src = imgDir + "sad_face.png"; //sad, blue face
MOT.img[2].src = imgDir + "query.png"; //probe stimulus

// feedback images
MOT.feedbackImg = new Array(new Image(), new Image());
MOT.feedbackImg[0].src = imgDir + "wrong.png"; //incorrect response feedback
MOT.feedbackImg[1].src = imgDir + "correct.png"; //correct response feedback
MOT.feedbackSize = 50; //size of feeback (pixels)

//timing variables
MOT.speed = 16; //length of time for each frame (ms/frame)
MOT.tCue = 2000; //duration of presentation of cue (ms)
MOT.tMove = 4000; //duration of dots moving (after the cue period) before asking about probed dot (ms)
MOT.dotVel = 2; //velocity of dots in degrees/sec
MOT.vel = Math.ceil(MOT.dotVel * MOT.pxperdeg / (1/(MOT.speed/1000)));  //velocity of dots in pixels/frame
MOT.startWait = 0; //keeps track of timer start
MOT.tFeedback = 1000; //duration of feedback display (ms)

//store start and end times for stimuli movement
MOT.startTimes = new Array();
MOT.endTimes = new Array();

//dot appearance variables
MOT.dotRad = Math.round(0.4*MOT.pxperdeg); //dot radius (deg*ppd)
MOT.imgsz = MOT.dotRad*2; //dot size (diameter, in pixels)

//stimuli movement limits
MOT.straightProb = 0.4; //probability that a dot will move in a straight line
MOT.angSD = 0.2; //the maximum deviation from a dot's current angle of motion in order to vary dot motion, if it is not moving in a straight line
MOT.minSep = Math.round(1.5*MOT.pxperdeg); //minimum distance allowed between dots (deg*ppd)
MOT.minFix = Math.round(2*MOT.pxperdeg); //minimum distance allowed from fixation (deg*ppd)
MOT.maxFix = 0; //maximum distance allowed from fixation (deg*ppd); *** this gets fully set in initCanvas()!
MOT.minEdge = Math.ceil(2*Math.sqrt(2)*(MOT.vel+1))+MOT.dotRad+4; //minimum distance from edge

//trial variables
MOT.numDots = 8; //how many dots to show in total
MOT.condition = new Array(1,2); //number of dots that start as blue (in this case, either 1 or 2)
MOT.numTrialsPerCond = 2; //the least number of trials per condition the subject sees during the tutorial
MOT.numTrialsTotal = 6; //the maxmimum number of trials the subject can complete in total during practice
MOT.numCorrectNeeded = 3; //the number of trials a subject needs to get correct before moving on to the full task
MOT.numCorrect = 0; //the current number of correct trials by the subject

//counters and data arrays
MOT.trial = 0; //keep track of current trial
MOT.response = new Array(); //store participant response per trial, whether the probed dot was originally blue (0 = no, 1 = yes)
MOT.correct = new Array(); //store per trial whether they were correct or not (0 = incorrect, 1 = correct)
MOT.rt = new Array(); // store per trial their response time after presentation of the probe

//set default initial values
MOT.response[0] = -1; 
MOT.correct[0] = -1;
MOT.rt[0] = -1;

MOT.dotPosX = createEmptyDotArray(); //stores X position of each dot per trial (updated at each frame)
MOT.dotPosY = createEmptyDotArray(); //stores Y position of each dot per trial (updated at each frame)
MOT.dotMovAng = new Array(); //stores current angle of motion for each dot (updated at each frame)
MOT.numAttendDots = new Array(); //stores how many dots need to be attended to for each trial
MOT.numAttendDots[0] = MOT.condition[0]; //initialize the first trial's number of dots to attend to as the number set in the first condition
MOT.probeTracked = new Array(); //store whether the trial asked if a dot that needed to be attended to (blue) was the dot that was queried about at the end of a trial
MOT.probedDot = new Array(); //store the identity of the probed dot (the one asked about at the end of the trial)

//demonstration dot data (presented before the practice trials)
MOT.demoDotPosX = new Array(); //stores current X position of each dot during the demo
MOT.demoDotPosY = new Array(); //stores current Y position of each dot during the demo
MOT.demoDotMovAng = new Array(); //stores current angle of motion of each dot during the demo
MOT.demoNumAttendDots = 2; //number of example dots to attend to presented during the demo

//state control --------------------------------------------------
MOT.state = "start"; //this keeps track of the practice trial state; state order: start/fix, cue, move, response, feedback, (then back to fix)
MOT.isPractice = false; //keeps track if the subject is currently doing the practice trials
MOT.stateChange = false; //keeps track if the state changed during the trial
MOT.done = false; //keeps track if subject is done with the practice trials
MOT.completedPrac = false; //controls if the subject can move onto the full task
MOT.initState = false; //keeps track if the current trial needs to be initialized


// *********************** DRAWING CONTROL ************************ //

// for efficient redraw calls (from Paul Irish - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/)
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame || 
          window.oRequestAnimationFrame || 
          window.msRequestAnimationFrame || 
          function(/* function FrameRequestCallback */ callback){
            window.setTimeout(callback, 1000 / 60);
          };
})();

//controls state/canvas update
function draw(){
  requestAnimFrame(draw);
  updateFrame();
};


// *********************** INITIALIZATION ************************** //

//wait until the HTML5 page is ready before setting up all the widgets
$(document).ready(init);

//this function sets up buttons, dialog windows, and the first instruction page
function init() { 
	//hide content before the subject starts the tutorial
	$(".modal-container").hide();
	$("#reminderButton").hide();
	$("#pracButton").hide();
	$("#content").hide();
	$("#exptCanvas").hide();
	$("#start-box").hide();
	$("#response-box").hide();

	//** for the button callbacks, the tablet we used required us to override an unwanted behavior using the
	//touchstart callback -- because of this, there are functions that appear to do the same thing twice
	//for each button

	//set up the continue button that allows the subject to start the tutorial
	$("#cButton").button();
	$("#cButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  initCanvas();
	});
	$("#cButton").click(initCanvas);

	//set up the reminder button which brings up short instructions in a dialog box
	$("#reminderButton").button();
	$("#reminderButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  $(".modal-container").show();
	  $("#reminder").show();
	});
	$("#reminderButton").click( function() {
	  $(".modal-container").show();
	  $("#reminder").show();
	});
	
	// set up the OK button that closes the reminder window when it's open
	$("#OKButton").button();
	$("#OKButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  $(".modal-container").hide();
	  $("#reminder").hide();
	});
	$("#OKButton").click( function() {
		$(".modal-container").hide();
	 	$("#reminder").hide();
	})

	// also set up the reminder window to close when the container itself is tapped
	$(".modal-container").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  $(".modal-container").hide();
	  $("#reminder").hide();
	});
	$(".modal-container").click( function() {
		$(".modal-container").hide();
	 	$("#reminder").hide();
	})
	
	//set up the practice button that starts the practice trials
	$("#pracButton").button();
	$("#pracButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  runPractice();
	});
	$("#pracButton").click(runPractice);

	//set up the start button that starts the trials
	$("#startButton").button();
	$("#startButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  startTrial();
	});
	$("#startButton").click(startTrial);

	//set up the response buttons (for noting if the probed dot started as yellow or blue)
	$("#yellowButton").button();
	$("#blueButton").button();
	$(".response-button").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  e.preventDefault();
	  getResponseButton(this);
	});
	$(".response-button").click(function(e) {
		getResponseButton(this);
	});
	
	//set up the buttons to move through the instruction pages
	//previous page button
	$("#backButton").button({
		icons: {primary: "ui-icon-triangle-1-w"},
		text: false
	});
	$("#backButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
	  if (!$(this).is(":disabled")) {
	  	e.preventDefault();
	  	goBack();
	  }
	});
	$("#backButton").click(goBack);
	$("#backButton").button( "option", "disabled", true ); //default to disabled at the start
	
	//next page button
	$("#forwardButton").button({
	icons: {primary: "ui-icon-triangle-1-e"},
	text: false
	});
	$("#forwardButton").on('touchstart', function(e) {
	  /* prevent delay and simulated mouse events */
		if (!$(this).is(":disabled")) {
			e.preventDefault();
			goForward();
		}
	});
	$("#forwardButton").click(goForward);
	

	//set instructions
	$("#instructions").html(MOT.text[MOT.curPage]);
}


//this function initializes the HTML5 canvas for stimuli presentation
function initCanvas() {
	//hide initial message and show tutorial content
	$("#preexpt").hide();
	$("#content").show();
	$("#exptCanvas").show();
	
	//initialize canvas
	MOT.canvas = document.getElementById("exptCanvas");
	MOT.c = MOT.canvas.getContext("2d");
	MOT.canvas.height = window.innerHeight-200; //set canvas height (the -200 px is to give room for instruction text)
	MOT.canvas.width = MOT.canvas.height; //make the canvas square
	MOT.cx = Math.round(MOT.canvas.width/2); //get center x coordinate of canvas
	MOT.cy = Math.round(MOT.canvas.height/2); //get center y coordinate of canvas
	MOT.c.fillStyle="rgb(0, 0, 0)"; //set the canvas color to black
	MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);
	
	//set maximum distance away from fixation point to be the canvas's width
	MOT.maxFix = Math.round(MOT.cx); //maximum distance allowed from fixation (deg*ppd)
	
	//set up demo
	chooseDemoDotLocs();

	MOT.stateChange = true; //update the current state of the tutorial
	MOT.startTime = new Date().getTime(); //get the start time of the state
	draw(); //start the demo
}


// ********************** PAGE CONTROLS ************************ //

// callback function for back button
// (go to the previous page)
function goBack() {
	MOT.curPage--;
	updatePage();
	updateContent();
}

// callback for forward button
// (go to the next page)
function goForward() {
	if (MOT.curPage == MOT.highestPage) {
		MOT.highestPage++;
	}
	MOT.curPage++;
	updatePage();
	updateContent();
}

// update instruction page based on what should be currently displayed
// (function triggered by pressing forward or back buttons)
function updatePage() {
	//first remove any page specific details before displaying the page
	$("#instructions").removeClass("highlight");
	$("#instructions").css("text-align", "left");
	MOT.isPractice = false;
	$("#start-box").hide();
	$("#response-box").hide();
	
	//set the instruction text for the current page
	$("#instructions").html(MOT.text[MOT.curPage]);
	
	//if the subject is on the first page
	if (MOT.curPage == 0) {
		$("#backButton").button( "option", "disabled", true );
		$("#backButton").blur();
	}
	//else if the subject is on the last page
	else if (MOT.curPage == MOT.text.length-1) {
		$("#forwardButton").button( "option", "disabled", true );
		$("#forwardButton").blur();
	}
	//else if the subject is on the page with practice trials
	else if (MOT.pageLabels[MOT.curPage] == "practice") {
		//if the subject hasn't completed the practice trials yet, 
		//disable the forward button
		if (!MOT.completedPrac) {
			$("#forwardButton").button( "option", "disabled", true );
			$("#forwardButton").blur();			
		}
		//otherwise, enable the forward button
		else {
			$("#forwardButton").button( "option", "disabled", false );
		}
		MOT.isPractice = true; //set practice state as true
		resetPractice(); //reset practice trials
		MOT.numCorrect = 0; //reset number of trials that the subject has gotten correct
		MOT.state = "start"; //change practice state to "start" state
		MOT.stateChange = true; //state has changed, so update content
		
		//clear canvas to black background
		MOT.c.fillStyle="rgb(0, 0, 0)";
		MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);
	}
	//for all other pages, default to enabling back and forward buttons
	else {
		$("#backButton").button( "option", "disabled", false );
		$("#forwardButton").button( "option", "disabled", false );
	}
	
}


// ************************* STATE UPDATES *************************** //

//At each frame, the frame is redrawn based on the current state
function updateFrame() {
	
	//if the subject is not doing the practice trials currently, then 
	//figure out the current state based on the current page content
	if (!MOT.isPractice) {
		clearCanvas(); //clear current content
		if (MOT.pageLabels[MOT.curPage] == "start") {
			drawFix(); //only draw fixation point
		}
		else if (MOT.pageLabels[MOT.curPage] == "faces") {
			drawFaces(); //draw stimuli as an example of what they look like
		}
		else if (MOT.pageLabels[MOT.curPage] == "cue" || MOT.pageLabels[MOT.curPage] == "move") {
			drawFix();  //draw fixation point
			drawMoveState(); //draw the stimuli moving around (with some dots as cue dots -- i.e. blue during the cue state)
		}
		else if (MOT.pageLabels[MOT.curPage] == "query") {
			drawFix(); //draw fixation point
			drawQueryState(); //select one of the dots as the probed dot and change it to a query stimulus
			$("#response-box").show(); //show response options
		}
		else if (MOT.pageLabels[MOT.curPage] == "end") {
			//don't do anything for the end state
		}
		else {
			//if somehow in a different state, don't do anything
		}
	}
	
	//otherwise, the subject is doing the practice trials, so keep track of what to draw
	// if there was a state change, then do any initial setup for that state
	else {
		if (MOT.state == "start") { //start of practice trial
			if (MOT.stateChange) {
				$("#reminderButton").show(); //show button to bring up instruction help
				MOT.stateChange = false; //turn off state change
				drawContent(); //draw updated content

				$("#start-box").show(); //let the participant choose when to start the trial
			}
		}
	
		else if (MOT.state == "fix") { //display the fixation point only
				if (MOT.stateChange) {
					MOT.stateChange = false; //turn off state change
					drawContent(); //draw updated content
				}	
		}

		else if (MOT.state == "cue") { //display dots that should be tracked while moving all dots around
			if (MOT.stateChange) {
				MOT.startWait = new Date().getTime(); //get start time of cue period
				MOT.stateChange = false; //turn off state change
				MOT.initState = true; //note that the trial needs to be set up	
				drawContent(); //draw updated content
			}
			//check how much time has passed; if the full time for the cue period has passed, move onto the "move" state
			if (new Date().getTime() >= MOT.startWait + MOT.tCue) {
				MOT.state = "move";
				MOT.stateChange = true;
			}
			else {
				//keep updating movement of dots
				drawContent();
			}
		}	
	
		else if (MOT.state == "move") { //change the target dots to normal color (dots still moving)
			if (MOT.stateChange) {
				MOT.startWait = new Date().getTime(); //get start time of move period
				MOT.stateChange = false; //turn off state change
				MOT.startTimes[MOT.trial] = MOT.startWait;	//record when the dots started moving
				drawContent(); //draw updated content
			var curTime = new Date().getTime();
			//check how much time has passed; if the full time for the cue period has passed, move onto the "response" state
			if (curTime >= MOT.startWait + MOT.tMove) {
				MOT.state = "response";
				MOT.stateChange = true;
				MOT.endTimes[MOT.trial] = curTime; //record when the dots stopped moving
			}
			else {
				//keep updating movement of dots
				drawContent();
			}
		}
	
		else if (MOT.state == "response") { //wait for subject response to the probed dot
			if (MOT.stateChange) {
				MOT.startWait = new Date().getTime(); //get start time of response period
				MOT.stateChange = false; //turn off state change
			
				//choose randomly (~50/50) whether or not the dot selected will be an originally cued dot or not
				MOT.probeTracked[MOT.trial] = Math.round(Math.random());
				if (MOT.probeTracked[MOT.trial]) { //if it is, then randomly select one of the cued dots as the queried dot
					MOT.probedDot[MOT.trial] = Math.floor(Math.random()*MOT.numAttendDots[MOT.trial]);
				}
				else { //otherwise, choose any of the other dots as the queried dot
					MOT.probedDot[MOT.trial] = Math.floor(Math.random()*MOT.numAttendDots[MOT.trial])+MOT.numAttendDots[MOT.trial];
				}
			
				drawContent(); //update the content

				// show the reminder button and the response buttons
				$("#reminderButton").show();
				$("#response-box").show();
			}
			//once the subject has given a response for the trial, then move on
			if (MOT.response[MOT.trial] != -1) {
				updateTrial(); //update trial data
				MOT.state = "feedback";
				MOT.stateChange = true;
			}
		}
		// get feedback if they were correct or not after responding
		else if (MOT.state == "feedback") {
			if (MOT.stateChange) {
				MOT.startWait = new Date().getTime(); //get start time of feedback period
				MOT.stateChange = false;		
				drawContent(); //update to show feedback
			}
			//check if the feedback has been displayed for the given amount of time
			if (new Date().getTime() >= MOT.startWait + MOT.tFeedback) {
				//if this was the last practice trial, then the subject is done with the practice period
				if (MOT.done) {
					MOT.completedPrac = true;
					$("#forwardButton").button( "option", "disabled", false ); //enable them to move on
					MOT.stateChange = true;

				}
				else { //otherwise, move onto the next trial
					startTrial();
				}
			}
		}
		//if they're done with the practice trials, then display the end content
		else if (MOT.state == "done") {
			drawContent();
		}
	}
}


//this function updates page content
// (triggered by tapping one of the navigation buttons)
function updateContent() {
	//update page based on current page label
	if (MOT.pageLabels[MOT.curPage] == "end") {
		//at last page, change the practice start button to the start button for the full task
	 	// $("#pracButton").button("option", "label", "Start!");
	 	$("#pracButton").button("option", "label", "démarrer!");
	 	$("#pracButton").show();
	 	$("#exptCanvas").hide();
	 }
	 else {
	 	//otherwise, hide the practice button and show the canvas
		$("#pracButton").hide();
	 	$("#exptCanvas").show();
	 }
}


// Callback for the practice button. When the practice button is pressed, run the practice trials
//(if the subject is on the last page and clicks the button, then redirect subject to the full task)
function runPractice() {
	MOT.isPractice = true; //enable practice state
	
	if (MOT.curPage != MOT.text.length-1) {
		//reset practice variables
		resetPractice();
		MOT.numCorrect = 0;
		MOT.state = "start";
		MOT.stateChange = true;
		
		//clear canvas to black background
		MOT.c.fillStyle="rgb(0, 0, 0)";
		MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);
 	}
 	else { //go onto full task when on the last page
		document.location.href = MOT.exptLink;
 	}
}


// ********************** DRAWING METHODS ************************** //

// this is the main function for controlling what is drawn on the canvas during the practice trials
function drawContent() {
	//clear canvas and setup defaults
	clearCanvas();
	
	//draw on canvas based on state
	if (MOT.state == "start" || MOT.state == "fix") {
		drawFix(); //draw fixation point

		//set font parameters
		MOT.c.fillStyle="black";
		MOT.c.font="12pt Arial";
		MOT.c.textAlign="center";
	}

	else if (MOT.state == "cue" || MOT.state == "move") {
		drawFix(); //draw fixation point
	
		if (MOT.initState) { //it's the initialization state, so set up all the dots
			$("#exptCanvas").css({cursor: 'none'}); //hide the cursor

			//Now draw target and distractor dots moving:
			//choose initial positions and velocities	
			for (var i = 0; i < MOT.numDots; i++) {
				var restart = 1; //keeps track if the initial dot position need to be recalculated
				while (restart) {
					restart = 0;

					//choose the initial x and y position for this dot (a valid position within the boundaries)
					MOT.dotPosX[MOT.trial][i] = Math.random() * 2 * (MOT.maxFix-MOT.minEdge) + MOT.minEdge + MOT.cx - MOT.maxFix;
					MOT.dotPosY[MOT.trial][i] = Math.random() * 2 * (MOT.maxFix-MOT.minEdge) + MOT.minEdge + MOT.cy - MOT.maxFix;
				
					// if the dot ended up outside of the boundaries, then refind a position for this dot
					var r2 = Math.pow(MOT.dotPosX[MOT.trial][i]-MOT.cx, 2) + Math.pow(MOT.dotPosY[MOT.trial][i]-MOT.cy, 2);
					if (r2 < Math.pow(MOT.minFix, 2) || r2 > Math.pow(MOT.maxFix-MOT.minEdge, 2)) {
						restart = 1;
						continue;
					}

					//then check the distances between this dot and all previously positioned dots
					if (!restart && i >= 1) {
						for (var j = 0; j < i; j++) {
							//if it starts too close to another dot, then find a new position for this current dot
							if (Math.pow(MOT.dotPosX[MOT.trial][i]-MOT.dotPosX[MOT.trial][j],2) + Math.pow(MOT.dotPosY[MOT.trial][i]-MOT.dotPosY[MOT.trial][j], 2) < Math.pow(MOT.minSep, 2)) {
								restart = 1;
								break;
							}
						}
					}
				}
			}
		
			for (var i = 0; i < MOT.numDots; i++) {
				//now randomly assign a starting angle of motion for each dot
				MOT.dotMovAng[i] = Math.random() * 2 * Math.PI;

				var faceType;
				//the first X dots in the array start as the cued dots (X = total number of dots to attend to during that trial)
				if (i < MOT.numAttendDots[MOT.trial]) {
					faceType = MOT.img[1];
				}
				else { //the rest are normal dots
					faceType = MOT.img[0];
				}

				//now draw the dot
				MOT.c.drawImage(faceType, MOT.dotPosX[MOT.trial][i] - MOT.dotRad, MOT.dotPosY[MOT.trial][i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
			}
			
			MOT.initState = false; //turn off initialization state
		}
		else { //no longer the initialization state, so just keep the dots moving
			var posXNew = new Array();
			var posYNew = new Array(); 
			var randomize = new Array();

			//assign a random number to each dot
			for (var i = 0; i < MOT.numDots; i++) {
				randomize[i] = Math.random();
			}
			
			for (var i = 0; i < MOT.numDots; i++) {
				//if the dot's number is greater than the straight probability, then the dot's
				//current trajectory will change to a randomly selected angle within the maximum deviation
				if (randomize[i] > MOT.straightProb) {
					var randomness = Math.random() * MOT.angSD;
					if (Math.random() > 0.5) {
						randomness = -randomness;
					}
				
					MOT.dotMovAng[i] = MOT.dotMovAng[i] + randomness;
				}
	
				//predicted position change (calculated based on current position,
				//plus the calculated distance and direction based on angle and dot speed)
				posXNew[i] = MOT.dotPosX[MOT.trial][i] + Math.cos(MOT.dotMovAng[i]) * MOT.vel;
				posYNew[i] = MOT.dotPosY[MOT.trial][i] - Math.sin(MOT.dotMovAng[i]) * MOT.vel;
				
				//if the dot is past the inner or outer boundaries, then reflect the motion of the dot
				// (this makes it looks like it bounces off the boundary walls)
				var r2 = Math.pow(posXNew[i] - MOT.cx, 2) + Math.pow(posYNew[i] - MOT.cy, 2);
				if (r2 < Math.pow(MOT.minFix, 2) || r2 > Math.pow(MOT.maxFix-MOT.minEdge, 2)) {
					var temp = MOT.dotMovAng[i];
					MOT.dotMovAng[i] = 
					2 * Math.atan2(-(MOT.dotPosY[MOT.trial][i] - MOT.cy), MOT.dotPosX[MOT.trial][i] - MOT.cx) - 
					MOT.dotMovAng[i] - Math.PI;
				}
			}
			
			// check if any of the dots collide with each other; if they do, then reflect their motion
			//(similar to billiard balls hitting each other)
			for (var i = 0; i < MOT.numDots-1; i++) {
				for (var j = i+1; j < MOT.numDots; j++) {
					if (Math.pow(posXNew[i] - posXNew[j], 2) + Math.pow(posYNew[i] - posYNew[j], 2) < Math.pow(MOT.minSep, 2)) {
						var tempAngle = MOT.dotMovAng[i];
						MOT.dotMovAng[i] = MOT.dotMovAng[j];
						MOT.dotMovAng[j] = tempAngle;
					}
				}
			}
			
			
			//with these new positions, now update and draw the dots
			for (var i = 0; i < MOT.numDots; i++) {
				//actual new position for this frame
				MOT.dotPosX[MOT.trial][i] = MOT.dotPosX[MOT.trial][i] + Math.cos(MOT.dotMovAng[i]) * MOT.vel;
				MOT.dotPosY[MOT.trial][i] = MOT.dotPosY[MOT.trial][i] - Math.sin(MOT.dotMovAng[i]) * MOT.vel;
				
				//if we're in the cue state, then make sure the dots that need to be cued dots are displayed properly
				var faceType;
				if (MOT.state == "cue" && i < MOT.numAttendDots[MOT.trial]) {
					faceType = MOT.img[1];
				}
				else {
					faceType = MOT.img[0];
				}

				//draw the dot
				MOT.c.drawImage(faceType, MOT.dotPosX[MOT.trial][i] - MOT.dotRad, MOT.dotPosY[MOT.trial][i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
			}
		}
	}
	else if (MOT.state == "response") {
		drawFix(); //draw the fixation point
		
		//now update and draw the dots (no longer moving)
		for (var i = 0; i < MOT.numDots; i++) {
			var faceType;
			//if current dot is the dot to be probed, then change it to the queried dot stimulus
			if (i == MOT.probedDot[MOT.trial]) {
				faceType = MOT.img[2];
			}
			else { //set all the other dots to the normal stimulus image
				faceType = MOT.img[0];
			}

			//draw the dot
			MOT.c.drawImage(faceType, MOT.dotPosX[MOT.trial][i] - MOT.dotRad, MOT.dotPosY[MOT.trial][i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
		}
		
		$("#exptCanvas").css({cursor: 'default'}); //reset the cursor to be visible
		
		

	}
	else if (MOT.state == "feedback") {
		drawFix(); //draw the fixation point

		//display feedback based on if participant is correct or not
		MOT.c.drawImage(MOT.feedbackImg[MOT.correct[MOT.trial-1]], 
			MOT.cx - MOT.feedbackSize/2, MOT.cy - MOT.feedbackSize - 10, MOT.feedbackSize, MOT.feedbackSize);
	}

	else if (MOT.state == "done") {
		//display a message stating that the subject is done with the practice trials
		MOT.c.fillStyle="black";
		MOT.c.font="12pt Arial";
		MOT.c.textAlign="center";
		//MOT.c.fillText("Practice Complete!", MOT.cx, MOT.cy);
		MOT.c.fillText("Entraînement terminé!", MOT.cx, MOT.cy);
	}
}

//clear stimulus area
function clearCanvas() {
	//set the background to black
	MOT.c.fillStyle="rgb(0, 0, 0)";
	MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);

	//create the gray circle that the dots move within
	//(size is the extent of the canvas)
	MOT.c.fillStyle="rgb(128,128,128)";
	MOT.c.beginPath();
	MOT.c.arc(MOT.cx, MOT.cy, Math.floor(MOT.canvas.height/2),0, 2*Math.PI);
	MOT.c.fill();
}

//draw fixation point
function drawFix() {
	MOT.c.fillStyle="white";
	MOT.c.fillRect(MOT.cx-2, MOT.cy-2, 5, 5);
	MOT.c.fillStyle="black";
	MOT.c.fillRect(MOT.cx-1, MOT.cy-1, 3, 3);
}


// ****************** INPUT TRACKER *********************** //

//this is the callback function to start the trials, and it also is called at the end of the feedback state
function startTrial() {
	if (MOT.state == "start" || MOT.state == "fix" || MOT.state == "feedback") {		
		MOT.trialStart = new Date().getTime() - MOT.startTime; //get the start time of a trial
		MOT.state = "cue";
		MOT.stateChange = true;

		//hide the response/start buttons
		$("#reminderButton").hide();
		$("#start-box").hide();
	}

}

//this is the callback function for the response buttons to record the participant's reponse
function getResponseButton(button) {
	$("#response-box").hide(); //hide the response buttons
	if (MOT.state == "response" && MOT.response[MOT.trial] == -1) {
		if (button.id == "yellowButton") { //if they pressed the yellow button
			MOT.rt[MOT.trial] = new Date().getTime()-MOT.startWait;
			MOT.response[MOT.trial] = 0;
			//check if their response was correct
			if (MOT.response[MOT.trial] == MOT.probeTracked[MOT.trial]) {
				MOT.correct[MOT.trial] = 1;
			}
			else {
				MOT.correct[MOT.trial] = 0;
			}
		}
		else if (button.id == "blueButton") { //otherwise, if they pressed the blue button
			MOT.rt[MOT.trial] = new Date().getTime()-MOT.startWait;
			MOT.response[MOT.trial] = 1;
			//check if their response was correct
			if (MOT.response[MOT.trial] == MOT.probeTracked[MOT.trial]) {
				MOT.correct[MOT.trial] = 1;
			}
			else {
				MOT.correct[MOT.trial] = 0;
			}
		}
		
	}
}

// ***************** TRIAL UPDATE ********************* //

//this function prepares the state of the next trial
function updateTrial() {
	//check if the response just given was correct and update the number of correct trials
	if (MOT.correct[MOT.trial]) {
		MOT.numCorrect++;
	}
	
	//send the trial data to the database
	sendTrialData();
	
	MOT.trial++; //update current number of trials completed
	if (MOT.trial % MOT.numTrialsPerCond == 0) { //this ensures that the minimum number of trials per condition is met
		//check that the subject has gone through at least the minimum of each condition and that they have gotten at 
		//least the minimum needed of correct trials OR that they have reached the maximum number of practice trials to complete
		if ((MOT.trial == MOT.numTrialsPerCond*MOT.condition.length && MOT.numCorrect >= MOT.numCorrectNeeded) ||
		MOT.trial == MOT.numTrialsTotal) {
			//set state to done with practice trials
			MOT.done = true;
			MOT.state = "done";

			//display practice completion text
			$("#instructions").html(MOT.noticeText);
			$("#instructions").addClass("highlight");
			$("#instructions").css("text-align", "center");
		}

		// in this case, the subject has not completed the minimum for each trial condition, so update the number of cued dots
		// based on the condition according to the current trial number
		else if (MOT.trial < MOT.numTrialsPerCond*MOT.condition.length) {
			MOT.numAttendDots[MOT.trial] = MOT.condition[MOT.trial/MOT.condition.length];
		}
		//otherwise, stick with the current condition for number of cued dots
		else {
			MOT.numAttendDots[MOT.trial] = MOT.numAttendDots[MOT.trial-1];
		}
	}
	//stick with the current condition for number of cued dots
	else {
		MOT.numAttendDots[MOT.trial] = MOT.numAttendDots[MOT.trial-1];
	}

	//initialize the trial's response value
	MOT.response[MOT.trial] = -1;
}


// ********************* DEMO ANIMATIONS ****************************//
//these control the animations not during the practice trials

//this function chooses the initial positions of the demo dots (same logic as used in the practice trials)
function chooseDemoDotLocs() {
	//choose initial positions and velocities		
	for (var i = 0; i < MOT.numDots; i++) {
		var restart = 1;  //keeps track if the initial dot position need to be recalculated
		while (restart) {
			restart = 0;

			//choose the initial x and y position for this dot (a valid position within the boundaries)
			MOT.demoDotPosX[i] = Math.random() * 2 * (MOT.maxFix-MOT.minEdge) + MOT.minEdge + MOT.cx - MOT.maxFix;
			MOT.demoDotPosY[i] = Math.random() * 2 * (MOT.maxFix-MOT.minEdge) + MOT.minEdge + MOT.cy - MOT.maxFix;
		
			// if the dot ended up outside of the boundaries, then refind a position for this dot
			var r2 = Math.pow(MOT.demoDotPosX[i]-MOT.cx, 2) + Math.pow(MOT.demoDotPosY[i]-MOT.cy, 2);
			if (r2 <= Math.pow(MOT.minFix, 2) || r2 >= Math.pow(MOT.maxFix-MOT.minEdge, 2)) {
				restart = 1;
				continue;
			}

			//then check the distances between this dot and all previously positioned dots
			if (!restart && i >= 1) {
				for (var j = 0; j < i; j++) {

					//if it starts too close to another dot, then find a new position for this current dot
					if (Math.pow(MOT.demoDotPosX[i]-MOT.demoDotPosX[j],2) + Math.pow(MOT.demoDotPosY[i]-MOT.demoDotPosY[j], 2) <= Math.pow(MOT.minSep, 2)) {
						restart = 1;
						break;
					}
				}
			}
		}
	}

	//now randomly assign a starting angle of motion for each dot
	for (var i = 0; i < MOT.numDots; i++) {
		MOT.demoDotMovAng[i] = Math.random() * 2 * Math.PI;
	}
}

//this function draws the dots as either cued dots (i.e., blue sad faces) or normal dots (yellow happy faces) during the demo
function drawFaces() {
	clearCanvas(); //clear canvas
	drawFix(); //draw fixation point

	//check what type to draw each dot as
	for (var i = 0; i < MOT.numDots; i++) {		
		var faceType;
		if (i < MOT.demoNumAttendDots) {
			faceType = MOT.img[1];
		}
		else {
			faceType = MOT.img[0];
		}

		//draw the dot
		MOT.c.drawImage(faceType, MOT.demoDotPosX[i] - MOT.dotRad, MOT.demoDotPosY[i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
	}
}

//this function updates the position of the dots during the demo
function drawMoveState() {	
	var posXNew = new Array();
	var posYNew = new Array(); 
	var randomize = new Array();

	//assign a random number to each dot
	for (var i = 0; i < MOT.numDots; i++) {
		randomize[i] = Math.random();
	}
	
	//if the dot's number is greater than the straight probability, then the dot's
	//current trajectory will change to a randomly selected angle within the maximum deviation
	for (var i = 0; i < MOT.numDots; i++) {
		if (randomize[i] > MOT.straightProb) {
			var randomness = Math.random() * MOT.angSD;
			if (Math.random() > 0.5) {
				randomness = -randomness;
			}
		
			MOT.demoDotMovAng[i] = MOT.demoDotMovAng[i] + randomness;
		}

		//predicted position change (calculated based on current position,
		//plus the calculated distance and direction based on angle and dot speed)
		posXNew[i] = MOT.demoDotPosX[i] + Math.cos(MOT.demoDotMovAng[i]) * MOT.vel;
		posYNew[i] = MOT.demoDotPosY[i] - Math.sin(MOT.demoDotMovAng[i]) * MOT.vel;
		
		//if the dot is past the inner or outer boundaries, then reflect the motion of the dot
		// (this makes it looks like it bounces off the boundary walls)
		var r2 = Math.pow(posXNew[i] - MOT.cx, 2) + Math.pow(posYNew[i] - MOT.cy, 2);
		if (r2 < Math.pow(MOT.minFix, 2) || r2 > Math.pow(MOT.maxFix-MOT.minEdge, 2)) {
			var temp = MOT.demoDotMovAng[i];
			MOT.demoDotMovAng[i] = 
			2 * Math.atan2(-(MOT.demoDotPosY[i] - MOT.cy), MOT.demoDotPosX[i] - MOT.cx) - 
			MOT.demoDotMovAng[i] - Math.PI;
		}
	}
	
	// check if any of the dots collide with each other; if they do, then reflect their motion
	//(similar to billiard balls hitting each other)
	for (var i = 0; i < MOT.numDots-1; i++) {
		for (var j = i+1; j < MOT.numDots; j++) {
			if (Math.pow(posXNew[i] - posXNew[j], 2) + Math.pow(posYNew[i] - posYNew[j], 2) < Math.pow(MOT.minSep, 2)) {
				var tempAngle = MOT.demoDotMovAng[i];
				MOT.demoDotMovAng[i] = MOT.demoDotMovAng[j];
				MOT.demoDotMovAng[j] = tempAngle;
			}
		}
	}
	
	
	//with these new positions, now update and draw the dots
	for (var i = 0; i < MOT.numDots; i++) {

		//actual new position for this frame
		MOT.demoDotPosX[i] = MOT.demoDotPosX[i] + Math.cos(MOT.demoDotMovAng[i]) * MOT.vel;
		MOT.demoDotPosY[i] = MOT.demoDotPosY[i] - Math.sin(MOT.demoDotMovAng[i]) * MOT.vel;
		
		var faceType;
		//if we're in the cue state for the demo, then make sure the dots that need to be cued dots are displayed properly
		if (MOT.pageLabels[MOT.curPage] == "cue" && i < MOT.demoNumAttendDots) {
			faceType = MOT.img[1];
		}
		else {
			faceType = MOT.img[0];
		}

		//draw the dot
		MOT.c.drawImage(faceType, MOT.demoDotPosX[i] - MOT.dotRad, MOT.demoDotPosY[i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
	}
}

// this function changes the selected dot to the queried dot during the demo
function drawQueryState() {
	//now update and draw the dots
	for (var i = 0; i < MOT.numDots; i++) {
		var faceType;
		if (i == 0) { //just select the first dot in the array as the queried dot for demo purposes
			faceType = MOT.img[2];
		}
		else {
			faceType = MOT.img[0];
		}

		//draw the dot
		MOT.c.drawImage(faceType, MOT.demoDotPosX[i] - MOT.dotRad, MOT.demoDotPosY[i] - MOT.dotRad, MOT.imgsz, MOT.imgsz);
	}
}


// ***********************MISCELLANEOUS FUNCTIONS ***************************** //

//create empty template for 2D array (2 x maxTrials)
function createEmptyDotArray() {
	var emptyDotArray = new Array();
	//for (var i = 0; i < MOT.numTrials; i++) {
	for (var i = 0; i < MOT.numTrialsTotal; i++) {
		emptyDotArray[i] = new Array();
		for (var j = 0; j < MOT.numDots; j++) {
			emptyDotArray[i][j] = -1;
		}
	}
	return emptyDotArray;
}

//reset all practice variables 
function resetPractice() {
	MOT.trial = 0;
	MOT.response = new Array();
	MOT.correct = new Array();
	MOT.rt = new Array();
	MOT.response[0] = -1;
	MOT.correct[0] = -1;
	MOT.rt[0] = -1;
	MOT.numCorrect = 0;
	MOT.done = false;

	MOT.dotPosX = createEmptyDotArray();
	MOT.dotPosY = createEmptyDotArray();
	MOT.dotMovAng = new Array();
	MOT.numAttendDots = new Array();
	MOT.numAttendDots[0] = MOT.condition[0];
	MOT.probeTracked = new Array();
	MOT.probedDot = new Array();
}

//send the practice trial results to the database via the MOT/savePractice.php script
// (this is called after the completion of each individual trial)
function sendTrialData() {

	//send data asynchronously
	$.ajax({
		type: "POST",
		url: "savePractice.php",
		data: {trial: MOT.trial+1, //MOT.trial starts at 0, so just shifting trials to start at 1
		 trialStart: MOT.trialStart, //trial start time
		 numAttendDots: MOT.numAttendDots[MOT.trial], //number of cued dots during this trial
		 probeTracked: MOT.probeTracked[MOT.trial], //if the queried dot was initially a cued dot
		 response: MOT.response[MOT.trial], //the subject's response to the trial
		 correct: MOT.correct[MOT.trial], //if the subject was correct or not
		 rt: MOT.rt[MOT.trial], //the subject's response time for this trial
		 pxperdeg: MOT.pxperdeg //the pixels per degree used for determining stimuli size
		}
	});

}




