function MapsWidget(lat, lng, address, parentEl, errorEl)
{  
  this.mapObj = new YMaps.Map(parentEl);
  this.lat = lat;
  this.lng = lng;
  this.address = address;
  this.errorEl = errorEl;
  this.Init = function()
  {
    this.mapObj.setCenter(new YMaps.GeoPoint(this.lng, this.lat), 10);
    this.geoResult = new YMaps.Placemark(new YMaps.GeoPoint(this.lng, this.lat), {draggable: false});
    this.mapObj.addOverlay(this.geoResult);
    this.mapObj.addControl(new YMaps.TypeControl());
    this.mapObj.addControl(new YMaps.ToolBar());
    this.mapObj.addControl(new YMaps.Zoom());
    this.mapObj.addControl(new YMaps.MiniMap());
    this.mapObj.addControl(new YMaps.ScaleLine());
    this.mapObj.enableScrollZoom();
  };
};

MapsWidget.prototype.getValue = function()
{
  var res = new Object();
  res.lat = this.lat;
  res.lng = this.lng;
  res.address = this.address;
  return res;
};

MapsWidget.prototype.InitMarkerCallback = function(func)
{
  var that = this;
  var myEventListener = YMaps.Events.observe(this.mapObj, this.mapObj.Events.Click
  , function (map, mEvent)
  {
      map.removeOverlay(that.geoResult);
      that.geoResult = new YMaps.Placemark(mEvent.getGeoPoint(), {draggable: false});
      that.lat = mEvent.getGeoPoint().getLat();
      that.lng = mEvent.getGeoPoint().getLng();
      map.addOverlay(that.geoResult);
  }, this);
};

MapsWidget.prototype.validate = function() {return true;};
MapsWidget.prototype.FindPlace = function(addr)
{
  this.address = addr;
  var geocoder = new YMaps.Geocoder(addr, {results: 1, boundedBy: this.mapObj.getBounds()});
  var that = this;
  // Создание обработчика для успешного завершения геокодирования
  YMaps.Events.observe(geocoder, geocoder.Events.Load, 
    function (){
      // Если объект был найден, то добавляем его на карту
      // и центрируем карту по области обзора найденного объекта
      if (this.length())
      {
          that.mapObj.removeOverlay(that.geoResult);
          that.geoResult = this.get(0);
          that.lat = that.geoResult.getGeoPoint().getLat();
          that.lng = that.geoResult.getGeoPoint().getLng();
          that.mapObj.addOverlay(that.geoResult);
          that.mapObj.setBounds(that.geoResult.getBounds());
      }
      else 
      {
        that.errorEl.innerText = "Ничего не найдено!";
      }
  });

  // Процесс геокодирования завершен неудачно
  YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (geocoder, error) {
      that.errorEl.innerText = "Произошла ошибка: " + error;
  })
};

MapsWidget.prototype.FindAddress = function(lat, lng)
{
  var geocoder = new YMaps.Geocoder(new YMaps.GeoPoint(lng, lat), {results: 1, boundedBy: this.mapObj.getBounds(), strictBounds: 1, kind: 'house'});
  var that = this;
  // Создание обработчика для успешного завершения геокодирования
  YMaps.Events.observe(geocoder, geocoder.Events.Load, 
    function (){
      // Если объект был найден, то добавляем его на карту
      // и центрируем карту по области обзора найденного объекта
      if (this.length())
      {
          geoResult = this.get(0);
          that.mapObj.addOverlay(geoResult);
          that.mapObj.setBounds(geoResult.getBounds());
      }
      else {alert("Ничего не найдено");} //TODO Изменить на другой тип оповещения TODO
  });

  // Процесс геокодирования завершен неудачно
  YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (geocoder, error) {
      alert("Произошла ошибка: " + error); //TODO Изменить на другой тип оповещения TODO
  })
};