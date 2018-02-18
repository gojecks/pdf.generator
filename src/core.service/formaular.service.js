
	//pdf Formular handler
	function formularHandler() {
		var _formularHolder = {};

		var handlers = function (name) {
			if (!_formularHolder[name]) {
				_formularHolder[name] = {};
			}

			this.add = function (ref, fn) {
				_formularHolder[name][ref] = fn;
				return this;
			};
			//add the init to the formularHolder
			this._init = function () {
				var ret = {};

				if (!_formularHolder[name]['$$initialized']) {
					for (var prop in _formularHolder[name]) {
						ret[prop] = _formularHolder[name][prop].apply(_formularHolder[name][prop], arguments);
					}
					_formularHolder[name]['$$initialized'] = ret;
					ret = null;
				}

				return _formularHolder[name]['$$initialized'];
			};

			this.removeCache = function () {
				delete _formularHolder[name]['$$initialized'];
				return this;
			}

			this._waitAll = function () {

			};


			return this;
		};

		return handlers;
	};

	pdfTemplateMakerService.prototype.formular = new formularHandler;