(function() {
    'use strict';
    //create a new _pdfService Object
    var _pdfService,
        _service = {},
        //build SDK Formular stack
        _SDK_stack = [],
        _SDK_inProgress = 0,
        _signatureObj = [];
    /**
     * 
     * @param {*} definition 
     * @param {*} templateURL 
     */
    function pdfService(definition, templateURL) {
        _pdfService = this.core = new pdfTemplateMakerService();

        _pdfService
            .setModel(definition)
            .setFilePath(templateURL)
            //generate the benefitTable here
            .pdfTemplateObj
            .setMatchers("layout");

        this._formularQueue = new _pdfService.formular("pdfFormularQueue");
    };

    /**
     * 
     * @param {*} CB 
     */
    pdfService.prototype.build = function(CB) {
        //destroy our signature object
        _signatureObj = [];
        _pdfService
            .build()
            .generatePdf(CB);
    };

    /**
     * 
     * @param {*} type 
     * @param {*} CB 
     */
    pdfService.prototype.onError = function(type, CB) {
        _pdfService.pdfTemplateObj.events.subscribe(type, CB);
        return this;
    };

    /**
     * 
     * @param {*} formularToExecute 
     */
    pdfService.prototype.executeFormulars = function(formularToExecute) {
        if (typeof formularToExecute === "object") {
            var _current = formularToExecute[0],
                _exec = new _pdfService.formular(_current.event),
                _requiredModule = _pdfService.externalModules.get(_current.requiredModule);
            //initialize the formular
            _exec.removeCache()._init(_requiredModule);
        }

        return {
            after: function(CB) {
                if (CB) {
                    _pdfService.pdfTemplateObj.events.subscribe('pdf.generator.formular.queue.finish', function() {
                        CB();
                    });
                };
            }
        }
    };

    /**
     * 
     * @param {*} name 
     * @param {*} _ref 
     */
    pdfService.prototype.externalModules = function(name, _ref) {
        _pdfService.externalModules.set(name, _ref);
        return this;
    };

    /**
     * 
     * @param {*} name 
     * @param {*} handler 
     */
    pdfService.prototype.handlers = function(name, handler) {
        _pdfService
            .pdfTemplateObj
            .setHandlers(name, handler);

        return this;
    };

    pdfService.prototype.setLocalization = function(definition) {
        _pdfService.localization = _pdfService.pdfTemplateObj.extend({}, definition, _pdfService.localization);
        return this;
    };

    window.pdfService = pdfService;
})();