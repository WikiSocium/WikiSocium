function YandexMapsWidget(_widgetid, value)
{ 
  this.widgetid = _widgetid;
  this.setOptions = function(param) // StepsController требует наличия этой функции у всех виджетов.
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  try
  {
    var val = JSON.parse(value);
  }
  catch(e)
  {
    var val = {};
  }
  
  $("#YandexMapsWidgetInputWS_" + this.widgetid).val(val.address);
  window[this.widgetid + "_map_coords"] = val.coords;
};

YandexMapsWidget.prototype.getValue = function()
{
    return {address : $("#YandexMapsWidgetInputWS_" + this.widgetid).val(),
            coords  : window[this.widgetid + "_map_coords"]};
};

YandexMapsWidget.prototype.validate = function()
{
    return true;
};
