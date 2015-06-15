/**
 * Helper for Programming Etherpad Plugins
 * 
 * @version 0.0.2
 * @date 2015-06-12
 */

/**
 * Dom Representation of Inline Attributes
 * Contains methods to create dom elements, classes and style commands
 * @param {type} attributeName
 * @param {type} attributeValueRegex
 * @param {type} cssMapper
 * @returns {InlineAttribute.epDomHelperAnonym$1}
 */
var InlineAttribute = function(attributeName, attributeValueRegex, cssMapper){
    var DOM_ELEMENT = "span";
    var CLASS_KEY_VALUE_SEPERATOR = "-";
    var VALUE_MATCHER = attributeValueRegex || /[A-Za-z0-9\-]+/;
    
    var CSS_CLASS_REGEX = (function (){
        var prefix = new RegExp("(?:^| )" + attributeName.toLowerCase() + CLASS_KEY_VALUE_SEPERATOR);
        var attributeValueGroup = "(" + VALUE_MATCHER.source + ")";
        var _cssClassRegex = new RegExp(prefix.source + attributeValueGroup);
        
        console.log("set css class regex for attribute " + attributeName + " to " + _cssClassRegex);
        return _cssClassRegex;
    })();
    
    /**
     * inline Attributes are represented as span elements containing classes and style attributes
     */
    var getDomElementName = function(){
        return DOM_ELEMENT;
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
        return [attributeName, attributeName + CLASS_KEY_VALUE_SEPERATOR + attributeValue];
    };    
    
    var getDomStartTag = function(value){
        return '<span style="' + cssMapper(value) + '">';
    };
    
    var getDomEndTag = function() {
        return '</span>';
    };
    
    var matchesClassString = function(classString) {
        return !!CSS_CLASS_REGEX.exec(classString);
    };
    
    var extractValueFromClassString = function(classString) {
        return CSS_CLASS_REGEX.exec(classString)[1];
    };
    
    return {
        attributeName : attributeName,
        getDomElementName : getDomElementName,        
        getDomStartTag : getDomStartTag,
        getDomEndTag : getDomEndTag,
        getCssClasses : getCssClasses,
        matchesClassString : matchesClassString,
        extractValueFromClassString : extractValueFromClassString
    };
};

/**
 * Dom Representation of Line Attributes
 * Contains methods to create dom elements, classes and style commands
 * @param {type} attributeName
 * @param {type} cssClassRegex
 * @param {type} cssMapper
 * @returns {InlineAttribute.epDomHelperAnonym$1}
 */
var LineAttribute = function(attributeName){
    var DOM_ELEMENT = "div";
    var CLASS_KEY_VALUE_SEPERATOR = ":";
    
    /**
    * Regular expression that extracts the line attribute from a class string
    */
    var CSS_CLASS_REGEX = (function (){
        var cssClassRegex = new RegExp("(?:^| )" + attributeName.toLowerCase() + CLASS_KEY_VALUE_SEPERATOR + "([A-Za-z0-9\-]+)");
        console.log("set css class regex for attribute " + attributeName + " to " + cssClassRegex);
        return cssClassRegex;
    })();
    
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
        return DOM_ELEMENT;
    };
    
    /**
    * Creates the class-string used to preserve the line attribute value in the DOM.
    */
    var _getDomElementClassName = function(attributeValue){
        return attributeName.toLowerCase() + CLASS_KEY_VALUE_SEPERATOR + attributeValue;
    };
    
    var getCssClasses = function(attributeValue) {
        return [_getDomElementClassName(attributeValue)];
    };
        
    /**
     * Creates the Markup-String (Start-Tag) for the DOM used to preserve the line attribute
     */
    var getLineAttributeDomStartTag = function(value){
        return '<' + getDomElementName() + ' class="' + _getDomElementClassName(value) + '">';
    };
    
    /**
     * returns the corresponding end-Tag to _getLineAttributeDomStartTag()
     */
    var getLineAttributeDomEndTag = function(){
        return '</' + getDomElementName() + '>';
    };
    
    var matchesClassString = function(classString) {
        return !!CSS_CLASS_REGEX.exec(classString);
    };
    
    var extractValueFromClassString = function(classString) {
        return CSS_CLASS_REGEX.exec(classString)[1];
    };
    
    return {
        attributeName : attributeName,
        getDomElementName : getDomElementName,
        getDomStartTag : getLineAttributeDomStartTag,
        getDomEndTag : getLineAttributeDomEndTag,
        getCssClasses : getCssClasses,
        matchesClassString : matchesClassString,
        extractValueFromClassString : extractValueFromClassString        
    };
};


var AttributeHelper = {
    applyIfClassStringMatches: function(attributes, classString, apply) {
        attributes.filter(function(attribute){
            return attribute.matchesClassString(classString);
        }).forEach(function(attribute){
            var attributeValue = attribute.extractValueFromClassString(classString);
            apply(attribute, attributeValue);
        });
    },
    mapIfClassStringMatches: function(attributes, classString, mappingFunction) {
        return attributes.filter(function(attribute){
            return attribute.matchesClassString(classString);
        }).map(function(attribute){
            var attributeValue = attribute.extractValueFromClassString(classString);
            return mappingFunction(attribute, attributeValue);
        });
    },    
    getDomElementNames: function(attributeList){
        // TODO remove duplicates
        return attributeList.map(function(attribute) {
            return attribute.getDomElementName();
        });
    },
    getClassesForMatchingAttributes: function(attributes, attributeName, attributeValue) {
        var classes = [];
        attributes.forEach(function(attribute){
            if (attribute.attributeName === attributeName) {
                classes = classes.concat(attribute.getCssClasses(attributeValue));
            }
        });
        return classes;
    }
};


var HookHelper = {
    /**
     *  for use in aceDomLineProcessLineAttributes
     */
    getLineModifier: function(attribute, attributeValue) {
        return {
            preHtml: attribute.getDomStartTag(attributeValue),
            postHtml: attribute.getDomEndTag(),
            processedMarker: true
        };
    },
    /**
     * for use in aceCreateDomLine
     */
    getInlineModifier: function(classString, attribute, attributeValue) {
        return {
            extraOpenTags: attribute.getDomStartTag(attributeValue),
            extraCloseTags: attribute.getDomEndTag(),
            cls: classString
        };
    },
    /**
     * for use in collectContentPre
     */
    pushLineAttribute: function(context, attributeName, attributeValue) {
        context.state.lineAttributes[attributeName] = attributeValue;
    },
    /**
     * for use in collectContentPre
     */
    pushInlineAttribute: function(context, attributeName, attributeValue) {
        var fontWorkaroundString = attributeName + "::" + attributeValue;
        context.cc.doAttrib(context.state, fontWorkaroundString);
    }
};


module.exports = (function(){
    var lineAttributes = [];
    var inlineAttributes = [];
        
    var registerLineAttribute = function(lineAttributeName){
        lineAttributes.push(new LineAttribute(lineAttributeName));
        console.log("registered line attributes: " + JSON.stringify(lineAttributes));
    };
    
    /**
     * Example: {
        attributeName: "font-size",
        attributeValueRegex: /\d+/,
        cssMapper: function(value) {
            return 'font-size:' + value + 'px';
        }
       }
     */
    var registerInlineAttribute = function(inlineAttribute) {
        inlineAttributes.push(new InlineAttribute(
                inlineAttribute.attributeName,
                inlineAttribute.attributeValueRegex,
                inlineAttribute.cssMapper));
        console.log("registered inline attributes: " + JSON.stringify(inlineAttributes));
    };
    
    var registerDomHooks = function(exports){
        exports.aceRegisterBlockElements = function() {
            var blockElements = AttributeHelper.getDomElementNames(lineAttributes);
            console.log("registerBlockElements: " + JSON.stringify(blockElements))
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
            //console.log("looking for attribute " + currentAttributeName + " in " + JSON.stringify(allAttributes));
            var classes = AttributeHelper.getClassesForMatchingAttributes(allAttributes, currentAttributeName, currentAttributeValue);
            
            console.log("mapped attribute " + currentAttributeName + ":" + currentAttributeValue +
                    " to classes " + JSON.stringify(classes));
            
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
            
            var modifiers = AttributeHelper.mapIfClassStringMatches(lineAttributes, currentClassString, function(attribute, attributeValue){
                return HookHelper.getLineModifier(attribute, attributeValue);
            });
            
            //console.log("apply modifiers for classString " + currentClassString + ": " + JSON.stringify(modifiers));
            
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

            var modifiers = AttributeHelper.mapIfClassStringMatches(inlineAttributes, currentClassString, function(attribute, attributeValue){
                //console.log("add modifier for attribute " + attribute.attributeName + ": " + attributeValue);
                return HookHelper.getInlineModifier(currentClassString, attribute, attributeValue);
            });

            console.log("push modifiers for classString '" + currentClassString + "': " + JSON.stringify(modifiers));
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
                return AttributeHelper.getDomElementNames(lineAttributes).indexOf(elementName) >= 0;
            };
            
            var isInlineElement = function(elementName) {
                return AttributeHelper.getDomElementNames(inlineAttributes).indexOf(elementName) >= 0;
            };
                        
            // LINE ATTRIBUTES
            if (isBlockElement(context.tname)) {
                AttributeHelper.applyIfClassStringMatches(lineAttributes, currentClassString, function(lineAttribute, lineAttributeValue){
                    HookHelper.pushLineAttribute(lineAttribute.attributeName, lineAttributeValue);
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
                    AttributeHelper.applyIfClassStringMatches(inlineAttributes, cssClass, function(inlineAttribute, inlineAttributeValue){
                        HookHelper.pushInlineAttribute(inlineAttribute.attributeName, inlineAttributeValue);
                    });
                });
            }
        };
    };
    
    return {
        registerLineAttribute : registerLineAttribute,
        registerInlineAttribute : registerInlineAttribute,
        registerDomHooks : registerDomHooks,
        // revealed for testing purpose only
        _InlineAttribute : InlineAttribute,
        _LineAttribute : LineAttribute,
        _AttributeHelper : AttributeHelper,
        _HookHelper : HookHelper
    };
})();