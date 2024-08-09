const countdown = document.getElementById('countdown');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

function updateCountdown(){
    const currentDate = new Date();
    // Define target date as August 12th
    const targetDate = new Date(currentDate.getFullYear(), 7, 12); 
    // If target date has already passed in the current year, set it to the next year
    if (currentDate > targetDate) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
    }
    const timeRemaining = targetDate - currentDate;
    const days = Math.floor(timeRemaining / (1000*60*60*24));
    const hours =Math.floor((timeRemaining % (1000*60*60*24))/(1000*60*60));
    const minutes = Math.floor((timeRemaining % (1000*60*60))/(1000*60));
    const seconds = Math.floor((timeRemaining % (1000*60))/1000);

    daysEl.innerHTML = days;
    hoursEl.innerHTML = hours;
    minutesEl.innerHTML = minutes;
    secondsEl.innerHTML = seconds;
}

updateCountdown();
setInterval(updateCountdown, 1000);
