-- phpMyAdmin SQL Dump
-- version 4.0.10.10
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Server version: 5.5.54
-- PHP Version: 5.6.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `mobile`
--

-- --------------------------------------------------------

--
-- Table structure for table `motpractice`
--

CREATE TABLE IF NOT EXISTS `motpractice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sid` varchar(30) CHARACTER SET latin1 DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `trial` int(11) DEFAULT NULL,
  `trialStart` double DEFAULT NULL,
  `numAttendDots` int(11) DEFAULT NULL,
  `probeTracked` int(11) DEFAULT NULL,
  `response` int(11) DEFAULT NULL,
  `correct` int(11) DEFAULT NULL,
  `rt` double DEFAULT NULL,
  `pxperdeg` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table `motsc`
--

CREATE TABLE IF NOT EXISTS `motsc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sid` varchar(30) CHARACTER SET latin1 DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `trial` int(11) DEFAULT NULL,
  `trialStart` double DEFAULT NULL,
  `numAttendDots` int(11) DEFAULT NULL,
  `probeTracked` int(11) DEFAULT NULL,
  `response` int(11) DEFAULT NULL,
  `correct` int(11) DEFAULT NULL,
  `rt` double DEFAULT NULL,
  `reversals` tinyint(4) DEFAULT NULL,
  `canvasWidth` int(10) DEFAULT NULL,
  `canvasHeight` int(10) DEFAULT NULL,
  `pxperdeg` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sid` varchar(30) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
