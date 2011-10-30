// [TODO] Сделать наследование от базового класса

var requestedCaseController = 
{
    GetNextStepForStep: function(currentStep)
    {
        if(parseInt(currentStep) == 2)
            return 0;
        else            
            return (parseInt(currentStep) + 1);
    }
}