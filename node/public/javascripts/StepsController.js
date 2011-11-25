//
// [TODO] Это все надо оформить в виде объекта StepsController, чтобы методы не "висели" в воздухе
//
YUI_config.groups.inputex.base = '../../inputex/build/';

// [TODO] Этой переменной не будет, вместо нее будет обращение к динамическому объекту, синхронизирующемуся с серверу
var temporaryCurrentStep = 0;
var groups = []; //Список групп полей (шагов) для формы (из них будем вытягивать данные)

function ShowPoperStep()
{
    if(temporaryCurrentStep <= 10)
    {
      $(".step").addClass("isInvisible");
      $("#"+"step_"+temporaryCurrentStep).toggleClass("isInvisible");
      if(temporaryCurrentStep == 10) temporaryCurrentStep = temporaryCurrentStep + 1;
    }
    
    if(temporaryCurrentStep >= 10) //Последний шаг
    {
      YUI().use('inputex', 'inputex-button', 'inputex-group', 'json-stringify', function(Y) {
         var destroyButton = new Y.inputEx.widget.Button({
         parentEl: 'stepsWrapper',
         id: 'submitForm',
         type: 'submit',
         value: 'Submit the form',
         onClick: function(){
            SaveFormData();
            }
         });
      });
    }
    
    //Набросок альтернативного варианта показа шагов (с багами, надо дописывать)
    /*YUI().use('inputex-string', 'inputex-form', 'inputex-datepicker', 'inputex-timeinterval', 'inputex-group', function(Y) {
      if(temporaryCurrentStep > 0)
      {
        groups[temporaryCurrentStep - 1].hide();
        groups[temporaryCurrentStep].show();
      }
    });*/
}

function SaveFormData()
{
    var formData = CollectFormData();
            
    $.ajax({
        url: window.location.pathname + '/submitForm'
        , type:'POST'
        , data:'step=' + temporaryCurrentStep + '&jsonData=' + $.toJSON(formData)
        , success: function(res) {}
    });    
}

function CollectFormData()
{
    var data = new Array();
    YUI().use('inputex', 'inputex-group', function(Y) 
    {
        for(var i = 0 ; i < groups.length ; i++)
        {
            data[i] = groups[i].getValue();
        }
    });
    return data;
}

// Обработчик нажатия кнопки следующего шага
function CheckPredicate(predicate, step_id) {
		if (predicate == "true") {
			return true;
		}

		var value = CollectFormData();
				
		return eval(value[step_id][predicate.widget_id] + predicate.cond + predicate.value);
	}

function NextStep() {
		SaveFormData();
		var nextInfo = caseJson.steps[temporaryCurrentStep].next;
		var check = false;
		for (i in nextInfo) {
			for (j in nextInfo[i].predicates) {
				var step_id = 0;
				for (step_id = 0; step_id < caseJson.steps.length; step_id ++)
				{
					if (caseJson.steps[step_id].id == nextInfo[i].predicates[j].step_id) break;
				}
				check = this.CheckPredicate(nextInfo[i].predicates[j], step_id);
				if (check == false) {
					break;
				}
			}
			if (check == true) {
				var next_step_id = 0;
				for (next_step_id = 0; next_step_id < caseJson.steps.length; next_step_id ++)
				{
					if (caseJson.steps[next_step_id].id == nextInfo[i].id) break;
				}
				temporaryCurrentStep = next_step_id;
				break;
			}
		}
		if (check != true) {
			temporaryCurrentStep += 1;
		}
		ShowPoperStep();
	}
$(document).ready(function(){
    // Все шаги сейчас скрыты, нужно показать выбранный
	if (temporaryCurrentStep==undefined) temporaryCurrentStep=0;
    ShowPoperStep();    
});

