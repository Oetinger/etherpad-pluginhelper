var epDomHelper = require('../src/epDomHelper');

var utils = epDomHelper._AttribUtils;
var LineAttribute = epDomHelper._LineAttribute;
var InlineAttribute = epDomHelper._InlineAttribute;

describe("Utils", function () {
        
    it("should extract the correct dom names", function () {
        // before
        var mockInlineAttribute = {getDomElementName: function(){ return "span"; }},
            mockLineAttribute = {getDomElementName: function(){ return "div"; }};
        
        // when/verify
        expect(utils._getDomElementNames([mockInlineAttribute, mockLineAttribute]))
                .toEqual(["span", "div"]);
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
        utils._applyIfClassStringMatches([mockMatchingAttribute, mockDifferentAttribute], 
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
        var values = utils._mapIfClassStringMatches([mockMatchingAttribute, mockDifferentAttribute], 
            "any-string", spy.callback);

        // verify
        expect(values).toEqual([EXTRACTED_VALUE]);
        expect(spy.callback).toHaveBeenCalledWith(mockMatchingAttribute, EXTRACTED_VALUE);
        expect(spy.callback.calls.count()).toEqual(1);
    });
});

