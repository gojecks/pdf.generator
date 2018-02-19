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
                   self.pdfTemplateObj.events.subscribe('pdf.generator.formular.queue.finish', function() {
                       CB();
                   });
               };

               self = null;
           }
       }
   };