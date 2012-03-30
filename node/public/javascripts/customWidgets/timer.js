/***********************************************************************************************************************/
/*BASIC TIMER*/

/****Constructor****/
BasicTimer = function()
{
  this.startDate = new Date(0);
  this.pauseDate = new Date(0);
  this.state = "stopped";
}

BasicTimer.prototype.SetWorkingPeriod = function(workingPeriod)
{
  this.workingPeriod = workingPeriod;
  this.mode = 1; //Timer has it's working period set
}

BasicTimer.prototype.SetFinalDate = function(endDate)
{
  this.endDate = new Date(endDate);
  this.mode = 2; //Timer has it's final date set
}

/****Initialization of paused timer****/
BasicTimer.prototype.InitPaused = function(startDate, pauseDate/*as string 'dd/mm/yyyy hh:mm'*/)
{
  if(typeof(startDate)=='undefined') startDate = 0; //default value
  if(startDate)
    this.startDate = new Date(startDate);
  else //If startDate isn't set, start timer right from now
    this.startDate = new Date();
  
  this.pauseDate = new Date(pauseDate);
  this.state = "paused";
}

/****Start the timer****/
BasicTimer.prototype.Start = function(startDate)
{
  if(typeof(startDate)=='undefined') startDate = 0; //default value
  if(startDate)
    this.startDate = new Date(startDate);
  else //If startDate isn't set, start timer right from now
    this.startDate = new Date();
  this.state = "running";
  
  //If timer has final date, we need to evaluate its working period
  if(this.mode == 2)
    this.workingPeriod = this.endDate.getTime() - this.startDate.getTime();
}

/****Pause the timer without resetting it****/
BasicTimer.prototype.Pause = function()
{
  if(this.state != "paused")
  {
    this.state = "paused";
    this.pauseDate = new Date();
  }
}

/****Resume the timer, if it was paused. In other case do nothing****/
BasicTimer.prototype.Resume = function()
{
  if(this.state == "paused")
  {
    resumeDate = new Date();
    this.state = "running";
    this.workingPeriod += resumeDate.getTime() - this.pauseDate.getTime();
  }
}

/****Stop and reset the timer****/
BasicTimer.prototype.Stop = function()
{
  this.state = "stopped";
}

/****Get remaining time in milliseconds****/
BasicTimer.prototype.getRemainingTime = function()
{
  if(this.state == "stopped") return -1;
  if(this.state == "finished") return 0;
  if(this.state == "running")
  {
    date = new Date();
    res = new Date(this.workingPeriod - (date.getTime() - this.startDate.getTime()));
  }
  else if(this.state == "paused")
    res = new Date(this.workingPeriod - (this.pauseDate.getTime() - this.startDate.getTime()));
  
  return res.getTime() > 0 ? res.getTime() : 0;
}

/****Get remaining time as string****/
BasicTimer.prototype.getRemainingTimeAsString = function()
{
  if(this.state == "stopped")
    return "Таймер остановлен!";
  else if(this.state == "running")
  {
    date = new Date();
    res = new Date(this.workingPeriod - (date.getTime() - this.startDate.getTime()));
  }
  else if(this.state == "paused")
    res = new Date(this.workingPeriod - (this.pauseDate.getTime() - this.startDate.getTime()));
  else res = new Date(0);
  
  resString = GetTimeIntervalString(res);
  return resString.length > 0 ? resString : "Время истекло!";
}

/****Get value for saving purposes****/
BasicTimer.prototype.getValue = function()
{
  var ONE_DAY = 1000 * 60 * 60 * 24;
  var ONE_HOUR = 1000 * 60 * 60;
  res = new Object();
  res.startDate = this.startDate.getTime();
  res.workingPeriod = new Object();
  res.workingPeriod.days = NumOfDays(this.workingPeriod);
  res.workingPeriod.hours = NumOfHours(this.workingPeriod)
  res.workingPeriod.leftover = this.workingPeriod - res.workingPeriod.days * ONE_DAY - res.workingPeriod.hours * ONE_HOUR;
  res.state = this.state;
  res.pauseDate = this.pauseDate.getTime();
  if(this.mode == 2) res.endDate = this.endDate.getTime();
  
  return res;
}

/****Check if the timer has finished running (return "true" in this case)****/
BasicTimer.prototype.TestTimer = function()
{
  var curDate = new Date();
  if(this.state == "running" && (curDate.getTime() - this.startDate.getTime() >= this.workingPeriod))
  {
    this.state = "finished";
    return true; //Timer's finished running
  }
  return false; //Timer is still running
}

/****Get the state of our timer****/
BasicTimer.prototype.GetState = function()
{
  return this.state;
}

/****Fictitious validating for compability purposes****/
BasicTimer.prototype.validate = function()
{
  return true;
}

/***********************************************************************************************************************/
/*HEPLERS*/
function DaysBetween(date1, date2)
{
    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = Math.abs(date1_ms - date2_ms);
    
    // Convert back to days and return
    return Math.floor(difference_ms/ONE_DAY);
}

function NumOfDays(period)
{
    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;     
    // Convert back to days and return
    return Math.floor(period/ONE_DAY);
}

function NumOfHours(period)
{
    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24; 
    var ONE_HOUR = 1000 * 60 * 60;
    // Convert back to days and return
    return Math.floor((period - NumOfDays(period) * ONE_DAY) / ONE_HOUR);
}

function GetTimeIntervalString(date)
{
  if(date.getTime() < 0) return '';
  var res = NumOfDays(date.getTime()) + " дней ";
  var hours =  date.getUTCHours();
  if(hours < 10) hours = '0' + hours;
  var minutes = date.getUTCMinutes();
  if(minutes < 10) minutes = '0' + minutes;
  var seconds = date.getUTCSeconds()
  if(seconds < 10) seconds = '0' + seconds;
  res = res + hours + ':' + minutes + ':' + seconds;
  return res;
}