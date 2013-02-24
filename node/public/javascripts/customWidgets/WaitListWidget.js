// function WaitListWidget(element, parentEl, value)
function WaitListWidget(strValue)
{ 
  if(typeof strValue == "string")
      var value = JSON.parse(strValue);
  else
      var value = strValue;
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  
  if(typeof value == "undefined")
  {
      this.isok = 1;
      this.value = "not passable";
  }
  else
  {
      this.value = value.value;
      this.isok = value.isok;
  }
};

WaitListWidget.prototype.getValue = function()
{
  return { value    : this.value,
           isok     : this.isok      };
};

WaitListWidget.prototype.validate = function()
{
  return true;
};
