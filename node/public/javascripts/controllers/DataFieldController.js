function DataFieldController () {
}

DataFieldController.prototype.InitValue = function () {
	var baseWidget = $(this).parent();
	var id = baseWidget.attr("id");
	var value = localStorage.getItem(id);
	if (value) {
		$(this).attr("value", value);
		baseWidget.data("my_value", value);
	}
}

DataFieldController.prototype.UpdateValue = function () {
	var baseWidget = $(this).parent();
	localStorage.setItem(baseWidget.attr("id"), $(this).val());
	baseWidget.data("my_value", $(this).val());
}

DataFieldController.prototype.InitFields = function (collection, updateFn, initFn) {
	collection.each(function() {
		$(this).bind("change", $.proxy($(this),updateFn));
		$(this).bind("customInit", $.proxy($(this), initFn));
	})
	collection.trigger("customInit");
}

TextFieldController.prototype = new DataFieldController();
TextFieldController.prototype.constructor = TextFieldController;

function TextFieldController () {
}
	
TextFieldController.prototype.InitFields = function () {
	DataFieldController.prototype.InitFields.call(this, $(".textFieldWidgetInput"), 
												DataFieldController.prototype.UpdateValue, 
												DataFieldController.prototype.InitValue);
}

SelectListController.prototype = new DataFieldController();
SelectListController.prototype.constructor = SelectListController;

function SelectListController() {
}
	

SelectListController.prototype.InitFields = function () {
	DataFieldController.prototype.InitFields.call(this,  $(".infoListWidgetList"), 
												DataFieldController.prototype.UpdateValue, 
												DataFieldController.prototype.InitValue);
}

SelectListController.prototype.ShowInfo = function(step_id, widget_id) {
	alert($("#step_" + step_id + "_widget_" + widget_id).data("my_value"));
}

RadioGroupController.prototype = new DataFieldController();
RadioGroupController.prototype.constructor = RadioGroupController;

function RadioGroupController() {
}

RadioGroupController.prototype.InitValue = function() {
	var baseWidget = $(this).parent();
	var id = baseWidget.attr("id");
	var value = localStorage.getItem(id);
	$(this).attr("checked", false);
	if ($(this).val() == value) {
		$(this).attr("checked", true);
		baseWidget.data("my_value", value);
	}
}

RadioGroupController.prototype.UpdateValue = function() {
	if ($(this).attr("checked") == true) {
		$(this).parent().data("my_value", $(this).val());
		localStorage.setItem($(this).parent().attr("id"), $(this).val());
		$(this).siblings().attr("checked", false);
	}
}

RadioGroupController.prototype.InitFields = function () {
	DataFieldController.prototype.InitFields.call(this,  $(".radioGroupWidgetButton"), 
												RadioGroupController.prototype.UpdateValue, 
												RadioGroupController.prototype.InitValue);
}
