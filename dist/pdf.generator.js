	/**
	 * PDFTemplateMaker
	 * created by Gojecks Karl
	 * v 0.0.1
	 */

	function pdfTemplateMaker() {
	    //Event Handlers
	    this.handlers = {};
	    this.matchers = [];
	    this.events = {};
	    this.ignoreReplacer = ['layout', 'heights'];

	    var _events = {},
	        _queue = [];
	    //goto next events
	    this.events.broadcast = function(name, arg) {
	        var nextFn = _events[name] || function() {};
	        nextFn.apply(nextFn, arg);
	    };

	    this.events.subscribe = function(name, fn) {
	        _events[name] = fn;
	        return this;
	    };

	    /**
	     * pdf Helpers
	     */
	    var _helpers = {
	            regEx: /\((.*?)\)+/g
	        },
	        _processHelpers = {};

	    this.helpers = {
	        add: function(name, fn) {
	            _helpers[name] = fn;

	            return this;
	        },
	        get: function(name) {
	            return _helpers[name] || function(a) { return a; }
	        },
	        hasProcess: function(name) {
	            return _processHelpers.hasOwnProperty(name);
	        },
	        getProcessHelper: function(name) {
	            return _processHelpers[name];
	        },
	        processHelperText: function(item, match) {
	            match = match || item.processProp;
	            if (item.processHelpers && item.hasOwnProperty(match)) {
	                if (this.hasProcess(match)) {
	                    this.getProcessHelper(match)(item, item.processHelpers);
	                }
	                delete item.processHelpers;
	                delete item.processMatch;
	            }
	        }
	    };

	    this.buildHelpers = function() {
	        var self = this;
	        /**
	         * 
	         * @param {*} helper 
	         * @param {*} _item 
	         */
	        function coreHelper(helpers, _item) {
	            helpers.forEach(function(helper) {
	                var _helper = self.helpers.get(helper);
	                if (typeof _item === 'object') {
	                    if (Array.isArray(_item)) {
	                        _item = _item.map(function(citem) {
	                            return _helper(citem)
	                        });
	                    } else {
	                        self.matchers.forEach(function(match) {
	                            if (_processHelpers[match] && _item[match])
	                                _processHelpers[match](_item, helpers);
	                        });
	                    }

	                } else {
	                    _item = _helper(_item);
	                }
	            });

	            return _item;
	        }

	        _processHelpers.text = function(citem, helpers) {
	            if (typeof citem.text === 'object') {
	                citem.text = citem.text.map(function(_item) {
	                    return coreHelper(helpers, _item);
	                });
	            } else {
	                citem.text = coreHelper(helpers, citem.text);
	            }
	        };

	        /**
	         * register Arraylike types
	         */
	        ["columns", "stack", "ul", "ol"].forEach(function(type) {
	            if (!_processHelpers[type]) {
	                _processHelpers[type] = arrayLikeHelpers(type);
	            }
	        });

	        function arrayLikeHelpers(type) {
	            return function(item, helpers) {
	                processBody(helpers)(item[type]);
	            }
	        };

	        function processBody(helpers) {
	            return function(definition) {
	                definition.forEach(function(_cont, idx) {
	                    if (typeof _cont === 'object') {
	                        self.matchers.forEach(function(match) {
	                            if (_processHelpers[match] && _cont[match])
	                                _processHelpers[match](_cont, helpers);
	                        });
	                    } else {
	                        definition[idx] = { text: coreHelper(helpers, _cont) };
	                    }
	                });
	            }
	        }

	        _processHelpers.table = function(item, helpers) {
	            item.table.body.forEach(processBody(helpers));
	        }
	    }

	    this.buildHelpers();

	    /**
	     * 
	     * @param {*} definition 
	     */
	    this.__layout = function(definition) {
	        if (definition.isProcessed) {
	            return definition;
	        }

	        var _public = {
	            isProcessed: true
	        };
	        Object.keys(definition).forEach(function(key) {
	            _public[key] = get(key);
	        });

	        /**
	         * 
	         * @param {*} name 
	         */
	        function get(name) {
	            return function(node, i) {
	                return definition[name];
	            }
	        }

	        return _public;
	    };

	    //generate a prototype queue
	    this.events.stack = function(name) {
	        var _queues = [];

	        var queue = function(fn) {
	                _queues.push(fn);
	                return this;
	            },
	            executeQueue = function() {
	                var nextFn = _queues.shift() || function() {};
	                nextFn.apply(nextFn, arguments);
	                return this;
	            };

	        this[name] = {
	            push: queue,
	            pop: executeQueue
	        };

	        return this;
	    };

	    new this.events.stack('queue');

	    this.events.bind = function(fn, arg) {
	        return function() {
	            fn.apply(fn, arg || []);
	        }
	    };

	    var _matcher_ = [];
	    /**
	     * Template Matcher
	     */
	    this.templateMatcher = {
	        set: _matcher_.push,
	        remove: function(val) {
	            _matcher_.splice(_matcher_.indexOf(val), 1);
	            return this;
	        },
	        default: function(arr) {
	            _matcher_ = arr;
	        },
	        get: function() {
	            return _matcher_;
	        }
	    };
	}

	/*
		Template Loader
		Load templates using XMLHTTPREQUEST()
		Method Accepts : STRING , options
	*/

	pdfTemplateMaker.prototype.loadTemplate = function(filePath, options) {
	    if (filePath) {
	        var rawFile = new XMLHttpRequest(),
	            self = this;
	        rawFile.open("GET", filePath, false);
	        rawFile.onreadystatechange = function() {
	                if (rawFile.readyState === 4) {
	                    if (rawFile.status === 200 || rawFile.status == 0) {
	                        var allText = rawFile.responseText,
	                            template,
	                            callbackType = 'success';
	                        try {
	                            template = JSON.parse(allText);
	                        } catch (e) {
	                            throw new Error("Inavlid Json file received");
	                            callbackType = 'error';
	                        } finally {
	                            if (template) {
	                                (options[callbackType] || function() {})(template);
	                            }
	                        }
	                    }

	                    if (rawFile.status === 404) {
	                        (options['error'] || function() {})('file not found');
	                    }
	                }
	            }
	            //send the request
	        rawFile.send(null);
	    }
	};

	/*
		pdfTemplateMaker Events Handler
		Handlers are declared in the template data
		
	*/

	pdfTemplateMaker.prototype.setHandlers = function(name, fn) {
	    this.handlers[name] = fn;

	    return this;
	};

	/*
		pdfTemplateMaker Events getter
		@returns Function OR Undefined
	*/

	pdfTemplateMaker.prototype.hasHandlers = function(name) {
	    return this.handlers.hasOwnProperty(name);
	};

	/**
	 * 
	 * @param {*} name 
	 */
	pdfTemplateMaker.prototype.getHandler = function(name) {
	    return this.handlers[name] || function() {};
	};

	/*
		productData : OBJECT (Reference to template Data)
		productTemplate : OBJECT (reference to master Template)
		Object toEvaluate : ARRAY (List of types to evaluate)
		replacerData: OBJECT (Data to replace our placeholder)
		templateName:  Name of current template been compiled
	*/

	pdfTemplateMaker.prototype.beginDataEvaluation = function(productData, productTemplate, replacerData, templateName) {
	    if (productData && this.templateMatcher.get()) {
	        var self = this;
	        this.templateMatcher.get().forEach(function(type) {
	            if (productTemplate[type]) { //type must be a property in templateData
	                //perform Object dataType
	                switch (typeof productTemplate[type]) {
	                    case ("object"):
	                        evaluateObject(type);
	                        break;
	                    case ("string"): //function type of evlaution 
	                        evaluateString(type);
	                        break;
	                    default:

	                        break;
	                }
	            }
	        });
	    }

	    /*
	    	checkForLogicBeforeProcess Fn
	    	check if current content has a logic or not

	    	argument
	    	prop, productData,productTemplate[type],replacerData
	    */
	    function checkForLogicBeforeProcess(prop, productData) {
	        if (productData[prop] && productData[prop].hasLogic) {
	            if (self.hasHandlers(productData[prop].hasLogic)) {
	                self.getHandler(productData[prop].hasLogic)(prop, productData);
	            }
	        }
	    }

	    /*
	    	works for both string and Object type of data
		*/
	    function evaluateObject(type) {
	        for (var prop in productTemplate[type]) {
	            self.parser(productData, productTemplate[type][prop], replacerData);
	            /**
	             * pagebreak only
	             */
	            if (typeof productTemplate[type][prop] === "string" && ["pagebreak", "br"].indexOf(productTemplate[type][prop].toLowerCase()) > -1) {
	                productTemplate[type][prop] = { text: "", "pageBreak": "after" };
	            }
	            checkForLogicBeforeProcess(prop, productTemplate[type]);
	        }
	    }

	    function evaluateString(type) {
	        if (self.hasHandlers(productTemplate[type])) {
	            productTemplate[type] = self.handlers[productTemplate[type]](productData, type, replacerData)
	        } else if (productData[type]) {
	            if (!productData[type].requiredParser) {
	                productTemplate[type] = self.templateReplacer(productData[type], replacerData);
	            } else {
	                productTemplate[type] = self.parser(productData, productData[type], replacerData)
	            }
	        }

	        checkForLogicBeforeProcess(type, productData);
	    }

	    this.events.broadcast('evaluation.done', [productTemplate, templateName]);
	};


	/*
		pdfTemplate replacer
	*/

	pdfTemplateMaker.prototype.templateReplacer = function(template, data) {
	    if (!template) {
	        debugger;
	    }

	    var self = this;

	    function stringParser(key, value) {
	        return ((value in data) ? data[value] : self.getHandler('$translate')(value) || "");
	    }

	    if (typeof template === 'object') {
	        return JSON.parse(JSON.stringify(template).replace(/\{\{(.*?)\}\}/g, stringParser));
	    }
	    return template.replace(/\{\{(.*?)\}\}/g, stringParser);
	}

	/*
		Method Name : parser
		@parameter : data {OBJECT} , item {OBJECT} , replacerData {OBJECT } (optional)
		Matches the required item against the template
		if function was found instead of data in parseData Method
			handler FN will be triggered with parameters
		replace all placeholders using replacerData
		
	*/

	pdfTemplateMaker.prototype.parser = function(data, item, replacerData, currentIndex) {
	    var self = this;
	    /*
				replace content where found
				for table handler method 
				return an array of arrays

	 		*/
	    function parseData(required, parent) {
	        var cur = data[required];
	        if (cur.handler && self.hasHandlers(cur.handler)) {
	            return self.handlers[cur.handler](cur.content, parent);
	        } else {
	            return cur.content.shift();
	        }
	    }

	    function processHelpersText(item, match) {
	        if (item.processHelpers && item[match]) {
	            if (self.helpers.hasProcess(match)) {
	                self.helpers.getProcessHelper(match)(item, item.processHelpers);
	            }
	            delete item.processHelpers;
	        }
	    }

	    /*
	    	Layout Handler 
	    */

	    function _layoutHanlder(val) {
	        return function(node, i) {
	            return val;
	        }
	    }

	    this.matchers.forEach(function(match) {
	        var required = item[match];
	        //match found
	        if (required) {
	            //required object found in data
	            if (data[required]) {
	                //replace the content with matched data
	                var parsed = parseData(required);
	                if (self.ignoreReplacer.indexOf(match) < 0) {
	                    parsed = self.templateReplacer(parsed, replacerData);
	                }
	                item[match] = parsed;
	            } else {
	                switch (match) {
	                    case ('table'):
	                        //replace the body with an empty array
	                        var clonedBody = required.body;
	                        item[match].body = [];
	                        for (var i in clonedBody) {
	                            if (data[clonedBody[i]]) {
	                                var ret = clonedBody[i];
	                                var parsedBody = parseData(ret, item[match].body);
	                                if (parsedBody === undefined) {
	                                    continue;
	                                }
	                                //use the array push apply method to concat all data together
	                                item[match].body.push.apply(item[match].body, self.templateReplacer(parsedBody, replacerData));
	                            } else {
	                                //push the cloned data back
	                                item[match].body.push.apply(item[match].body, [clonedBody[i]]);
	                            }
	                        }
	                        break;
	                    case ('layout'):
	                        //replace the layout value with a function
	                        item[match] = self.__layout(required);
	                        break;
	                    default:
	                        item[match] = self.templateReplacer(required, replacerData);
	                        break;

	                }
	            }
	        }

	        self.helpers.processHelperText(item, match);
	    });

	    return item;
	};

	/*
		add template Matcher
	*/
	pdfTemplateMaker.prototype.setMatchers = function(matcher, replace) {
	    if (replace) {
	        this.matchers = matcher;
	    } else {
	        this.matchers.push(matcher);
	    }

	    return this;
	};

	/*

		Initializer Method
	*/

	pdfTemplateMaker.prototype.initialize = function(url, options) {
	    this.loadTemplate.apply(this, arguments);
	};

	/*extend*/
	function extend(a, b, c) {
	    if (c) {
	        return extend(extend(a, b), c);
	    }

	    for (var prop in b) {
	        if (!a.hasOwnProperty(prop)) {
	            a[prop] = b[prop];
	        }
	    }

	    return a;
	}

	pdfTemplateMaker.prototype.extend = extend;

	/*
		capitalize
		@returns capitalize String
	*/
	pdfTemplateMaker.prototype.capitalize = function(string) {
	    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
	};



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


	//Error trigger
	pdfTemplateMakerService.prototype.triggerError = function (type, data) {
		var self = this;
		return function () {
			self.pdfTemplateObj.events.broadcast(type, data);
		}
	};


   /**
    * 
    * @param {*} formularToExecute 
    */
   pdfTemplateMakerService.prototype.executeFormulars = function(formularToExecute) {
       if (typeof formularToExecute === "object") {
           var _current = formularToExecute[0],
               _exec = new this.formular(_current.event),
               _requiredModule = this.externalModules.get(_current.requiredModule);
           //initialize the formular
           _exec.removeCache()._init(_requiredModule);
       }
       var self = this;
       return {
           after: function(CB) {
               if (CB) {
                   self.pdfTemplateObj.events.subscribe('modular.formular.queue.finish', function() {
                       CB();
                   });
               };

               self = null;
           }
       }
   };



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


	//set the definition handler
	pdfTemplateMakerService.prototype.generatePdf = function() {
	    var arg = arguments;
	    this.pdfTemplateObj.events.subscribe('pdf.ready.to.build', function(_definition) {
	        var _pdf = pdfMake.createPdf(_definition);
	        _pdf.getDataUrl.apply(_pdf, arg);
	    });
	};


     //Javascript service that connects to the pdfTemplateMaker
     function pdfTemplateMakerService(model, templateurl) {
         var model = model || {},
             pTemplateMaker = this.pdfTemplateObj = new pdfTemplateMaker(),
             _externalModules = {},
             _currentConfigObj = {};
         //pdfMaker For loading template
         //As required by Victor
         var mainPath = templateurl || './templates/pdfMaker_structure',
             requiredTemplate = null,
             productTemplate,
             self = this;

         /* Set the filePath else default will be used */
         this.setFilePath = function(path) {
             mainPath = path || mainPath;
             return this;
         };

         this.isMultipleTemplateInstance = true;
         this.ignorePageCheck = function() {
             this._ignorePageCheck = true;
             return this;
         };

         this.localization = {
             use: false,
             locales: null,
             default: "en",
             path: "",
             $db: {},
             resolver: function(key) {
                 return this.use && this.$db[this.default][key];
             },
             resolveStyle: function() {
                 return ({
                     fontSize: 10,
                     alignment: "justify",
                     font: "Roboto"
                 })
             }
         };

         /**
          * 
          * @param {*} definition 
          */
         this.setLocalization = function(definition) {
             this.localization = this.pdfTemplateObj.extend({}, definition, this.localization);
             return this;
         };

         /**
          * 
          * @param {*} _model 
          */
         function profile(_model) {
             var ret = {};

             function findPropPath(obj, path) {
                 path = path || [];
                 for (var prop in obj) {
                     path.concat(prop);
                     if (typeof obj[prop] == "object") {
                         findPropPath(obj[prop], path.concat(prop));
                     } else {
                         ret[path.concat(prop).join(".")] = obj[prop];
                     }
                 }
             }

             findPropPath(_model);
             return ret;
         }


         /**
          * 
          * @param {*} CB 
          */
         this.resolveLocalization = function(CB) {
             if (this.localization.locales && this.localization.locales.length) {
                 this.localization.locales.forEach(resolver);
             }

             /**
              * 
              * @param {*} locale 
              * @param {*} idx 
              * 
              * path can contain template matcher or simply a string
              * /{{matcher_0}}/{{mather_1}}/i18n/
              */
             function resolver(locale, idx) {
                 pTemplateMaker.loadTemplate(
                     pathReplacer(self.getFilePath(self.localization.path + locale + ".json"), model), {
                         error: function() {
                             finalize(locale, {}, idx);
                         },
                         success: function(lang) {
                             finalize(locale, lang, idx);
                         }
                     });
             }

             function finalize(locale, lang, idx) {
                 self.localization.$db[locale] = lang;
                 if (idx == self.localization.locales.length - 1) {
                     (CB || noop)();
                 }
             }
         };




         //get the filePath
         this.getFilePath = function(path) {
             return mainPath + "/" + path;
         };

         //set model
         this.setModel = function(newModel) {
             model = newModel || model;

             return this;
         };

         this.convertModelToDictionary = function() {
             model.replacerData = profile(model.replacerData);
             return this;
         };

         //add externalModule to call
         this.externalModules = {
             set: function(moduleName, fn) {
                 _externalModules[moduleName] = fn;
             },
             get: function(name) {
                 return _externalModules[name] || function() {}
             }
         };

         /**
          * set underline helper
          */
         pTemplateMaker.helpers.add('@underline', function(_str) {
             var regex = /\@underline\((.*?)\)+/g,
                 _arr = _str.split(regex),
                 _match = _str.match(regex),
                 nArr = new Array(_arr.length);
             if (_arr.length === 1) {
                 return _str
             }

             _arr.forEach(function(str, idx) {
                 if (_match.some(function(key) { return key.indexOf(str) > -1 })) {
                     str = ({
                         text: str,
                         decoration: 'underline'
                     })
                 }

                 nArr[idx] = str
             })

             return nArr;
         });


         pTemplateMaker
             .templateMatcher
             .default(["content", "header", "footer", "defaultStyle", "images", "pageBreakBefore"]);
         //pdfTemplateConfig goes here 
         pTemplateMaker
             .setMatchers(["text", "columns", "table", "stack", "ul", "ol", "layout"], true)
             .setHandlers('$translate', function(key) {
                 return self.localization.resolver(key)
             })
             /*
             	Handler draw table
             	return the table data
             */
             .setHandlers('footerHandler', function(productData, page, replacerData) {
                 return function(currentPage, pageCount) {
                     replacerData.currentPage = currentPage;
                     replacerData.pageCount = pageCount;
                     var footerData = pTemplateMaker.templateReplacer(productData[page].content[0], replacerData);
                     // process helpers
                     pTemplateMaker.helpers.processHelperText(footerData);
                     return footerData;
                 }
             })
             .setHandlers('headerHandler', function(productData, page, replacerData) {
                 return function(currentPage, pageCount) {
                     replacerData.currentPage = currentPage;
                     replacerData.pageCount = pageCount;
                     var headerData = pTemplateMaker.templateReplacer(productData[page].content || productData[page], replacerData);
                     // process helpers
                     pTemplateMaker.helpers.processHelperText(headerData);
                     return headerData;
                 }
             })
             /**
              * can be overwritten
              * or set with custom binder
              */
             .setHandlers('pageBreakHandler', function() {
                 return function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
                     return false;
                 };
             })
             /**
              * resolve the current style
              */
             .setHandlers('defaultStyleHandler', function() {
                 return self.localization.resolveStyle();
             })
             /**
              * layout handler
              */
             .setHandlers('layoutHandler', function(definition) {
                 return pTemplateMaker.__layout(definition);
             })
             .events.subscribe("productTemplateLoader", function(productTemplateFileName, loadProductData) {
                 pTemplateMaker.loadTemplate(productTemplateFileName, {
                     success: function(product) {
                         productTemplate = product;
                         loadProductData();
                     },
                     error: self.triggerError('TemplateError', [productTemplateFileName, 'Failed to Load Template'])
                 });
             })
             .subscribe("data.loader", function(productDataFileName, templateName) {
                 pTemplateMaker.loadTemplate(productDataFileName, {
                     success: function(data) {
                         pTemplateMaker.beginDataEvaluation(data, productTemplate, model.replacerData || {}, templateName);
                     },
                     error: self.triggerError('TemplateError', [productDataFileName, 'Failed to Load Data'])
                 });
             })
             .stack('definitionBuilder');

         var docs = { _definition: [], totalPageCount: 0, _allPdf: [], _pagesNumber: [], _footerHandler: {}, _headerHandler: {} },
             currentPageNo = 0, //set a variable for currentPage
             pagesTotal = 0, //pagesTotal set to 0, this will increment based on number of pages
             templatesCount = 0; //previousPage is set to currentpage

         //no-Operation
         function noop() {};

         //event subscribed for skipping of templates
         pTemplateMaker.events.subscribe('skip.template', function() {
             templatesCount++;
             pTemplateMaker.events.definitionBuilder.pop();
         });

         pTemplateMaker.events.subscribe('evaluation.done', function(productTemplate, tmpl) {
             /**
              * force compilation of templates
              * on single template instance
              */
             if (!self.isMultipleTemplateInstance && self._ignorePageCheck) {
                 pTemplateMaker.events.broadcast('generate.signature', [tmpl, 0, _currentConfigObj.signatures]);
                 /**
                  * resolve the definition 
                  */
                 setTimeout(function() {
                     pTemplateMaker.events.broadcast('pdf.ready.to.build', [productTemplate]);
                 }, 100);
                 return;
             }

             //get the number of pages per template
             pdfMake
                 .createPdf(productTemplate)
                 ._getPages({}, function(pages) {
                     //increment the template count
                     templatesCount++;
                     docs._definition.push(productTemplate);
                     pagesTotal += pages.length;
                     var i = currentPageNo + 1;

                     for (; i <= pagesTotal; i++) {
                         docs._footerHandler[i] = productTemplate.footer || noop;
                         docs._headerHandler[i] = productTemplate.header || noop;
                         //events to trigger signature generation
                         pTemplateMaker.events.broadcast('generate.signature', [tmpl, i, _currentConfigObj.signatures]);
                     }

                     currentPageNo += pages.length;

                     if (templatesCount === requiredTemplate.templatesMapping.requiredTemplate.length) {
                         docs.totalPageCount = pagesTotal;
                         pTemplateMaker.events.broadcast('buildDefinition', [docs]);
                         docs = { _definition: [], totalPageCount: 0, _allPdf: [], _pagesNumber: [], _footerHandler: {}, _headerHandler: {} };
                         templatesCount = currentPageNo = pagesTotal = 0;
                     } else {
                         pTemplateMaker.events.definitionBuilder.pop();
                     }
                 });
         });

         pTemplateMaker.events.subscribe('buildDefinition', function(_documents) {
             var _pdfDefinition = { //new ObjectDefinition
                     content: [],
                     images: {},
                     styles: {}
                 },
                 _curDef = _documents._definition[0];

             _documents._definition.forEach(function(_def, _idx) {
                 if (templatesCount - 1 > _idx) {
                     //add page break to the template
                     _def.content.push({ text: "", "pageBreak": "after" });
                 }

                 _pdfDefinition.content.push.apply(_pdfDefinition.content, _def.content);
                 _pdfDefinition.images = pTemplateMaker.extend({}, _pdfDefinition.images, _def.images);
                 _pdfDefinition.styles = pTemplateMaker.extend({}, _pdfDefinition.styles, _def.styles);
             });

             //set other configuration
             _pdfDefinition.pageSize = _curDef.pageSize;
             _pdfDefinition.pageMargins = _curDef.pageMargins;
             _pdfDefinition.defaultStyle = _curDef.defaultStyle;

             /**
              * 
              * @param {*} currentPage 
              * @param {*} pageCount 
              */
             _pdfDefinition.footer = function(currentPage, pageCount) {
                 return _documents._footerHandler[currentPage](currentPage, pageCount);
             };

             /**
              * 
              * @param {*} currentPage 
              * @param {*} pageCount 
              */
             _pdfDefinition.header = function(currentPage, pageCount) {
                 var header = _documents._headerHandler[currentPage];
                 if (typeof header === "function") {
                     return header(currentPage, pageCount);
                 }

                 return header;
             };

             pTemplateMaker.events.broadcast('pdf.ready.to.build', [_pdfDefinition]);

             //free up memory
             _pdfDefinition = null;
             _documents = null;

         });

         pTemplateMaker
             .events.subscribe('build.template', function(config) {
                 var currentProduct = getTemplate(config.mapping, config.products || config, model);
                 if (currentProduct.mapping) {
                     requiredTemplate = getTemplate(currentProduct.mapping, currentProduct, model.options);
                 } else {
                     requiredTemplate = currentProduct;
                 }

                 //build the templates
                 if (typeof requiredTemplate.templatesMapping === "string") {
                     var req = requiredTemplate.templatesMapping;
                     requiredTemplate.templatesMapping = {
                         requiredTemplate: config.requiredTemplate[req],
                         requiredData: config.requiredData[req]
                     }
                 } else {
                     for (var prop in requiredTemplate.templatesMapping) {
                         if (typeof requiredTemplate.templatesMapping[prop] === "string") {
                             requiredTemplate.templatesMapping[prop] = config[prop][requiredTemplate.templatesMapping[prop]];
                         }
                     }
                 }

                 // check conditions on requiredTemplate
                 if (requiredTemplate.templatesMapping.templateCondition) {
                     resolveTemplateCondition(requiredTemplate.templatesMapping, model);
                 }

                 pTemplateMaker.events.broadcast('generateTemplates', [requiredTemplate]);

                 //set our config Obj
                 _currentConfigObj = JSON.parse(JSON.stringify(config));
             })
             .subscribe('generateTemplates', function(requiredTemplate) {
                 //get the required Template
                 requiredTemplate.templatesMapping.requiredTemplate.forEach(function(tmpl, idx) {
                     //load the template
                     pTemplateMaker.events.definitionBuilder.push(function() {
                         var curFilePath = tmpl + "/",
                             productTemplateFileName = pathReplacer(self.getFilePath(curFilePath + 'master.tmpl.json'), model);

                         pTemplateMaker.events.broadcast("productTemplateLoader", [productTemplateFileName, pTemplateMaker.events.bind(function(_idx, _tmpl) {
                             var curTemplateData = requiredTemplate.templatesMapping.requiredData[_idx],
                                 productDataFileName,
                                 _extraData = {};
                             if (typeof curTemplateData === "object") {
                                 productDataFileName = curTemplateData.template;
                                 //check for extra data
                                 _extraData = pTemplateMaker.extend(curTemplateData.extraData, requiredTemplate.extraData || {});
                             } else {
                                 productDataFileName = curTemplateData;
                             }

                             //initialize every formular binded to particular Prduct
                             var _requiredData = self.formular(_tmpl).removeCache()._init([curTemplateData]);
                             pTemplateMaker.extend(model.replacerData, _requiredData, _extraData);

                             productDataFileName = pathReplacer(self.getFilePath(curFilePath + productDataFileName + ".data.json"), model.options || model);
                             pTemplateMaker.events.broadcast("data.loader", [productDataFileName, _tmpl]);
                         }, [idx, tmpl])]);
                     });
                 });

                 // set the multiple template flag
                 self.isMultipleTemplateInstance = requiredTemplate.templatesMapping.requiredTemplate.length > 1;
                 pTemplateMaker.events.definitionBuilder.pop();
             });


         function getTemplate(arr, context, replacer) {
             for (var i in arr) {
                 context = context[replacer[arr[i]]];
             }

             return context;
         }

         // resolveTemplateCondition
         function resolveTemplateCondition(template, model) {
             var _resolved = getTemplate(template.templateCondition.mapping, template.templateCondition, model.options);
             if (_resolved) {
                 for (var _tmpl in _resolved) {
                     template[_tmpl].push.apply(template[_tmpl], _resolved[_tmpl]);
                 }
             }
         }

         function pathReplacer(path, model) {
             return pTemplateMaker.templateReplacer(path, model);
         }
     }

     /**
      * VFS Fonts configuration
      */
     pdfTemplateMakerService.prototype.configureFonts = function(fonts) {
         pdfMake.fonts = pdfMake.fonts || {};
         /**
          * set default fonts
          */
         pdfMake.fonts.Roboto = {
             normal: 'Roboto-Regular.ttf',
             bold: 'Roboto-Medium.ttf',
             italics: 'Roboto-Italic.ttf',
             bolditalics: 'Roboto-MediumItalic.ttf'
         };

         (fonts || []).forEach(function(key) {
             pdfMake.fonts[key] = {
                 normal: key + '.ttf',
                 bold: key + '-Bold.ttf',
                 italics: key + '-Italic.ttf',
                 bolditalics: key + '-BoldItalic.ttf'
             };
         });

         return this;
     };

     window.pdfTemplateMakerService = pdfTemplateMakerService;