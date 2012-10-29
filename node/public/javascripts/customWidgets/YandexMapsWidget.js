function YandexMapsWidget(_widgetid, value)
{ 
  this.widgetid = _widgetid;
  var val = JSON.parse(value);
  
  console.log("creating " + _widgetid + " object with: ");
  console.log(val);
  
  $("#YandexMapsWidgetInputWS_" + this.widgetid).val(val.address);
  window[this.widgetid + "_map_coords"] = val.coords;
};

YandexMapsWidget.prototype.getValue = function()
{
    console.log("getValue: ");
    console.log(window[this.widgetid + "_map_coords"]);
    
    return {address : $("#YandexMapsWidgetInputWS_" + this.widgetid).val(),
            coords  : window[this.widgetid + "_map_coords"]};
};

YandexMapsWidget.prototype.validate = function()
{
    return true;
};
