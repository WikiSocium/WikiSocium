function DataFieldController () {
}

DataFieldController.prototype.InitValue = function () {
	var id = $(this).parent().attr("id");
	var value = localStorage.getItem(id);
	if (value) {
		$(this).attr("value", value);
		$(this).data("my_value", value);
	}
	else {
		$(this).attr("value", 0);
		$(this).data("my_value", 0);
	}
	return this;
}

DataFieldController.prototype.UpdateValue = function () {
	localStorage.setItem($(this).parent().attr("id"), $(this).val());
	$(this).data("my_value", $(this).val());
	return this;
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
	
SelectListController.prototype.InitValue = function() {
	var id = $(this).parent().attr("id");
	var value = localStorage.getItem(id);
	if (value) {
		$(this).attr("value", value);
		$(this).data("my_value", value);
	}
	else {
		$(this).data("my_value", $(this).val());
	}
}

SelectListController.prototype.InitFields = function () {
	DataFieldController.prototype.InitFields.call(this,  $(".infoListWidgetList"), 
												DataFieldController.prototype.UpdateValue, 
												SelectListController.prototype.InitValue);
}

SelectListController.prototype.ShowInfo = function(step_id, widget_id) {
	alert(step_id);
	alert(widget_id);
	alert($("#step_" + step_id + "_widget_" + widget_id).children(".infoListWidgetList").data("my_value"));
}
