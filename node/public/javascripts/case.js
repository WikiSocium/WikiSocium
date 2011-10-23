function text(text)
{
    alert("test");
    alert(text);
}

function RenderStep(selectedCase)
{
    partial('step', {
            step: selectedCase.steps[selectedCase.currentStep]
        });
}