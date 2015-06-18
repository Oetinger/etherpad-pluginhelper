var AttributeDomRegistration = require('../src/AttributeDomRegistration');

var LineAttribute = AttributeDomRegistration.LineAttribute;
var InlineAttribute = AttributeDomRegistration.InlineAttribute;


describe("domRegistration", function () {
    
    it("should register attributes and apply hooks", function() {
        var attributeDomRegistration = new AttributeDomRegistration();
        
        // before
        attributeDomRegistration.registerInlineAttribute(new InlineAttribute("font-size", {cssMapper: function(value){ return "font-size:"+value+"px";}}));
        attributeDomRegistration.registerLineAttribute(new LineAttribute("lineHeight", {cssMapper: function(value){ return "lineHeight:"+value+"px";}}));
        
        var hooks = {};
        
        var ccContextInline = { 
            cls: "font-size-12",
            tname: "span",
            state: { lineAttributes : {}},
            cc: { doAttrib: function(){} }
        };
        var ccContextLine = { 
            cls: "lineheight:12",
            tname: "div",
            state: { lineAttributes : {}}
        };
        
        spyOn(ccContextInline.cc, 'doAttrib');
        
        // when
        attributeDomRegistration.registerDomHooks(hooks);
        
        
        
        // verify
        expect(hooks.aceRegisterBlockElements).not.toBe(null);
        expect(hooks.aceAttribsToClasses).not.toBe(null);
        expect(hooks.aceDomLineProcessLineAttributes).not.toBe(null);
        expect(hooks.aceCreateDomLine).not.toBe(null);
        expect(hooks.collectContentPre).not.toBe(null);
        
        expect(hooks.aceRegisterBlockElements()).toEqual(["div"]);
        expect(hooks.aceAttribsToClasses("",{key: "font-size", value:12})).toEqual(["font-size", "font-size-12"]);
        expect(hooks.aceAttribsToClasses("",{key: "lineHeight", value:12})).toEqual(["lineheight:12"]);
        expect(hooks.aceDomLineProcessLineAttributes("",{cls: "lineheight:12"})).toEqual([{
               preHtml: '<div class="lineheight:12" style="lineHeight:12px">',
               postHtml: '</div>',
               processedMarker: true
        }]);
        expect(hooks.aceDomLineProcessLineAttributes("",{cls: "fontsize:12"})).toEqual([]);
        
        expect(hooks.aceCreateDomLine("",{cls: "font-size-12"})).toEqual([{
            extraOpenTags: '<span style="font-size:12px">',
            extraCloseTags: '</span>',
            cls: "font-size-12"
        }]);
    
    
        // when
        hooks.collectContentPre("", ccContextInline);
        // verify
        expect(ccContextInline.cc.doAttrib).toHaveBeenCalledWith({ lineAttributes : {}}, "font-size::12");

    
        // when
        hooks.collectContentPre("", ccContextLine);
        // verify
        expect(ccContextLine.state.lineAttributes).toEqual({lineHeight:"12"});
        
        
    });
        
});
