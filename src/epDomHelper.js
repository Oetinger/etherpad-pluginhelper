/**
 * Helper for Programming Etherpad Plugins
 * 
 * @version 0.0.1
 * @date 2015-06-11
 */

var _ = require('ep_etherpad-lite/static/js/underscore');

module.exports = (function(){
    var lineAttributes = [];
    var inlineAttributes = [];
    
    /*
    * We need to create a container element with classes to preserve the added line attribute in the DOM.
    * The line attribute is restored from DOM to the database in the hook collectContentPre.
    * 
    * This element may be wrapped around other line content, also elements like h1
    * 
    * We experienced problems with 
    * - inline elements like span
    * - p elements when used in combination with heading plugin, 
    * because p must not contain block elements (like h1...)
    * - selfdefined non-standard-elements when using camelcase, like "lineIdContainer"
    * - selfdefined non-standard-elements: css rules are sometimes to applied correctly
    *  
    */
    var _getDomElementNameForLineAttributes = function(){
        return "div";
    };
    
    /**
     * inline Attributes are represented as span elements containing classes and style attributes
     */
    var _getDomElementNameForInlineAttributes = function(){
        return "span";
    };
    /**
    * Creates the class-string used to preserve the line attribute value in the DOM.
    */
    var _getDomElementClassNameFromAttribute = function(lineAttributeName, value) {
        return lineAttributeName.toLowerCase() + ":" + value;
    };
    
    /**
    * When building the editor dom the aceAttribsToClasses hook is called.
    * Here we match attribute names to html classes
    * 
    * for example font-size=12 is mapped to ["font-size", "font-size-12"],
    * this results in a class string containing "font-size font-size-12" 
    * (and possibly other classes caused by other attributes)
    * @param {String} hook name of the hook
    * @param {Object} context
    * @returns {Array}
    */
    var _getCssClassesForInlineAttribute = function(attribName, attribValue) {
        return [attribName, attribName + '-' + attribValue];
    };
    
    /**
    * Regular expression that extracts the line attribute from a class string
    */
    var _getAttributeValueFromClassRegex = function(lineAttributeName){
        return new RegExp("(?:^| )" + lineAttributeName.toLowerCase() + ":([A-Za-z0-9\-]*)");
    };
    
    /**
     * Creates the Markup-String (Start-Tag) for the DOM used to preserve the line attribute
     */
    var _getLineAttributeDomStartTag = function(lineAttributeName, value){
        return '<' + _getDomElementNameForLineAttributes() + ' class="' + _getDomElementClassNameFromAttribute(lineAttributeName, value) + '">';
    };
    
    /**
     * returns the corresponding end-Tag to _getLineAttributeDomStartTag()
     */
    var _getLineAttributeDomEndTag = function(lineAttributeName, value){
        return '</' + _getDomElementNameForLineAttributes() + '>';
    };
    
    var registerLineAttribute = function(lineAttributeName){
        lineAttributes.push(lineAttributeName);
    };
    
    
    /**
     * Example: {
        attributeName: "font-size",
        // TODO: This and the following regular expressions may fail/lead to unexpected results
        // if some other plugins use class names like xxxfont-size-12.
        // This could be prevented by checking the characters before/after the matching string.
        cssClassRegex: /font-size-(\d+)/,
        cssMapper: function(value) {
            return 'style="font-size:' + value + 'px"';
        }
       }
     */
    var registerInlineAttribute = function(inlineAttributeName) {
        inlineAttributes.push(inlineAttributeName);
    };
    
    var registerDomHooks = function(exports){
        exports.aceRegisterBlockElements = function() {
            return _.map(lineAttributes, _getDomElementNameForLineAttributes);
        };
        
        /*
        * Our attribute 'someAttribute' will result in a someattribute:thevalue HTML class.
        * Required for aceDomLineProcessLineAttributes() which is called afterwards
        */
        exports.aceAttribsToClasses = function(hook, context){
            var currentAttributeName = context.key;
            var currentAttributeValue = context.value;
            
            // LINE ATTRIBUTES
            if (lineAttributes.indexOf(currentAttributeName) >= 0){
                //console.debug("Map line attribute " + currentAttributeName + " to css classes " + JSON.stringify(classes));
                return [_getDomElementClassNameFromAttribute(currentAttributeName, currentAttributeValue)];
            }
            
            // INLINE ATTRIBUTES
            var classes = [];
            _.each(inlineAttributes, function(inlineAttribute){
               if (inlineAttribute.attributeName === currentAttributeName){
                    classes = _getCssClassesForInlineAttribute(
                           currentAttributeName, currentAttributeValue);
                    //console.debug("Map inline attribute " + currentAttributeName + " to css classes " + JSON.stringify(classes));
               } 
            });
            //console.debug("no mapping for attribute " + currentAttributeName + ":"+ currentAttributeValue);
            return classes;
        };
        
        /*
        * This hook is called when line attributes are processed to be displayed in the editor
        * We check for classes created in the hook aceAttribsToClasses,
        * create the corresponding markup (set to the modifier) and set processedMarker=true, 
        * to prevent the '*' from being displayed.
        * 
        */
        exports.aceDomLineProcessLineAttributes = function(name, context){
            var modifiers = [];
            var currentClassString = context.cls;
            
            _.each(lineAttributes, function(lineAttributeName) {
                var lineAttributeValueRegexResult = _getAttributeValueFromClassRegex(lineAttributeName).exec(currentClassString);

                if (lineAttributeValueRegexResult && lineAttributeValueRegexResult[1]){
                    var lineAttributeValue = lineAttributeValueRegexResult[1];
                    var modifier = {
                        preHtml: _getLineAttributeDomStartTag(lineAttributeName, lineAttributeValue),
                        postHtml: _getLineAttributeDomEndTag(lineAttributeName),
                        processedMarker: true
                    };
                    modifiers.push(modifier);
                }
            });
            
            return modifiers;
        };
        
        /**
         * This hook is called when the editor dom is created
         * 
         * We use modifiers to add spans with css commands to attributed text
         * if the classes match the regular expressions
         * 
         * @param {type} hook
         * @param {type} context
         * @returns {Array|exports.aceCreateDomLine.modifiers}
         */
        exports.aceCreateDomLine = function(hook, context) {
            var modifiers = [];
            var classString = context.cls;

            var addToModifier = function (newModifier) {
                modifiers.push.apply(modifiers, newModifier);
            };

            var addCssModifier = function(classRegex, cssMapper) {
                addToModifier(getStyleModifierFromClasses(classString, classRegex, cssMapper));
            };

            var getStyleModifierFromClasses = function(classString, classRegex, cssMapper) {
                if (classRegex.exec(classString)) {
                    var value = classRegex.exec(classString)[1];
                    var modifier = {
                      extraOpenTags: '<span ' + cssMapper(value) + '>',
                      extraCloseTags: '</span>',
                      cls: classString
                    };
                    return [modifier];
                }
                return [];
            };

            inlineAttributes.forEach(function(inlineAttribute) {
                addCssModifier(inlineAttribute.cssClassRegex, inlineAttribute.cssMapper);
            });

            //console.debug("push modifiers for classString '" + classString + "': " + JSON.stringify(modifiers));
            return modifiers;
        };
        
        
        /*
         * We need to restore the document attributes from the DOM,
         * otherwise previously inserted attributes get lost.
         * 
         * So we insert a div with class <attributename>:<attributevalue>
         * to the DOM in the hook "aceDomLineProcessLineAttributes"
         * 
         * In this function we fetch this attribute and restore the value using a regex.
         */
        exports.collectContentPre = function(hook, context){
            var currentClassString = context.cls;
            
            if (!currentClassString) {
                return;
            }
            
            // LINE ATTRIBUTES
            if (context.tname === _getDomElementNameForLineAttributes()) {
                _.each(lineAttributes, function(lineAttributeName) {
                    var lineAttributeValueRegexResult = _getAttributeValueFromClassRegex(lineAttributeName).exec(currentClassString);

                    if (lineAttributeValueRegexResult && lineAttributeValueRegexResult[1]){
                        var lineAttributeValue = lineAttributeValueRegexResult[1];
                        context.state.lineAttributes[lineAttributeName] = lineAttributeValue;
                    }
                });
            }
            
            // INLINE ATTRIBUTES
            if (context.tname === _getDomElementNameForInlineAttributes()) {
                /**
                 * split a class string like 
                 * "font-color font-color-00ff00 font-size font-size-12 font-family font-family-serif else"
                 * into each class and then into attribute name and value
                 */
                var classes = currentClassString.split(" ");

                _.each(inlineAttributes, function(inlineAttribute){
                    classes.forEach(function(cssClass){
                        if (inlineAttribute.cssClassRegex.exec(cssClass)) {
                            var value = inlineAttribute.cssClassRegex.exec(cssClass)[1];
                            var fontWorkaroundString = inlineAttribute.attributeName + "::" + value;
                            //console.debug("doAttrib: " + fontWorkaroundString);
                            context.cc.doAttrib(context.state, fontWorkaroundString);
                        }
                    });
                });
            }
            
            
        };
    };
    
    
    
    return {
        registerLineAttribute : registerLineAttribute,
        registerInlineAttribute : registerInlineAttribute,
        registerDomHooks : registerDomHooks
    };
})();