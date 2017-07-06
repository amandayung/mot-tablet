//Changes:
/* MOT/code.js:
 * This controls the logic and presentation of trials during the full version of the MOT task.
 * The calibration information set by the MOT.pxperdeg parameter is used to determine the size of the stimuli
 * on the screen. **NOTE**: you must set the pxperdeg value yourself to match your setup! **
 * 
 * During a trial, there are several dots that move around the screen. At the beginning of a trial, 1 or more dots are chosen 
 * as the dots the subject should attend to (cued dots, which appear as blue sad faces). After a set amount of time, these dots change
 * to appear like the other dots (yellow happy faces) and continue to move around with the other dots. Then after another set amount
 * of time, all the dots stop and one dot is highlighted (queried dot). The subject must respond whether the queried dot was originally
 * a cued dot or if it was a normal dot throughout the entire trial.
 * The number of cued dots per trial is determined by a staircase, set by the parameters below.
 */

// *********************** VARIABLES ************************ //
var MOT = {}; //storage for all variables in this task

//where to send the participant after they're done
MOT.exptLink = "../index.php";

// Screen Calibration variables ----------------------------------
// *** You will need to set the pixels per degree value yourself based on your setup!
// The values below were ones used for our study, based on our tablet's dimensions and resolution
MOT.pxperdeg = 44.96; //calculated pixels per degree, based on a 30cm viewing distance away from the screen

//stimuli and trial variables ----------------------------------

//setup the images used for the stimuli
MOT.img = new Array(new Image(), new Image(), new Image());
var imgDir = "./img/"; //image directory
MOT.img[0].src =  imgDir + "happy_face.png"; //happy, yellow face
MOT.img[1].src =  imgDir + "sad_face.png"; //sad, blue face
MOT.img[2].src =  imgDir + "query.png"; //probe stimulus
MOT.feedbackImg = new Array(new Image(), new Image());
MOT.feedbackImg[0].src = imgDir + "wrong.png"; //incorrect response feedback
MOT.feedbackImg[1].src = imgDir + "correct.png"; //correct response feedback
MOT.feedbackSize = 50; //size of feeback (pixels)

//timing variables
MOT.speed = 16; //length of time for each frame (ms/frame)
MOT.tCue = 2000; //duration of presentation of cue (ms)
MOT.tMove = 5000; //duration of dots moving (after the cue period) before asking about probed dot (ms)
MOT.dotVel = 5; //velocity of dots in degrees/sec
MOT.vel = Math.ceil(MOT.dotVel * MOT.pxperdeg / (1/(MOT.speed/1000))); //velocity of dots in pixels/frame
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
MOT.minFix = Math.round(3*MOT.pxperdeg); //minimum distance allowed from fixation (deg*ppd)
MOT.maxFix = Math.round(10*MOT.pxperdeg); //maximum distance allowed from fixation (deg*ppd)
MOT.minEdge = Math.ceil(2*Math.sqrt(2)*(MOT.vel+1))+MOT.dotRad+4; //minimum distance from edge

//staircase variables
MOT.numDots = 16; //how many dots to show in total
MOT.maxTrials = 60; //maximum number of trials to complete
MOT.maxAttendDots = 8; //maximum number of dots that need to be attended to
MOT.minAttendDots = 1; //minimum number of dots that need to be attended to
MOT.initAttendDots = 1; //initial number of cued dots

MOT.correctInc = 1; //how many cued dots to add as the staircase increases
MOT.incorrectDec = 1; //how many cued dots to remove as the staircase decreases
MOT.stepSize = 1; //how many wrong/correct the subject needs in order to decrease/increase the staircase
MOT.stopReversals = 60; //how many reversals the participant needs in order to stop the task
						//(since it is currently set to the number of max trials, this means they have to do all trials)

//initialize values for staircase tracking variables
MOT.staircaseDirection = 0; //what direction the staircase is currently going in
MOT.currentCorrect = 0; //how many they have currently correct in a row
MOT.currentIncorrect = 0; //how many they have currently wrong in a row
MOT.currentReversals = 0; //current number of reversals achieved

//counters and data arrays
MOT.trial = 0; //keep track of current trial
MOT.trialStart = new Array(); //stores start time of each trial
MOT.response = new Array(); //stores subject's responses per trial
MOT.correct = new Array(); //stores if subject was correct per trial
MOT.rt = new Array(); //response time per trial
MOT.reversals = new Array(); //stores number of reversals in the staircase at each trial
MOT.numAttendDots = new Array(); //stores how many dots needed to be attended to for each trial

// initialize first trial values
MOT.numAttendDots[0] = MOT.initAttendDots; //use the starting value of the staircase
MOT.response[0] = -1;
MOT.correct[0] = -1;
MOT.rt[0] = -1;

MOT.dotPosX = createEmptyDotArray(); //stores X position of each dot per trial (updated at each frame)
MOT.dotPosY = createEmptyDotArray(); //stores Y position of each dot per trial (updated at each frame)
MOT.dotMovAng = new Array(); //stores current angle of motion for each dot (updated at each frame)
MOT.probeTracked = new Array(); //store whether the trial asked if a dot that needed to be attended to (blue) was the dot that was queried about at the end of a trial
MOT.probedDot = new Array(); //store the identity of the probed dot (the one asked about at the end of the trial)

//state control --------------------------------------------------
MOT.state = "start"; //this keeps track of the trial state; state order: start/fix, cue, move, response, feedback (then back to fix)
MOT.stateChange = false; //keeps track if the state changed during the trial
MOT.done = false; //keeps track if subject is done with all the trials
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

//setup buttons and dialog windows
function init() { 
	//hide content before subject starts
	$(".modal-container").hide();
	$("#postexpt").hide();
	$("#start-box").hide();
	$("#response-box").hide();

	//** for the button callbacks, the tablet we used required us to override an unwanted behavior using the
	//touchstart callback -- because of this, there are functions that appear to do the same thing twice
	//for each button

	//set up the continue button that allows the subject to start the task
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
}


//this function initializes the HTML5 canvas for stimuli presentation
function initCanvas() {
	//hide initial message
	$("#preexpt").hide();
	
	//initialize canvas
	MOT.canvas = document.getElementById("exptCanvas");
	MOT.c = MOT.canvas.getContext("2d");
	MOT.canvas.height = window.innerHeight; //make the canvas as big as possible
	MOT.canvas.width = window.innerWidth; //make the canvas square
	MOT.cx = Math.round(MOT.canvas.width/2); //get center x coordinate of canvas
	MOT.cy = Math.round(MOT.canvas.height/2); //get center y coordinate of canvas
	MOT.c.fillStyle="rgb(0, 0, 0)"; //set the canvas color to black
	MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);
	
	//update the dots' maximum distance they can be away from the fixation point
	//if the subject's screen cannot support the maximum distance originally set,
	//then set the distance to be the radius of the canvas
	MOT.maxFix = Math.min(MOT.maxFix, MOT.cy);
	MOT.stateChange = true; //update the content to the current state
	MOT.startTime = new Date().getTime(); //get the task start time
	draw(); //start the task
}


// ************************* STATE UPDATES *************************** //

//At each frame, the frame is redrawn based on the current state
function updateFrame() {	
	if (MOT.state == "start" || MOT.state == "fix") { //start of task or start of trial
		if (MOT.stateChange) {
			$("#reminderButton").show();
			MOT.stateChange = false; //turn off state change
			drawContent(); //draw updated content
			$("#start-box").show(); //show button to start the trial
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
			MOT.startTimes[MOT.trial] = MOT.startWait; //record when the dots started moving
			drawContent(); //draw updated content
		}
		//check how much time has passed; if the full time for the cue period has passed, move onto the "response" state
		var curTime = new Date().getTime();
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
				MOT.probedDot[MOT.trial] = Math.floor(Math.random()*(MOT.numDots-MOT.numAttendDots[MOT.trial]))+MOT.numAttendDots[MOT.trial];
			}
			
			drawContent(); //update the content

			//show the response buttons
			$("#response-box").show();
		}
		//once the subject has given a response for the trial, then move on
		if (MOT.response[MOT.trial] != -1) {
			updateStaircase(); //update the staircase
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
			//if this was the last trial, then the subject is done
			if (MOT.done) {
				MOT.state = "done";
				submitResults(); //add their data to the database
				MOT.stateChange = true;

			}

			else { //otherwise, move onto the next trial
				startTrial();
			}

		}
	}
}


// ********************** DRAWING METHODS ************************** //

// this is the main function for controlling what is drawn on the canvas during the trials
function drawContent() {
	//clear canvas and setup defaults
	MOT.c.fillStyle="rgb(0, 0, 0)";
	MOT.c.fillRect(0,0,MOT.canvas.width,MOT.canvas.height);

	//create the gray circle that the dots move within
	//(size is the extent of the canvas)
	MOT.c.fillStyle="rgb(128,128,128)";
	MOT.c.beginPath();
	MOT.c.arc(MOT.cx, MOT.cy, Math.floor(MOT.canvas.height/2),0, 2*Math.PI);
	MOT.c.fill();	
	
	//draw on canvas based on state
	if (MOT.state == "start") {		
		drawFix(); //draw fixation point
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
		MOT.trialStart[MOT.trial] = new Date().getTime()-MOT.startTime; //get the start time of a trial
		MOT.state = "cue";
		MOT.stateChange = true;

		//hide the start button
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
		}
		else if (button.id == "blueButton") { //otherwise, if they pressed the blue button
			MOT.rt[MOT.trial] = new Date().getTime()-MOT.startWait;
			MOT.response[MOT.trial] = 1;
		}

		//check if their response was correct
		if (MOT.response[MOT.trial] == MOT.probeTracked[MOT.trial]) {
			MOT.correct[MOT.trial] = 1;
		}
		else {
			MOT.correct[MOT.trial] = 0;
		}	
	}
}

// ***************** TRIAL UPDATE ********************* //

//this function prepares the state of the next trial
function updateTrial() {
	MOT.trial++;
	if (MOT.trial >= MOT.maxTrials || MOT.stopReversals == MOT.currentReversals) {
		MOT.done = true;
	}
	else {
		MOT.response[MOT.trial] = -1;
	}
}

// update the staircase to determine how many cued dots there are for the next trial
function updateStaircase() {
	//set an initial value for the next trial
	MOT.numAttendDots[MOT.trial+1] = MOT.numAttendDots[MOT.trial];

	// if correct, check if the staircase needs to be increased
	if (MOT.correct[MOT.trial] == 1) {
		MOT.currentCorrect++;

		//check if the current correct responses in a row match the step limit
		if (MOT.currentCorrect == MOT.correctInc) {
			//if it does, increase the number of cued dots by 1 (not more than the maximum)
			if (MOT.numAttendDots[MOT.trial] < MOT.maxAttendDots) {
				MOT.numAttendDots[MOT.trial+1] = MOT.numAttendDots[MOT.trial]+1;
			}
			//reset counters
			MOT.currentCorrect = 0;
			MOT.currentIncorrect = 0;

			//check if reversal count should be updated if the direction of the staircase changed
			if (MOT.staircaseDirection == -1) { //-1 means it was decreasing
				MOT.currentReversals++;
				MOT.staircaseDirection = 1; //now increasing
			}
			//if not currently going in any direction (only occurs at the start),
			//then initialize it
			else if (MOT.staircaseDirection == 0) {
				MOT.staircaseDirection = 1;
			}
		}
	}
	else { //otherwise, they were incorrect, so check if we need to decrease the staircase
		MOT.currentIncorrect++;

		//check if the current incorrect responses in a row match the step limit
		if (MOT.currentIncorrect == MOT.incorrectDec) {
			//if it does, decrease the step by 1 (not less than the minimum)
			if (MOT.numAttendDots[MOT.trial] > MOT.minAttendDots) {
				MOT.numAttendDots[MOT.trial+1] = MOT.numAttendDots[MOT.trial]-1;
			}
			//reset counters
			MOT.currentCorrect = 0;
			MOT.currentIncorrect = 0;
		}

		//check if reversal count should be updated
		if (MOT.staircaseDirection == 1) { //1 means it was increasing
			MOT.currentReversals++;
			MOT.staircaseDirection = -1; //now it's decreasing
		}
		//if not currently going in any direction (only occurs at the start),
		//then initialize it
		else if (MOT.staircaseDirection == 0) {
			MOT.staircaseDirection = -1;
		}
	}
	//record the current number of reversals achieved at this point in time
	MOT.reversals[MOT.trial] = MOT.currentReversals;

}


// ***********************MISCELLANEOUS FUNCTIONS ***************************** //

//Once the subject is done with all the trials, send all the data at once to the database 
//via the MOT/save-sc.php script; data is passed with semicolons separating each trial's data
function submitResults() {
	//send data asynchronously
	console.log("submitting results...");
	$.ajax({
		type: "POST",
		url: "save-sc.php",
		data: {trialStart: MOT.trialStart.join(";"), //trial numbers
		 numAttendDots: MOT.numAttendDots.join(";"), // number of dots attended for each trial
		 probeTracked: MOT.probeTracked.join(";"), //if the queried dot for each trial was initially a cued dot
		 response: MOT.response.join(";"), //the subject's response for each trial
		 correct: MOT.correct.join(";"), //if the subject was correct for each trial
		 rt: MOT.rt.join(";"), //the subject's response time for each trial
		 reversals: MOT.reversals.join(";"), //number of reversals in the staircase at each trial
		 canvasWidth: MOT.canvas.width, //the canvas's height (px)
		 canvasHeight: MOT.canvas.height, //the canvas's width (px)
		 pxperdeg: MOT.pxperdeg} //the pixels per degree used for determining stimuli size
	}).done(function(msg) {
		console.log(msg);
		endExpt();
	}); //once the script is done, then go to the end of the task

}

//show the final message to the participant once the task is over
function endExpt() {
	$("#exptCanvas").hide();
	$("#postexpt").show();
	//document.location.href = MOT.exptLink;
}

///create template for 2D array (2 x maxTrials)
function createEmptyDotArray() {
	var emptyDotArray = new Array();
	for (var i = 0; i < MOT.maxTrials; i++) {
		emptyDotArray[i] = new Array();
		for (var j = 0; j < MOT.numDots; j++) {
			emptyDotArray[i][j] = -1;
		}
	}
	return emptyDotArray;
}




