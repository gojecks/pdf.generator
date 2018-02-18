	//set the definition handler
	pdfTemplateMakerService.prototype.generatePdf = function() {
	    var arg = arguments;
	    this.pdfTemplateObj.events.subscribe('pdf.ready.to.build', function(_definition) {
	        var _pdf = pdfMake.createPdf(_definition);
	        _pdf.getDataUrl.apply(_pdf, arg);
	    });
	};