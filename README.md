Takes over the job of representing attributes in the editor dom
This is necessary:

 * to apply styles to attributes in the editor (e.g. font properties) 
 * to prevent attributes from getting lost, due to the way etherpad works (see Internals below)

Usage
======

```
var EtherpadDomHelper = require('./epDomHelper');
// register an inline attribute
EtherpadDomHelper.registerInlineAttribute({
    attributeName: "my-font-property",
    cssClassRegex: /my-font-property-([a-z]+)/,
    cssMapper: function(value) {
        return 'style="font-family:"' + value + '"';
    }
});
// register a line attribute
EtherpadDomHelper.registerLineAttribute("paragraphStyle");

// register all needed hooks
EtherpadDomHelper.registerDomHooks(exports);
```

Internals
=======

This explains how etherpad works.

When applying attributes in a plugin by the documentAttributeManager, 
these attributes are written to the database. 

To a newbie this seems to be enough to store attributes, 
but you will experience, that these attributes get occasionally lost while you
continue editing the text. 
 
When editing text, etherpad collects the content of the edited line from the editor
and calls the hook "collectContentPre" for every dom node. As a developer it's up to you to 
implement the hook and care to preserve the attribute calling the method cc.doAttrib()
after inspecting the classes of the current dom node.

So on the one hand you have to think about mapping your attributes to css classes 
and eventually style attributes, when the editor dom is rendered. For this purpose, 
implement the hooks "aceCreateDomLine", "aceDomLineProcessLineAttributes", 
"aceAttribsToClasses", "aceRegisterBlockElements". 

On the other hand you have to restore the attribute values from these classes as described.

This module takes over this job for you and enables you to focus on implementing 
the actual business logic of your plugin.
