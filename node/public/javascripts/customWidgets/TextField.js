function TextField(regexp, element, parentEl, value)
{ 
  this.element = element;
  this.parentEl = parentEl;
  this.regexp = regexp;
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };

  $(this.element).val(decodeURIComponent(value));

  // Страшная по синтаксису валидация через valid8 с помощью javascript-функции
  $(this.element).valid8(
    {
      'jsFunctions':
      [
        {
          function: function(values)
          {
            var regexp = this.values[0]; // рег. выражение
            var value = values; // значение
            var res = true;
            if(regexp != undefined)
              res = regexp.test(value);

            if(res || value == undefined || value == '') // пустые строки игнорируются
              return {valid:true}
            else 
              return {valid:false, message:'Поле заполнено неверно!'} // текст, выводящийся при ошибке
          },
          values:
          [ 
            regexp,
            function()
            {
              return $(this).val();
            }
          ]
        }
      ]
    }
  );
};

TextField.prototype.getValue = function()
{
  return $(this.element).val();
};

TextField.prototype.validate = function()
{
  var val = $(this.element).val();
  var res = this.regexp.test(val) || val == '';
  if(!res) {
    $(this.parentEl).children(".control-group").addClass("error");
  }
  return res;
};