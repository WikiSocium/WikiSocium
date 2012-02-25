function CaseDataController(solutionData) 
{
	this.solutionData = solutionData;

	this.GetStepIndexById = function(step_id) {
		for (var i = 0; i < this.solutionData.steps.length; i ++) {
			if (this.solutionData.steps[i].id == step_id) {
				return i;
			}
		}
		return -1;
	}

	this.GetWidgetData = function(step_index, widget_id) {
		var step = this.solutionData.steps[step_index];
		for (var i = 0; i < step.widgets.length; i ++) {
			if (step.widgets[i].id == widget_id) {
				return step.widgets[i];
			}
		}
		return undefined;
	}

	this.GetNumberOfSteps = function() {
		return this.solutionData.steps.length;
	}

	this.GetStepNextInfo = function(step_index) {
		if (step_index < this.solutionData.steps.length) {
			return this.solutionData.steps[step_index].next;
		}
		else {
			return undefined;
		}
	}

	this.ChangeVisibility = function(step_index, widget_id, value) {
		var widget_data = this.GetWidgetData(step_index, widget_id);
        for (var i = 0; i < widget_data.change_visibility.length; i ++) {
			if (widget_data.change_visibility[i].value == value) {
				return widget_data.change_visibility[i].change;
			}
		}
		return [];
	}
}
