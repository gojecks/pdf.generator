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

         this.getModelDictionary = function() {
             return {
                 get: function(key) {
                     return model.replacerData[key]
                 },
                 set: function(name, value) {
                     if (typeof value === "object") {
                         throw error("cannot set object into the dictionary");
                     }

                     model.replacerData[name] = value;
                 },
                 $$: function() {
                     return model.replacerData
                 }
             };
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


         pTemplateMaker
             .templateMatcher
             .default(["content", "header", "footer", "defaultStyle", "styles", "images", "pageBreakBefore"]);
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
          * resolve styles
          * styles:{
              content: <OBJECT> stylesDefinition,
              handler: <STRING> OPTIONAL
          }
          */
         .setHandlers('$stylesHandler', function(productData) {
                 if (productData.styles && productData.styles) {
                     var styles = productData.styles.content;
                     if (productData.styles.handler && pTemplateMaker.hasHandlers(productData.styles.handler)) {
                         styles = pTemplateMaker.handlers[productData.style.handler](styles || {});
                     }
                 }

                 return pdfTemplateMaker.extend({}, styles || {});
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