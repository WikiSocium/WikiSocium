function MapsWidget(lat, lng, parentEl)
{  
  this.YaMap = new YMaps.Map(parentEl);
  this.lat = lat;
  this.lng = lng;
  this.Init = function()
  {
    this.YaMap.setCenter(new YMaps.GeoPoint(this.lat, this.lng), 10);
    this.YaMap.addControl(new YMaps.TypeControl());
    this.YaMap.addControl(new YMaps.ToolBar());
    this.YaMap.addControl(new YMaps.Zoom());
    this.YaMap.addControl(new YMaps.MiniMap());
    this.YaMap.addControl(new YMaps.ScaleLine());
    this.YaMap.enableScrollZoom();
  };
};

MapsWidget.prototype.GetValue = function()
{
  var res;
  res.lat = MapsWidget.prototype.lat;
  res.lng = MapsWidget.prototype.lng;
  res.addr = "Moscow";
  return res;
};

MapsWidget.prototype.validate = function() {return true;};
MapsWidget.prototype.FindPlace = function(addr)
{
  var geocoder = new YMaps.Geocoder(addr, {results: 1, boundedBy: YaMap.getBounds()});

  // Создание обработчика для успешного завершения геокодирования
  YMaps.Events.observe(geocoder, geocoder.Events.Load, 
    function (){
      // Если объект был найден, то добавляем его на карту
      // и центрируем карту по области обзора найденного объекта
      if (this.length())
      {
          geoResult = this.get(0);
          MapsWidget.prototype.YaMap.addOverlay(geoResult);
          MapsWidget.prototype.YaMap.setBounds(geoResult.getBounds());
      }
      else {alert("Ничего не найдено");}
  });

  // Процесс геокодирования завершен неудачно
  YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (geocoder, error) {
      alert("Произошла ошибка: " + error);
  })
};