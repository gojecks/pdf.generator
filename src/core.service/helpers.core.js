/**
 * Facade to connect to corePdfMaker helper
 */
pdfTemplateMakerService.helpers = {
    $default: function(helperName, definition) {
        pdfTemplateMaker.$$defaultHelpers[helperName] = pdfTemplateMaker.$$coreParser(definition);

        return this;
    },
    $get: function(helperName) {
        if (helperName && pdfTemplateMaker.$$defaultHelpers[helperName]) {
            return pdfTemplateMaker.$$defaultHelpers[helperName]
        }

        return pdfTemplateMaker.$$defaultHelpers;
    },
    $remove: function(helperName) {
        delete pdfTemplateMaker.$$defaultHelpers[helperName];
    },
    isExists: function(helperName) {
        return pdfTemplateMaker.$$defaultHelpers.hasOwnProperty(helperName);
    },
    $parser: pdfTemplateMaker.$$coreParser
};