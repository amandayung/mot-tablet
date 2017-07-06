# Tablet Version of the MOT Task (French Translation)

![MOT preview](https://raw.githubusercontent.com/amandayung/mot-tablet/master/mot/img/mot_preview.png "MOT task")

This is the code used for running the tablet version of the Multiple Object Tracking (MOT) task. It was originally designed for running with children in classrooms. The particular group of children spoke French, which is why this version has French instructions and text. (In the code, you can also see the original English text.)

Participants will first login at the index page with either a username they choose or one you assign them. They are then walked through a tutorial with practice trials. After successfully completing a certain number of practice trials, they are moved onto the main task.

As in all MOT tasks, the participant must track a subset of the dots that are moving around the screen. In this task, the cued dots originally are blue, sad faces. After a given amount of time, they will switch to happy, yellow faces to match the other dots also moving around the screen. One of the dots will then show a question mark -- this prompts the participant to respond whether this face originally started as a blue face, or if it was always a yellow face. 

Since this is a tablet version of the task, all responses are given by pressing buttons (versus a keyboard response in the original version of this task). This version of the task also changes the number of cued dots per trial based on a staircase procedure (currently set to a 1-up, 1-down staircase).

This is not a standalone program and will need to be run in a web browser (preferably Chrome or Firefox) with an internet connection.


## Setup
You will need to set the values of `MOT.pxperdeg` in the files `MOT\practicecode.js` and `MOT\code-sc.js`to match the configuration of your setup. The current values are what were used with our 10.1" tablet, assuming a distance away of 30cm.

Since this is a web application, you will also need a web server with PHP and a MySQL database.  If you are unfamiliar with this process, there are many tutorials available online to get you started. We currently have our web server set up using [Amazon Web Services](https://aws.amazon.com/), which also provides a [tutorial on how to setup a LAMP (Linux-Apache-MySQL-PHP) server](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-LAMP.html).

You will also need to fill in your own MySQL user credentials in the file `php_utils/connectToDB.php` so that you can connect to your database.

Additionally, the file `db/db-structure.sql` is a replica of our MySQL database's structure. If you import this .sql file into your database, you can then have a matching database structure to ensure all of the PHP scripts accessing the database work as intended.


#### Disclaimer
Unfortunately due to time constraints, I am unable to offer much assistance to those seeking help with using this code. However, I hope the comments throughout the code will be useful!


## Code Structure

The files are organized as follows:

__General use files:__
* db/db-structure.sql
* php_utils/connectToDB.php

__Files for the login page:__
* index.php
* css/style.css
* login_main.php
* img/

__Files for MOT:__

_Practice files:_
* MOT/practice.php
* MOT/practicecode.js
* MOT/practicestyle.css
* MOT/savePractice.php

_Full task files:_
* MOT/sc.php
* MOT/code-sc.js
* MOT/exptstyle.css
* MOT/save-sc.php

_Image files in:_
* MOT/img

__Other library files (no need to modify them):__
* css/bootstrap.min.css
* fonts/
* js/
