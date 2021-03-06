/*!
 * Social-api-import v0.2.0
 * https://npm.com/social-api-import
 *
 * Copyright (c) 2018 Mark Kennedy
 * Licensed under the MIT license
 */

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter$1(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function ensurePathArray(paths) {
    if (!paths) {
        paths = [];
    }
    else if (typeof paths === 'string') {
        paths = [paths];
    }
    return paths;
}
const head = document.getElementsByTagName('head')[0];
const scriptMaps = {};
const script = {
    import(paths) {
        return __awaiter$1(this, void 0, void 0, function* () {
            let map;
            const loadPromises = [];
            paths = ensurePathArray(paths);
            paths.forEach((path) => {
                map = scriptMaps[path] = scriptMaps[path] || {};
                if (!map.promise) {
                    map.path = path;
                    map.promise = new Promise((resolve) => {
                        const scriptElement = document.createElement('script');
                        scriptElement.setAttribute('type', 'text/javascript');
                        scriptElement.src = path;
                        scriptElement.addEventListener('load', resolve);
                        head.appendChild(scriptElement);
                    });
                }
                loadPromises.push(map.promise);
            });
            return Promise.all(loadPromises);
        });
    },
    unload(paths) {
        return __awaiter$1(this, void 0, void 0, function* () {
            let file;
            return new Promise((resolve) => {
                paths = ensurePathArray(paths);
                paths.forEach((path) => {
                    file = head.querySelectorAll('script[src="' + path + '"]')[0];
                    if (file) {
                        head.removeChild(file);
                        delete scriptMaps[path];
                    }
                });
                resolve();
            });
        });
    }
};

const loadedScripts = [];
class BaseApi {
    constructor(options = {}) {
        if (options.apiVersion) {
            console.warn(`"apiVersion" has been deprecated, please use the "version" option`);
            options.version = options.apiVersion + '';
        }
        this.options = options;
    }
    destroy() {
        if (!this.script)
            return;
        const idx = loadedScripts.indexOf(this.script);
        loadedScripts.splice(idx, 1);
        if (this.script && loadedScripts.indexOf(this.script) <= -1) {
            script.unload(this.script);
        }
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.loadApiListenerPromiseMap) {
                this.loadApiListenerPromiseMap = this.handleLoadApi(this.options);
            }
            return this.loadApiListenerPromiseMap;
        });
    }
    login(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                accessToken: '',
                accessTokenSecret: '',
                userId: '',
                expiresAt: Date.now()
            };
        });
    }
    loadScript(path) {
        this.script = path;
        loadedScripts.push(this.script);
        return script.import(this.script);
    }
    handleLoadApi(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    static get id() {
        return 'base-api';
    }
}

const PERMISSIONS_MAP = {
    createPosts: ['publish_actions'],
    readPosts: ['user_posts'],
    updatePosts: ['publish_actions'],
    deletePosts: ['publish_actions'],
    readProfile: ['public_profile', 'user_about_me', 'user_birthday', 'user_location', 'user_work_history'],
    readFriendProfiles: ['user_friends']
};
class Facebook extends BaseApi {
    constructor(options) {
        super(options);
        if (options.version) {
            options.version = !options.version.startsWith('v') ? 'v' + options.version : options.version;
        }
        options.xfbml = options.xfbml || true;
        this.options = options;
    }
    login(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.load();
            const buildScope = () => {
                options.permissions = options.permissions || [];
                return options.permissions.reduce((prev = '', perm) => {
                    const values = PERMISSIONS_MAP[perm] || [];
                    return values.reduce((p, value) => {
                        const delimiter = prev ? ',' : '';
                        let str = value || '';
                        if (prev.indexOf(value || '') === -1) {
                            str = `${delimiter}${value}`;
                            return (prev += str);
                        }
                        else {
                            return prev;
                        }
                    }, prev);
                }, '');
            };
            options.scope = options.scope || buildScope();
            return new Promise(resolve => {
                this.FB.login((response) => {
                    if (response.authResponse) {
                        // authorized!
                        resolve({
                            accessToken: response.authResponse.accessToken,
                            userId: response.authResponse.userID,
                            expiresAt: response.authResponse.expiresIn
                        });
                    }
                    else {
                        // User either abandoned the login flow or,
                        // for some other reason, did not fully authorize
                        resolve({});
                    }
                }, options);
            });
        });
    }
    static get id() {
        return 'facebook';
    }
    destroy() {
        delete window.fbAsyncInit;
        return super.destroy();
    }
    handleLoadApi() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                window.fbAsyncInit = () => {
                    FB.init(this.options);
                    this.FB = FB;
                    resolve(FB);
                };
                this.loadScript('https://connect.facebook.net/en_US/sdk.js');
            });
        });
    }
}

export default Facebook;
