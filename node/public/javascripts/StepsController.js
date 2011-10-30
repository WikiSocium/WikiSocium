//
// [TODO] Это все надо оформить в виде объекта StepsController, чтобы методы не "висели" в воздухе
//

// [TODO] Этой переменной не будет, вместо нее будет обращение к динамическому объекту, синхронизирующемуся с серверу
var temporaryCurrentStep = 0;    

function ShowPoperStep()
{
    $(".step").addClass("isInvisible");
    $("#"+"step_"+temporaryCurrentStep).toggleClass("isInvisible");
}

// Обработчик нажатия кнопки следующего шага
function NextStep()
{
    temporaryCurrentStep = requestedCaseController.GetNextStepForStep(temporaryCurrentStep);
    ShowPoperStep();
}

$(document).ready(function(){
    // Все шаги сейчас скрыты, нужно показать выбранный
    ShowPoperStep();    
});