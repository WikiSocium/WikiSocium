// Типа конструктор.
function MultimediaWidget(value) {
  this.options = {};
  this.setOptions = function(param) {
      this.options = param;
      this.IsRequired = param.required;
  };
  if (typeof(value) == "undefined") {
    this.multimediaPathList = [];
  } else {
    this.multimediaPathList = value;
  }
};

MultimediaWidget.prototype.addValue = function(value) {
  var index = this.multimediaPathList.indexOf(value);
  if(index == -1) {
    this.multimediaPathList.push(value);
  }
  return this.multimediaPathList.indexOf(value);
};

MultimediaWidget.prototype.removeValue = function(value) {
  index = -1;
  for (key in this.multimediaPathList) {
    if ( this.multimediaPathList[key].thumbnail == value ) {
     index = key;
     break;
    }
  }
  var removedValue = this.multimediaPathList[index];
  if(index != -1) {
    this.multimediaPathList.splice(index,1);
  }
  return removedValue;
};

// Получение значения виджета.
MultimediaWidget.prototype.getValue = function() {
  return this.multimediaPathList;
};

MultimediaWidget.prototype.validate = function() {
  return true;
};