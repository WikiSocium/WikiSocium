function CaseDataController(caseInfo) 
{
	this.caseInfo = caseInfo;

	this.GetStepIndexById = function(step_id) {
		for (var i = 0; i < this.caseInfo.steps.length; i ++) {
			if (this.caseInfo.steps[i].id == step_id) {
				return i;
			}
		}
		return -1;
	}

	this.GetWidgetData = function(step_index, widget_id) {
		var step = this.caseInfo.steps[step_index];
		for (var i = 0; i < step.widgets.length; i ++) {
			if (step.widgets[i].id == widget_id) {
				return step.widgets[i];
			}
		}
		return undefined;
	}

	this.GetNumberOfSteps = function() {
		return this.caseInfo.steps.length;
	}

	this.GetStepNextInfo = function(step_index) {
		if (step_index < this.caseInfo.steps.length) {
			return this.caseInfo.steps[step_index].next;
		}
		else {
			return undefined;
		}
	}
}
