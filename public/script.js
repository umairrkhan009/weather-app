const dayArray = ["Sun", "Mon","Tue", "Wed", "Thu", "Fri", "Sat"];
var loc ;

const currDate = new Date(date0);
const d = currDate.getDay();
var day = document.querySelector(".date");
day.innerHTML = dayArray[d];



var todaySunrise = document.querySelector(".sunrise");
todaySunrise.innerHTML = sunrise.slice(11);


const currDate1 = new Date(date1);
const d1 = currDate1.getDay();
var day1 = document.querySelector(".date1").innerHTML = dayArray[d1];






