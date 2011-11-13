// [TODO] Сделать наследование от базового класса

var requestedCaseController = 
{
    GetNextStepForStep: function(currentStep)
    {
        if(parseInt(currentStep) >= 1)
            return currentStep;
        else            
            return (parseInt(currentStep) + 1);
    }
}
