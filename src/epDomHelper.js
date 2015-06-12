/**
 * Helper for Programming Etherpad Plugins
 * 
 * @version 0.0.2
 * @date 2015-06-12
 */

var InlineAttribute = function(attributeName, cssClassRegex, cssMapper){
    
    /**
     * inline Attributes are represented as span elements containing classes and style attributes
     */
    var getDomElementName = function(){
        return "span";
    };
    
    var getDomElementClassName = function(value){
        return attributeName.toLowerCase() + ":" + value;
    };
    
    /**
    * When building the editor dom the aceAttribsToClasses hook is called.
    * Here we match attribute names to html classes
    * 
    * for example font-size=12 is mapped to ["font-size", "font-size-12"],
    * this results in a class string containing "font-size font-size-12" 
    * (and possibly other classes caused by other attributes)
    * @returns {Array}
    */
    var getCssClasses = function(attributeValue) {
        return [attributeName, attributeName + '-' + attributeValue];
    };
    
    var getDomStartTag = function(value){
        return '<span ' + cssMapper(value) + '>';
    };
    
    var getDomEndTag = function() {
        return '</span>';
    };
    
    var matchesClassString = function(classString) {
        return cssClassRegex.exec(classString);
    };
    
    var extractValueFromClassString = function(classString) {
        return cssClassRegex.exec(classString)[1];
    };
    
    
    return {
        attributeName : attributeName,
        getDomElementName : getDomElementName,
        getDomElementClassName : getDomElementClassName,
        getCssClasses : getCssClasses,
        getDomStartTag : getDomStartTag,
        getDomEndTag : getDomEndTag,
        matchesClassString : matchesClassString,
        extractValueFromClassString : extractValueFromClassString
    };
    
    
};

var LineAttribute = function(attributeName, cssClassRegex, cssMapper){
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
    var getDomElementName = function(){
        return "div";
    };
    
    /**
    * Creates the class-string used to preserve the line attribute value in the DOM.
    */
    var getDomElementClassName = function(attributeValue){
        return attributeName.toLowerCase() + ":" + attributeValue;
    };
    
    var getCssClasses = function(attributeValue) {
        return [getDomElementClassName(attributeValue)];
    };
    
    /**
    * Regular expression that extracts the line attribute from a class string
    */
    var _getAttributeValueFromClassRegex = function(){
        return new RegExp("(?:^| )" + attributeName.toLowerCase() + ":([A-Za-z0-9\-]*)");
    };
        
    /**
     * Creates the Markup-String (Start-Tag) for the DOM used to preserve the line attribute
     */
    var getLineAttributeDomStartTag = function(value){
        return '<' + getDomElementName() + ' class="' + getDomElementClassName(value) + '">';
    };
    
    /**
     * returns the corresponding end-Tag to _getLineAttributeDomStartTag()
     */
    var getLineAttributeDomEndTag = function(){
        return '</' + getDomElementName() + '>';
    };
    
    var matchesClassString = function(classString) {
        return _getAttributeValueFromClassRegex().exec(classString);
    };
    
    var extractValueFromClassString = function(classString) {
        return _getAttributeValueFromClassRegex().exec(classString)[1];
    };
    
    return {
        attributeName : attributeName,
        getDomElementName : getDomElementName,
        getDomElementClassName : getDomElementClassName,
        getDomStartTag : getLineAttributeDomStartTag,
        getDomEndTag : getLineAttributeDomEndTag,
        matchesClassString : matchesClassString,
        extractValueFromClassString : extractValueFromClassString,
        getCssClasses : getCssClasses
    };
};


module.exports = (function(){
    var lineAttributes = [];
    var inlineAttributes = [];
    
    var _getDomElementNames = function(attributeList){
        return attributeList.map(function(attribute) {
            return attribute.getDomElementName();
        });
    };
    
    
    var registerLineAttribute = function(lineAttributeName){
        lineAttributes.push(new LineAttribute(lineAttributeName));
        console.debug("registered line attributes: " + JSON.stringify(lineAttributes));
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
    var registerInlineAttribute = function(inlineAttribute) {
        inlineAttributes.push(new InlineAttribute(
                inlineAttribute.attributeName,
                inlineAttribute.cssClassRegex,
                inlineAttribute.cssMapper));
        console.debug("registered inline attributes: " + JSON.stringify(inlineAttributes));
    };
    
    var registerDomHooks = function(exports){
        exports.aceRegisterBlockElements = function() {
            var blockElements = _getDomElementNames(lineAttributes);
            console.debug("registerBlockElements: " + JSON.stringify(blockElements))
            return blockElements;
        };
        
        /*
        * Our attribute will be mapped to html classes, 
        * preserving name and value of the attribute
        * See the LineAttribute and InlineAttribute classes for the implementation.
        * 
        * Required for aceDomLineProcessLineAttributes() which is called afterwards
        * in case of line attributes or aceCreateDomLine() for inline attributes 
        */
        exports.aceAttribsToClasses = function(hook, context){
            var currentAttributeName = context.key;
            var currentAttributeValue = context.value;
            
            var allAttributes = lineAttributes.concat(inlineAttributes);
            console.debug("looking for attribute " + currentAttributeName + " in " + JSON.stringify(allAttributes));
            
            // LINE ATTRIBUTES
            var classes = allAttributes.filter(function(attribute){
                return attribute.attributeName === currentAttributeName;
            }).map(function(attribute){
                return attribute.getCssClasses(currentAttributeValue);
            });
            
            console.debug("mapped attribute " + currentAttributeName + ":" + currentAttributeValue +
                    "to classes " + JSON.stringify(classes));
            
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
            var currentClassString = context.cls;
            
            var modifiers = _mapIfClassStringMatches(lineAttributes, currentClassString, function(attribute, attributeValue){
                var modifier = {
                    preHtml: attribute.getDomStartTag(attributeValue),
                    postHtml: attribute.getDomEndTag(),
                    processedMarker: true
                };
                return modifier;
            });
            
            console.debug("apply modifiers for classString " + currentClassString + ": " + JSON.stringify(modifiers));
            
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
            var currentClassString = context.cls;
            
            var modifiers = _mapIfClassStringMatches(inlineAttributes, currentClassString, function(attribute, attributeValue){
                
                var modifier = {
                  extraOpenTags: attribute.getDomStartTag(attributeValue),
                  extraCloseTags: attribute.getDomEndTag(),
                  cls: currentClassString
                };
                return modifier;
            });

            console.debug("push modifiers for classString '" + currentClassString + "': " + JSON.stringify(modifiers));
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
            
            var isBlockElement = function(elementName) {
                return _getDomElementNames(lineAttributes).indexOf(elementName) >= 0;
            };
            
            var isInlineElement = function(elementName) {
                return _getDomElementNames(inlineAttributes).indexOf(elementName) >= 0;
            };
                        
            // LINE ATTRIBUTES
            if (isBlockElement(context.tname)) {
                
                _applyIfClassStringMatches(lineAttributes, currentClassString, function(lineAttribute, lineAttributeValue){
                    context.state.lineAttributes[lineAttribute.attributeName] = lineAttributeValue;
                });
            }
            
            // INLINE ATTRIBUTES
            if (isInlineElement(context.tname)) {
                /**
                 * split a class string like 
                 * "font-color font-color-00ff00 font-size font-size-12 font-family font-family-serif else"
                 * into each class and then into attribute name and value
                 */
                var classes = currentClassString.split(" ");
                
                classes.forEach(function(cssClass) {
                    _applyIfClassStringMatches(inlineAttributes, currentClassString, function(inlineAttribute, inlineAttributeValue){
                        var fontWorkaroundString = inlineAttribute.attributeName + "::" + inlineAttributeValue;
                        //console.debug("doAttrib: " + fontWorkaroundString);
                        context.cc.doAttrib(context.state, fontWorkaroundString);
                    });
                });
            }
        };
    };
    
    function _applyIfClassStringMatches(attributes, classString, apply) {
        attributes.filter(function(attribute){
            return attribute.matchesClassString(classString);
        }).forEach(function(attribute){
            var attributeValue = attribute.extractValueFromClassString(classString)
            apply(attribute, attributeValue);
        });
    };

    function _mapIfClassStringMatches(attributes, classString, map) {
        return attributes.filter(function(attribute){
            return attribute.matchesClassString(classString);
        }).map(function(attribute){
            var attributeValue = attribute.extractValueFromClassString(classString)
            return map(attribute, attributeValue);
        });
    };
    
    return {
        registerLineAttribute : registerLineAttribute,
        registerInlineAttribute : registerInlineAttribute,
        registerDomHooks : registerDomHooks
    };
})();