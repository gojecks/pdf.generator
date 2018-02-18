	//Error trigger
	pdfTemplateMakerService.prototype.triggerError = function (type, data) {
		var self = this;
		return function () {
			self.pdfTemplateObj.events.broadcast(type, data);
		}
	};