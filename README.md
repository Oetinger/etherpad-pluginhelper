Takes over the job of representing attributes in the editor dom
This is necessary:

 * to apply styles to attributes in the editor (e.g. font properties) 
 * to prevent attributes from getting lost, due to the way etherpad works (see Internals below)

Usage
======
At first you have to define etherpad-pluginhelper as a dependency in your package.json.

package.json:
```
"dependencies": {
      // TODO change this when plugin has been made public
      "etherpad-pluginhelper": "git+ssh://git@github.com/Oe34/wr-etherpad-plugin-helper.git"
  }
```

You have to declare the hooks that the pluginhelper registers

ep.json:
```
    "client_hooks": {
        "aceDomLineProcessLineAttributes": "ep_<pluginname>/static/js/index",
        "aceAttribsToClasses": "ep_<pluginname>/static/js/index",
        "collectContentPre": "ep_<pluginname>/static/js/index",
        "aceRegisterBlockElements": "ep_<pluginname>/static/js/index"
    },
    "hooks" : {
        "expressCreateServer": "ep_<pluginname>/index.js"
    }
```

As npm modules are not available to the browser out of the box, the pluginhelper provides 
the following workaround:

index.js
```
var eejs = require('ep_etherpad-lite/node/eejs/');
var npmToClient = require('etherpad-pluginhelper/npmToClient');

exports.expressCreateServer = function(hook_name, args, cb){
    npmToClient.provideModule(<pluginname>, "etherpad-pluginhelper/AttributeDomRegistration", args.app, eejs);
};
```

Finally you define the Attributes you need in your application:

static/js/index.js:
```
var EtherpadDomHelper = require('./epDomHelper');
// register an inline attribute
EtherpadDomHelper.registerInlineAttribute(new InlineAttribute("my-font-property", {
    attributeValueRegex: /([a-z]+)/,
    cssMapper: function(value) {
        return 'font-family:"' + value;
    }
}));

// register a line attribute
EtherpadDomHelper.registerLineAttribute("paragraphStyle");

// register all needed hooks
EtherpadDomHelper.registerDomHooks(exports);
```

The second argument of the register*Attribute methods is optional and may provide the following fields:

* attributeValueRegex: a JavaScript regex object that defines what a valid value of your attribute has to look like
* cssMapper: a function that receives an attribute value and returns the style commands applied to the corresponding element in the editor
* domElement: a string that defines which dom element should be used representing the line attribute. Defaults to "div" for lineAttributes and "span" for inlineAttributes.


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


Testing
=========

```
sudo npm install -g jasmine

jasmine
```
