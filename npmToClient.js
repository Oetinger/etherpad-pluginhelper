/**
 * provides dependencies installed in the node_modules folder to the client side
 * Example:
 * 
 * exports.expressCreateServer = function (hook_name, args, cb) {
      provideModule("my-plugin", "node-uuid/uuid", args.app, eejs);
   };
 * 
 * @param {String} pluginname plugin that requires the dependency
 * @param {String} modulename name of the required module
 * @param {Object} expressjs app-object
 */
exports.provideModule = function(pluginname, modulename, app, eejs) {
    // Path where to lookup the required file
    var pathInPluginFolder = require.resolve(modulename);
    // remove unnecessary parts of path
    pathInPluginFolder = pathInPluginFolder.substr(pathInPluginFolder.indexOf('/etherpad/node_modules/') + 23);
    
    var filename = modulename + ".js";
    // Path used to require the module in client side modules, e.g. require("my-plugin/my-module/my-module.js")
    var requirePath = pluginname + '/' + filename;
    // url (host relative) that delivers the required file
    var url = '/javascripts/lib/' + requirePath;
    
    
    var wrappedContent = _getJsForBrowser(pathInPluginFolder, requirePath, eejs);
    console.log("make module " + modulename + " available at " + url);
    _registerUrlForModule(app, url, wrappedContent);
};


function _getJsForBrowser(filePath, requirePath, eejs) {
    var jsSource = eejs.require(filePath, {});
    var wrappedContent = _wrapJsContentWithRequire(requirePath, jsSource);
    return wrappedContent;
}


function _registerUrlForModule(app, path, content) {
    app.get(path, function(req, res, next) {
        res.contentType('application/javascript');
        res.send(content);
    });
}


function _wrapJsContentWithRequire(modulepath, jsSource) {
    var requirePrefix = 'require.define({\n\
  "' + modulepath + '": function (require, exports, module) {';
    var requireSuffix = '}});';
    var wrappedContent = requirePrefix + jsSource + requireSuffix;
    return wrappedContent;
}
