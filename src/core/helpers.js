pdfTemplateMaker.prototype.initializeDefaultHelpers = function() {
    if (pdfTemplateMaker.$$defaultHelpers && typeof pdfTemplateMaker.$$defaultHelpers === 'object') {
        for (var prop in pdfTemplateMaker.$$defaultHelpers) {
            this.helpers.add(prop, pdfTemplateMaker.$$defaultHelpers[prop]);
        }
    }

    return this;
};

pdfTemplateMaker.$$defaultHelpers = {
    "@underline": parserFn({
        decoration: "underline"
    }),
    "@bold": parserFn({
        bold: true
    }),
    "@boldUnderline": parserFn({
        decoration: "underline",
        bold: true
    }),
    "@italics": parserFn({
        italics: true
    }),
    "@boldItalics": parserFn({
        italics: true,
        bold: true
    }),
    "@boldItalicsUnderline": parserFn({
        decoration: "underline",
        bold: true,
        italics: true
    }),
    "@underlineItalics": parserFn({
        decoration: "underline",
        italics: true
    }),
    "@now": parserFn(function() {
        return new Date().toLocaleDateString();
    })
};

/**
 * 
 * @param {*} definition 
 */
function parserFn(definition) {
    return function(parser) {
        var nArr = new Array(parser.length);
        parser.input().forEach(function(str, idx) {
            if (parser.inArray(str)) {
                var _obj;
                /**
                 * check if definition was register with FUNCTION
                 */
                if (typeof definition === 'function') {
                    _obj = definition(str, parser);
                } else {
                    _obj = JSON.parse(JSON.stringify(definition))
                }

                _obj.text = str;
                str = _obj;
                _obj = null;
            }

            nArr[idx] = str
        });

        return nArr;
    }
}

pdfTemplateMaker.$$coreParser = parserFn;