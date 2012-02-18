/*********************/
/*BASIC TIMER*/

BasicTimer = function(workingPeriod /*in seconds*/)
{
  this.workingPeriod = workingPeriod;
}

//Initialization of paused timer
BasicTimer.prototype.InitPaused = function(startDate, pauseDate/*as string 'dd/mm/yyyy hh:mm'*/)
{
  if(typeof(startDate)==='undefined') startDate = 0; //default value
  if(startDate)
    this.startDate = new Date(startDate);
  else //If startDate isn't set, start timer right from now
    this.startDate = new Date();
  
  this.paused = true;
  this.pauseDate = new Date(pauseDate);
}

BasicTimer.prototype.Start = function(startDate)
{
  if(typeof(startDate)==='undefined') startDate = 0; //default value
  if(startDate)
    this.startDate = new Date(startDate);
  else //If startDate isn't set, start timer right from now
    this.startDate = new Date();
  this.isRunning = true;
}

BasicTimer.prototype.Pause = function()
{
  if(!this.paused)
  {
    this.paused = true;
    this.isRunning = false;
    this.pauseDate = new Date();
  }
}

BasicTimer.prototype.Resume = function()
{
  if(this.paused)
  {
    resumeDate = new Date();
    this.isRunning = true;
    this.paused = false;
    this.workingPeriod += resumeDate.getTime() - this.pauseDate.getTime();
  }
}

BasicTimer.prototype.Stop = function()
{
  this.isRunning = false;
}

BasicTimer.prototype.getRemainingTime = function()
{
  if(!this.paused)
  {
    date = new Date();
    res = new Date(this.workingPeriod - (date.getTime() - this.startDate.getTime()));
  }
  else
    res = new Date(this.workingPeriod - (this.pauseDate.getTime() - this.startDate.getTime()));
  
  return res.getTime() > 0 ? res.toLocaleTimeString() : 0;
}

BasicTimer.prototype.getValue = function()
{
  res = new Object();
  if(this.TestTimer())
  {
    res.startDate = this.startDate.getTime();
    res.workingPeriod = this.workingPeriod;
    res.state = "running";
    res.pauseDate = 0;
  }
  else if(this.paused)
  {
    res.startDate = this.startDate.getTime();
    res.workingPeriod = this.workingPeriod;
    res.state = "paused";
    res.pauseDate = this.pauseDate.getTime();
  }
  else if(typeof(startDate)==='undefined')
  {
    res.startDate = '';
    res.workingPeriod = this.workingPeriod;
    res.state = "stopped";
    res.pauseDate = 0;
  }
  else
  {
    res.startDate = this.startDate.getTime();
    res.workingPeriod = this.workingPeriod;
    res.state = "stopped";
    res.pauseDate = 0;
  }
  return res;
}

BasicTimer.prototype.TestTimer = function()
{
  if(this.paused) return false;
  
  var curDate = new Date();
  if(this.isRunning && (curDate.getTime() - this.startDate.getTime() >= this.workingPeriod))
  {
    this.isRunning = false;
    return false; //Timer's stopped
  }
  return this.isRunning; //Timer is still running
}

BasicTimer.prototype.validate = function()
{
  return true;
}
/*********************/
/*********************/

/*********************/
/**/