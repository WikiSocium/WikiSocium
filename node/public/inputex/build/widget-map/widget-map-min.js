/**
 * @module inputex-map
 */
YUI.add("widget-map",function(Y){
	
   var lang = Y.Lang,
       inputEx = Y.inputEx;

/*Определяем какие-то глобальные параметры для виждета*/
	inputEx.WSMapFieldGlobals = {
		lat : 43.648565,
		lon : -79.385329,
		uzoom : -13,
		api : 'yandex',
		api_key : ''
	};

/*Параметры положения для каждого типа карт*/
	inputEx.WSMapFieldZoom = {
		google : {
			to_universal : function(orig) {
				orig = parseInt(orig);
				return	Math.min(-1, -orig);
			},

			to_native : function(universal) {
				universal = parseInt(universal);
				return	universal > 0 ? universal : -universal;
			}
		},

		yandex : {
			to_universal : function(orig) {
				orig = parseInt(orig);
				return	Math.min(-1, -orig);
			},

			to_native : function(universal) {
				universal = parseInt(universal);
				return	universal > 0 ? universal : -universal;
			}
		}
	};

/**
 * Wrapper for Mapping APIs, including Google Maps, Yandex Maps
 * @class inputEx.WSMapField
 * @extends inputEx.Field
 * @constructor
 * @param {Object} options Added options:
 * <ul>
 *    <li>width</li>
 *    <li>height</li>
 *    <li>loading</li>
 *    <li>lat</li>
 *    <li>lon</li>
 *    <li>uzoom</li>
 *    <li>api: google, yahoo or virtualearth (default)</li>
 *    <li>api_key</li>
 * </ul>
 */
inputEx.WSMapField = function(options) {
	inputEx.WSMapField.superclass.constructor.call(this,options);
};

Y.extend(inputEx.WSMapField, inputEx.Field, {
	/**
	 * Определяем параметры и функцию для их изменения
	 */
	setOptions: function(options) { 
		inputEx.WSMapField.superclass.setOptions.call(this, options);
		//CSS класс
		this.options.className = options.className || 'inputEx-Field inputEx-MapField'; 
		
		this.options.width = options.width || '400px';
		this.options.height = options.height || '400px';
		this.options.loading = options.loading || 'Загрузка карты....';

		this.options.lat = options.lat || inputEx.WSMapFieldGlobals.lat;
		this.options.lon = options.lon || inputEx.WSMapFieldGlobals.lon;
		this.options.uzoom = options.uzoom || inputEx.WSMapFieldGlobals.uzoom;
		//Пока что используем только API Яндекса
		this.options.api = 'yandex'; //options.api || inputEx.WSMapFieldGlobals.api;
		this.options.api_key = options.api_key || inputEx.WSMapFieldGlobals.api_key;
	},

	/**
	 * Здесь определяем отображение карты
	 */
	renderComponent: function() {
		if(inputEx.WSMapFieldsNumber == undefined) { inputEx.WSMapFieldsNumber = -1; }
		inputEx.WSMapFieldsNumber += 1;

        //Установка API
		this.apid = this.yandex;
		if (this.options.api == "yandex") {
			this.apid = this.yandex;
		} else if (this.options.api == "google") {
			this.apid = this.google;
		} else {
			alert("unknown API '" + this.options.api + "': using 'virtualearth'");
		}

        //Какие-то css айдишники
		var id = "inputEx-MapField-"+inputEx.WSMapFieldsNumber;
		var idWrapper = "inputEx-MapFieldWrapper-"+inputEx.WSMapFieldsNumber;
		var idLat = "inputEx-MapFieldLat-"+inputEx.WSMapFieldsNumber;
		var idLon = "inputEx-MapFieldLon-"+inputEx.WSMapFieldsNumber;
		var idUZoom = "inputEx-MapFieldUZoom-"+inputEx.WSMapFieldsNumber;
		var idNZoom = "inputEx-MapFieldNZoom-"+inputEx.WSMapFieldsNumber;

        //Формируем DOM
		this.el = inputEx.cn('div',
			{ id: id, style: "position: relative; width: " + this.options.width + "; height: " + this.options.height },
			null,
			this.options.loading
		);
		this.fieldContainer.appendChild(this.el);

        this.elLat = 37.64;
        this.elLon = 55.76;
        //Зачем эти скрытые поля ???
		/*this.elLat = inputEx.cn('input', { id: idLat, type: "hidden", value: this.options.lat });
		this.fieldContainer.appendChild(this.elLat);

		this.elLon = inputEx.cn('input', { id: idLon, type: "hidden", value: this.options.lon });
		this.fieldContainer.appendChild(this.elLon);

		this.elUZoom = inputEx.cn('input', { id: idUZoom, type: "hidden", value: this.options.uzoom });
		this.fieldContainer.appendChild(this.elUZoom);

		this.elNZoom = inputEx.cn('input', { id: idNZoom, type: "hidden", value: this.options.uzoom });
		this.fieldContainer.appendChild(this.elNZoom);*/

        //Инициализация карт
        this.wait_create();
		/*if (this.apid.preload(this)) {
		    this.wait_create();
			return;
		} else {
			this.wait_create();
		}*/
	},

	/**
	 * Устанавливаем значения (например: {lat: 45.23234, lon: 2.34456, uzoom: 6, nzoom: 6} )
	 */
	setValue: function(value) {
		var any = false;

		if (value.uzoom != undefined) {
			this.elUZoom.value = value.uzoom;
			any = true;
		} else if (value.nzoom != undefined) {
			this.elUZoom.value = this.apid.f_zoom.to_universal(value.uzoom);
			any = true;
		}

		if (value.lat != undefined) {
			this.elLat = value.lat;
			any = true;
		}

		if (value.lon != undefined) {
			this.elLon = value.lon;
			any = true;
		}

		if (any) {
			this.apid.onposition();
		}
	},

	/**
	 * Получаем значение виждета (положение и зум)
	 */
	getValue: function() {
		if (!this.elLat) return {};
		return {
			lat : this.apid.lat,//parseFloat(this.elLat),
			lon : this.apid.lng,//parseFloat(this.elLon),
			addr : "Moscow"
		};
	},

	/**
	 *	Ожидание загрузки карт
	 */
	wait_create : function(_this) {
		if (this == window) {
			_this.wait_create(_this);
			return;
		}

		if (document.getElementById(this.el.id)) {
			this.apid.create(this);
		} else {
			window.setTimeout(this.wait_create, 0.1, this);
		}
	},
	
	//Определяем функционал разных API
	
	//YANDEX
	yandex : {
		YaMap : null, //Объект карты
		f_zoom : inputEx.WSMapFieldZoom.yandex,
        lat : 0,
        lng : 0,
        
		/**
		 *
		 *  Загрузка API, если она не была сделана явно до этого (нужно ли?)
		 */
		 
		preload : function(superwrapper) {
			/*if (window.YMaps) {
				return;
			}

			var preloader = 'MapYandexPreloader_' + inputEx.WSMapFieldsNumber;
			inputEx[preloader] = function() {
				/*google.load("maps", "2", {
					"callback" : function() {
						superwrapper.wait_create();
					}
				});*/
			/*};

			if (window.google) {
				inputEx[preloader]();
			} else {
				var script = document.createElement("script");
				script.src = "http://api-maps.yandex.ru/1.1/index.xml?key=AEj3nE4BAAAAlWMwGwMAbLopO3UdRU2ufqldes10xobv1BIAAAAAAAAAAADoRl8HuzKNLQlyCNYX1_AY_DTomw==";
				script.type = "text/javascript";

				document.getElementsByTagName("head")[0].appendChild(script);
			}*/

			return true;
		},

		create : function(superwrapper) {
		    YaMap = new YMaps.Map(superwrapper.el);
            YaMap.setCenter(new YMaps.GeoPoint(37.64, 55.76), 10);
			YaMap.addControl(new YMaps.TypeControl());
			YaMap.addControl(new YMaps.ToolBar());
			YaMap.addControl(new YMaps.Zoom());
			YaMap.addControl(new YMaps.MiniMap());
			YaMap.addControl(new YMaps.ScaleLine());
			YaMap.enableScrollZoom();
			/*var template = new YMaps.Template(
				"<b><span style=\"color:red\">Я</span> - $[name|объект]</b>	<div>$[description|Информация недоступна]</div>");
			var s = new YMaps.Style();
			s.balloonContentStyle = new YMaps.BalloonContentStyle(template);*/
			this.placemarks = null;
			var myEventListener = YMaps.Events.observe(YaMap, YaMap.Events.Click
			    , function (YaMap, mEvent) 
			    {
                            YaMap.removeOverlay(placemarks);
							this.placemarks = new YMaps.Placemark(mEvent.getGeoPoint(), {/*style: s,*/ draggable: true});
                            this.lat = mEvent.getGeoPoint().getLat();
                            YaMap.addOverlay(placemarks);
				}, this);
		
		
		},

		onposition : function() {
			/*try {
				var c = this.getCenter();
				this._WSMapField.elLat.value = c.lat();
				this._WSMapField.elLon.value = c.lng();

				var z = this.getZoom();
				this._WSMapField.elNZoom.value = z;
				this._WSMapField.elUZoom.value = inputEx.WSMapFieldZoom.google.to_universal(z);
			} catch (x) {
				//alert(x);
			}*/
		}
	},

    //GOOGLE
	google : {
		g_map : null,
		f_zoom : inputEx.WSMapFieldZoom.google,


		/**
		 *	If the Google Maps API has not been explicitly loaded, this will go get
		 *	it on the user's behalf. They must have set 'api_key' to be either the API Key
		 *	for this host, or a dictionary of { window.location.hostname : api_key }.
		 *
		 *	See: http://code.google.com/apis/ajax/documentation/#Dynamic
		 */
		preload : function(superwrapper) {
			if (window.GMap2) {
				return;
			}

			var preloader = 'MapGooglePreloader_' + inputEx.WSMapFieldsNumber;
			inputEx[preloader] = function() {
				/*google.load("maps", "2", {
					"callback" : function() {
						superwrapper.wait_create();
					}
				});*/
			};

			if (window.google) {
				inputEx[preloader]();
			} else {
				var script = document.createElement("script");
				script.src = "http://maps.googleapis.com/maps/api/js?sensor=false&callback=Y.inputEx." + preloader;
				script.type = "text/javascript";

				document.getElementsByTagName("head")[0].appendChild(script);
			}

			return	true;
		},

		create : function(superwrapper) {
			this.g_map = new GMap2(superwrapper.el);
			this.g_map._MapField = superwrapper;

			this.g_geocoder = new GClientGeocoder();
			this.g_geocoder.setBaseCountryCode("ca");

			GEvent.addListener(this.g_map, "load", this.onposition);
			GEvent.addListener(this.g_map, "moveend", this.onposition);
			GEvent.addListener(this.g_map, "zoomend", this.onposition);

			this.g_map.addControl(new GSmallMapControl());
			this.g_map.addControl(new GMapTypeControl());

			this.g_map.setCenter(
				new GLatLng(parseFloat(superwrapper.elLat.value), parseFloat(superwrapper.elLon.value)),
				inputEx.WSMapFieldZoom.google.to_native(superwrapper.elUZoom.value)
			);
		},

		onposition : function() {
			try {
				var c = this.getCenter();
				this._MapField.elLat.value = c.lat();
				this._MapField.elLon.value = c.lng();

				var z = this.getZoom();
				this._MapField.elNZoom.value = z;
				this._MapField.elUZoom.value = inputEx.WSMapFieldZoom.google.to_universal(z);
			} catch (x) {
				//alert(x);
			}
		}
	},

	end : 0
});

// Регистрируем наш тип
inputEx.registerType("WSMaps", inputEx.WSMapField);

},'3.0.0a',{
  requires: ['inputex-field']
});
