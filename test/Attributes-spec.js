var epDomHelper = require('../src/epDomHelper');

var LineAttribute = epDomHelper._LineAttribute;
var InlineAttribute = epDomHelper._InlineAttribute;

describe("InlineAttribute", function () {
    var fontSize = new InlineAttribute("font-size", /\d+/, 
    function(value){
        return "font-size:"+value+"pt";
    });
    
    it("should return span dom elements", function () {
        expect(fontSize.getDomElementName()).toBe("span");
    });
    
    it("should return span start tags", function () {
        expect(fontSize.getDomStartTag("12"))
                .toBe('<span style="font-size:12pt">');
    });
    
    it("should return span end tags", function () {
        expect(fontSize.getDomEndTag("12"))
                .toBe('</span>');
    });
    
    it("should match class the correct class string", function () {
        expect(fontSize.matchesClassString("font-size-12")).toBe(true);
        
        expect(fontSize.matchesClassString(" font-size-12 ")).toBe(true);
        
        expect(fontSize.extractValueFromClassString(" font-size-12 "))
                .toBe("12");
        
        expect(fontSize.matchesClassString("font-fasel-12")).toBe(false);
        
        expect(fontSize.matchesClassString("font-fasel-34b")).toBe(false);
    });
    
    it("should return the correct css classes", function () {
        expect(fontSize.getCssClasses(12)).toEqual(["font-size","font-size-12"]);
    });
});    
