var AttributeDomRegistration = require('../src/AttributeDomRegistration');

var utils = AttributeDomRegistration._AttributeHelper;
var hookHelper = AttributeDomRegistration._HookHelper;
var LineAttribute = AttributeDomRegistration._LineAttribute;
var InlineAttribute = AttributeDomRegistration._InlineAttribute;

describe("AttributeHelper", function () {
        
    it("should extract the correct dom names", function () {
        // before
        var mockInlineAttribute = {getDomElementName: function(){ return "span"; }},
            mockLineAttribute = {getDomElementName: function(){ return "div"; }};
        
        // when
        var elementNames = utils.getDomElementNames([mockInlineAttribute, mockLineAttribute]);
        
        // verify
        expect(elementNames).toEqual(["span", "div"]);
    });
    
    it("should apply function only to matching attributes", function(){
        // before
        var EXTRACTED_VALUE = "xyz";
        var mockMatchingAttribute = {
            matchesClassString: function(){return true;},
            extractValueFromClassString: function(){return EXTRACTED_VALUE;}
        },
        mockDifferentAttribute = {
            matchesClassString: function(){return false;},
            extractValueFromClassString: function(){return null;}
        };
        var spy  = { 'callback': function(attribute, value){ }};        
        spyOn(spy, 'callback');
        
        
        // when
        utils.applyIfClassStringMatches([mockMatchingAttribute, mockDifferentAttribute], 
            "any-string", spy.callback);

        // verify
        expect(spy.callback).toHaveBeenCalledWith(mockMatchingAttribute, EXTRACTED_VALUE);
        expect(spy.callback.calls.count()).toEqual(1);
    });
    
    it("should map attrib values", function(){
        // before
        var EXTRACTED_VALUE = "xyz";
        var mockMatchingAttribute = {
            matchesClassString: function(){return true;},
            extractValueFromClassString: function(){return EXTRACTED_VALUE;}
        },
        mockDifferentAttribute = {
            matchesClassString: function(){return false;},
            extractValueFromClassString: function(){return null;}
        };
        var spy  = { 'callback': function(attribute, value){ }};        
        spyOn(spy, 'callback').and.returnValue(EXTRACTED_VALUE);
        
        
        // when
        var values = utils.mapIfClassStringMatches([mockMatchingAttribute, mockDifferentAttribute], 
            "any-string", spy.callback);

        // verify
        expect(values).toEqual([EXTRACTED_VALUE]);
        expect(spy.callback).toHaveBeenCalledWith(mockMatchingAttribute, EXTRACTED_VALUE);
        expect(spy.callback.calls.count()).toEqual(1);
    });
    
    it("should return the correct classes", function(){
        // before
        var mockAttrib1 = { 
            attributeName: "name1",
            getCssClasses: function(){return ["class1a","class1b"];}
        },
        mockAttrib2 = { 
            attributeName: "name2",
            getCssClasses: function(){return ["class2a","class2b"];}
        };
        // when
        var classes = utils.getClassesForMatchingAttributes(
                [mockAttrib1, mockAttrib2],"name1","anyValue");
        
        // verify
        expect(classes).toEqual(["class1a","class1b"]);
    });
    
    it("should return the correct classes", function(){
        // before
        var mockAttrib1 = { 
            attributeName: "name1",
            getCssClasses: function(){return ["class1a","class1b"];}
        },
        mockAttrib2 = { 
            attributeName: "name1",
            getCssClasses: function(){return ["class2a","class2b"];}
        };
        // when
        var classes = utils.getClassesForMatchingAttributes(
                [mockAttrib1, mockAttrib2],"name1","anyValue");
        
        // verify
        expect(classes).toEqual(["class1a","class1b","class2a","class2b"]);
    });
});



describe("HookHelper", function () {
    
    it("should push return the modifier", function() {
        // before
        var mockAttrib1 = { 
            getDomStartTag: function(){},
            getDomEndTag: function(){}
        };
        spyOn(mockAttrib1, 'getDomStartTag').and.returnValue("<tag>");
        spyOn(mockAttrib1, 'getDomEndTag').and.returnValue("</tag>");
        
        // when
        var linemodifier = hookHelper.getLineModifier(mockAttrib1, "value");
        var inlinemodifier = hookHelper.getInlineModifier("classString", mockAttrib1, "value");
        
        // verify
        expect(linemodifier).toEqual({preHtml:"<tag>",postHtml:"</tag>",processedMarker:true});
        expect(inlinemodifier).toEqual({extraOpenTags:"<tag>",extraCloseTags:"</tag>",cls:"classString"});
        
        expect(mockAttrib1.getDomStartTag).toHaveBeenCalledWith( "value");
        expect(mockAttrib1.getDomStartTag.calls.count()).toEqual(2);
        expect(mockAttrib1.getDomEndTag.calls.count()).toEqual(2);
    });
    
    
    it("should push the line attributes", function() {
        // before
        var dummyContext = {state: {lineAttributes: {} }};
        
        // when
        hookHelper.pushLineAttribute(dummyContext, "k","v");
        
        // verify
        expect(dummyContext.state.lineAttributes).toEqual({k: "v"})
    });
    
    it("should push the inline attributes", function(){
        // before
        var dummyContext = {state:"dummyState",cc: {doAttrib: function(){} }};
        spyOn(dummyContext.cc, 'doAttrib');
        
        // when
        hookHelper.pushInlineAttribute(dummyContext, "k", "v");
        
        // verify
        var expectedAttribString = "k::v";
        expect(dummyContext.cc.doAttrib).toHaveBeenCalledWith("dummyState",expectedAttribString);        
    });
});