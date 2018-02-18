
	//Initialize the Fn
	pdfTemplateMakerService.prototype.build = function () {
		//onSuccess of Initializer
		var self = this;
		function initializeConfig(config) {
			self.pdfTemplateObj.events.broadcast('build.template', [config])
		};

		this.pdfTemplateObj.initialize(this.getFilePath('config.json'), {
			success: initializeConfig,
			error: self.triggerError('TemplateError', ['Failed to load Configuration Template'])
		});

		return this;
	};