var Q = require('q'),
    moduleFactory = require('../module'),
    arrayUnique = require('../utils').arrayUnique;

/**
 * @param {Object} modulesOptions
 *
 * @constructor
 */
var ModuleCollection = function (modulesOptions) {
    this.modulesOptions = modulesOptions;
    this.modules = [];

    this.promise = null;
};
module.exports = ModuleCollection;

/**
 *
 * @param modulesRoot
 * @returns {Promise}
 */
ModuleCollection.prototype.globModules = function (modulesRoot) {
    return Q.resolve(this.modulesOptions);
};

/**
 * Loads all modules
 */
ModuleCollection.prototype.load = function (modulesRoot) {
    var self = this;
    // If promise already resolved - return as is
    if (this.promise) {
        return this.promise;
    }

    // Expand modules
    return this.promise = this.globModules(modulesRoot)
        .then(function (modulesOptions) {
            self.modules = [];
            // Construct modules
            Object.keys(modulesOptions).forEach(function (id) {
                self.modules.push(moduleFactory(id, modulesOptions[id]));
            });

            var promises = self.modules.map(function (moduleObject) {
                return moduleObject.load(modulesRoot);
            });

            return Q.allResolved(promises);
        })
        .then(function () {
            return self;
        });
};

/**
 *
 * @param {ModuleCollection} collection
 */
ModuleCollection.prototype.mergeWith = function (collection) {
    this.modules = this.modules.concat(collection.modules);
};

/**
 * Finds modules depends
 *
 * @param {String} defaultDependsMask
 *
 * @returns {Array}
 */
ModuleCollection.prototype.resolveModulesDepends = function (defaultDependsMask) {
    return this.modules.reduce(function (depends, moduleObject) {
        return depends.concat(moduleObject.resolveModulesDepends(defaultDependsMask));
    }, []);
};

ModuleCollection.prototype.collect = function (name) {
    return this.modules.reduce(function (collection, moduleObject) {
        collection.concat(moduleObject[name]);

        return collection;
    }, []);
};

ModuleCollection.prototype.collectUnique = function (name) {
    return arrayUnique(this.collect(name));
};

/**
 * @returns {Object}
 */
ModuleCollection.prototype.groupWarningsByModuleId = function () {
    return this.modules.reduce(function (collection, moduleObject) {
        collection[moduleObject.id] = moduleObject.warnings;

        return collection;
    }, {});
};

/**
 * @returns {Array}
 */
ModuleCollection.prototype.collectRequiredPlugins = function () {
    return this.collectUnique('requiredPlugins');
};

/**
 * @returns {Array}
 */
ModuleCollection.prototype.collectRequiredModules = function () {
    return this.collectUnique('requiredModules');
};
