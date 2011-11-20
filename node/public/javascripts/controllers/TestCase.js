// [TODO] Сделать наследование от базового класса

var requestedCaseController = 
{
	NSTEPS: 2,

    GetNextStepForStep: function(currentStep)
    {
        if(parseInt(currentStep) >= 1)
            return currentStep;
        else            
            return (parseInt(currentStep) + 1);
    }
}
