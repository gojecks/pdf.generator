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
	            if (_helpers.hasOwnProperty(name)) {
	                throw new Error('Duplicate Helper name(' + name + ')');
	            }

	            _helpers[name] = fn;
	            return this;
	        },
	        get: function(name) {
	            var expression = new RegExp("\\" + name + "\\((.*?)\\)+", "gi");
	            return function(text) {
	                var _str = text,
	                    _isObj = (typeof text === "object");

	                if (_isObj) {
	                    _str = text.text;
	                }

	                var _splt = _str.split(expression),
	                    _match = _str.match(expression);
	                /**
	                 * force return if no match
	                 */
	                if (!_match) {
	                    return text;
	                }

	                var _parser_ = {
	                        $match: _match,
	                        $split: _splt,
	                        length: _splt.length,
	                        inArray: function(str) {
	                            return _match.some(function(key) { return key.indexOf(str) > -1 });
	                        },
	                        join: function(pattern) {
	                            return this.$split.join(pattern);
	                        },
	                        index: function(index) {
	                            return this.$split[index];
	                        },
	                        input: function() {
	                            return _splt;
	                        }
	                    },
	                    processed = (_helpers[name] || function() { return text; })(_parser_);

	                _parser_ = null;

	                if (_isObj) {
	                    text.text = processed;

	                    return text;
	                }

	                return processed;
	            }
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

	        return this;
	    }

	    this.buildHelpers()
	        .initializeDefaultHelpers();

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
	        set: function(val) {
	            _matcher_.push(val);
	            return this;
	        },
	        remove: function(val) {
	            _matcher_.splice(_matcher_.indexOf(val), 1);
	            return this;
	        },
	        default: function(arr) {
	            _matcher_ = arr;
	            return this;
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