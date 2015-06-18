var AttributeDomRegistration = require('../AttributeDomRegistration');

var LineAttribute = AttributeDomRegistration.LineAttribute;
var InlineAttribute = AttributeDomRegistration.InlineAttribute;

describe("InlineAttribute", function () {
    var fontSize = new InlineAttribute("font-size", {attributeValueRegex: /\d+/, 
    cssMapper: function(value){
        return "font-size:"+value+"pt";
    }});
    
    it("should return span dom elements", function () {
        expect(fontSize.getDomElementName()).toBe("span");
    });
    
    it("should return span start tags", function () {
        expect(fontSize.getDomStartTag("12"))
                .toBe('<span style="font-size:12pt">');
    });
    
    it("should return span end tags", function () {
        expect(fontSize.getDomEndTag())
                .toBe('</span>');
    });
    
    it("should match class the correct class string", function () {
        expect(fontSize.matchesClassString("font-size-12")).toBe(true);
        
        expect(fontSize.matchesClassString(" font-size-12 ")).toBe(true);
        
        expect(fontSize.extractValueFromClassString(" font-size-12 "))
                .toBe("12");
        
        expect(fontSize.matchesClassString("font-fasel-12")).toBe(false);
        
        expect(fontSize.matchesClassString("font-fasel 12")).toBe(false);
        
        expect(fontSize.matchesClassString("font-fasel-34b")).toBe(false);
    });
    
    it("should return the correct css classes", function () {
        expect(fontSize.getCssClasses(12)).toEqual(["font-size","font-size-12"]);
    });
});



describe("LineAttribute", function () {
    var lineHeight = new LineAttribute("lineHeight"),
    lineHeightWithStyle = new LineAttribute("lineHeight", { attributeValueRegex: /\d+/, 
    cssMapper: function(value){
        return "lineheight:" + value + "px";
    }});   
    
    
    it("should return div dom elements", function () {
        expect(lineHeight.getDomElementName()).toBe("div");
    });
    
    it("should return div start tags", function () {
        expect(lineHeight.getDomStartTag("1"))
                .toBe('<div class="lineheight:1">');
    });
    
    it("should return div start tags with style", function () {
        expect(lineHeightWithStyle.getDomStartTag("12"))
                .toBe('<div class="lineheight:12" style="lineheight:12px">');
    });
    
    it("should return div end tags", function () {
        expect(lineHeight.getDomEndTag())
                .toBe('</div>');
    });
    
    it("should match class the correct class string", function () {
        expect(lineHeight.matchesClassString("lineheight:12")).toBe(true);
        
        expect(lineHeight.matchesClassString(" lineheight:12 ")).toBe(true);
        
        expect(lineHeight.extractValueFromClassString(" lineheight:12 "))
                .toBe("12");
        
        expect(lineHeight.matchesClassString("linefasel:12")).toBe(false);
        
        expect(lineHeight.matchesClassString("lineheight: 34b")).toBe(false);
    });
    
    it("should return the correct css classes", function () {
        expect(lineHeight.getCssClasses(12)).toEqual(["lineheight:12"]);
    });
});  
