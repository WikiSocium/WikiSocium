// [TODO] Сделать наследование от базового класса

var requestedCaseController = 
{
    GetNextStepForStep: function(currentStep)
    {
        return (parseInt(currentStep) + 1);
    }
}