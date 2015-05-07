

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define(["jquery", "underscore"], function () {
            return factory(root.CDP || (root.CDP = {}));
        });
    }
    else {
        // Browser globals
        factory(root.CDP || (root.CDP = {}));
    }
}(this, function (CDP) {
    CDP.Tools = CDP.Tools || {};
    /**
 * @file  Utils.
 * @brief Tools 専用のユーティリティ
 */
var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        // cdp.tools は cdp.core に依存しないため、独自にglobal を提供する
        Tools.global = Tools.global || window;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));
var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.AsyncProc] ";
        /**
         * @class AsyncProc
         * @brief Web Worker と同一I/Fを提供する非同期処理クラス
         *        Web Worker が使用不可の環境でエミュレートするためのスーパークラス
         */
        var AsyncProc = (function () {
            function AsyncProc() {
                ///////////////////////////////////////////////////////////////////////
                // データメンバ
                this._canceled = false;
            }
            /**
             * 処理の開始
             *
             * @param msg [in] 処理に使用するパラメータを指定
             */
            AsyncProc.prototype.postMessage = function (message, ports) {
                this._canceled = false;
            };
            /**
             * 処理の中止
             */
            AsyncProc.prototype.terminate = function () {
                this._canceled = true;
            };
            ///////////////////////////////////////////////////////////////////////
            // オーバーライドメソッド
            /**
             * 一要素の処理
             *
             * @param element [in] 要素
             * @param info    [in] 付加情報
             */
            AsyncProc.prototype.onProcess = function (element, info) {
                console.warn(TAG + "onProcess(), need override this method.");
            };
            //! 終了処理ハンドラ(正常系)
            AsyncProc.prototype.onFinish = function (canceled, info) {
                console.warn(TAG + "onFinish(), need override this method.");
            };
            //! 終了処理ハンドラ(異常系)
            AsyncProc.prototype.onError = function (event, info) {
                console.warn(TAG + "onError(), need override this method.");
            };
            //! キャンセル判定
            AsyncProc.prototype.isCanceled = function () {
                return this._canceled;
            };
            AsyncProc.prototype.addEventListener = function (type, listener, useCapture) {
                console.warn(TAG + "AsyncProc.addEventListener() is not supported.");
            };
            AsyncProc.prototype.removeEventListener = function (type, listener, useCapture) {
                console.warn(TAG + "AsyncProc.removeEventListener() is not supported.");
            };
            AsyncProc.prototype.dispatchEvent = function (event) {
                console.warn(TAG + "AsyncProc.dispatchEvent() is not supported.");
                return false;
            };
            return AsyncProc;
        })();
        Tools.AsyncProc = AsyncProc;
        //___________________________________________________________________________________________________________________//
        /**
         * @class AsyncProcUtil
         * @brief 非同期処理の実装を提供するユーティリティクラス
         */
        var AsyncProcUtil = (function () {
            function AsyncProcUtil() {
            }
            /**
             * 配列を非同期処理する
             *
             * @param context   [in] 処理コンテキスト
             * @param array     [in] 処理対象の配列
             * @param params    [in] AsyncProcParam
             */
            AsyncProcUtil.asyncProcArray = function (context, array, params) {
                // 作業用コピーを作る
                var arrayWork = array.concat();
                var proc = function () {
                    var startTime = new Date(); // 開始時刻
                    if (context && context.isCanceled()) {
                        params.finishHandler.call(context, true, params.info);
                    }
                    try {
                        while (true) {
                            if (context && context.isCanceled()) {
                                params.finishHandler.call(context, true, params.info);
                            }
                            var current = arrayWork.shift();
                            // 配列を1要素処理する
                            params.processHandler.call(context, current, params.info);
                            if (arrayWork.length <= 0) {
                                // 全要素処理を行った -> 終了処理
                                params.finishHandler.call(context, false, params.info);
                                return;
                            }
                            // タイムアウト発生 -> 一旦処理を終わる
                            if (new Date().getTime() - startTime.getTime() > 100) {
                                break;
                            }
                        }
                        // Post して続きの処理を行う
                        setTimeout(proc, 0);
                    }
                    catch (e) {
                        params.errorHandler.call(context, e, params.info);
                    }
                };
                setTimeout(proc, 0);
            };
            return AsyncProcUtil;
        })();
        Tools.AsyncProcUtil = AsyncProcUtil;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));

var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.Blob] ";
        var Blob;
        (function (Blob) {
            /**
             * Get BlobBuilder
             *
             * @return {any} BlobBuilder
             */
            function getBlobBuilder() {
                return Tools.global.BlobBuilder || Tools.global.WebKitBlobBuilder || Tools.global.MozBlobBuilder || Tools.global.MSBlobBuilder;
            }
            /**
             * ArrayBuffer to Blob
             *
             * @param buf {ArrayBuffer} [in] ArrayBuffer data
             * @param mimeType {string} [in] MimeType of data
             * @return {Blob} Blob data
             */
            function arrayBufferToBlob(buf, mimeType) {
                var blob = null;
                var blobBuilderObject = getBlobBuilder();
                if (blobBuilderObject != null) {
                    var blobBuilder = new blobBuilderObject();
                    blobBuilder.append(buf);
                    blob = blobBuilder.getBlob(mimeType);
                }
                else {
                    // Android 4.4 KitKat Chromium WebView
                    blob = new Tools.global.Blob([buf], { type: mimeType });
                }
                return blob;
            }
            Blob.arrayBufferToBlob = arrayBufferToBlob;
            /**
             * Base64 string to Blob
             *
             * @param base64 {string} [in] Base64 string data
             * @param mimeType {string} [in] MimeType of data
             * @return {Blob} Blob data
             */
            function base64ToBlob(base64, mimeType) {
                var blob = null;
                var blobBuilderObject = getBlobBuilder();
                if (blobBuilderObject != null) {
                    var blobBuilder = new blobBuilderObject();
                    blobBuilder.append(base64ToArrayBuffer(base64));
                    blob = blobBuilder.getBlob(mimeType);
                }
                else {
                    // Android 4.4 KitKat Chromium WebView
                    blob = new Tools.global.Blob([base64ToArrayBuffer(base64)], { type: mimeType });
                }
                return blob;
            }
            Blob.base64ToBlob = base64ToBlob;
            /**
             * Base64 string to ArrayBuffer
             *
             * @param base64 {string} [in] Base64 string data
             * @return {ArrayBuffer} ArrayBuffer data
             */
            function base64ToArrayBuffer(base64) {
                var bytes = window.atob(base64);
                var arrayBuffer = new ArrayBuffer(bytes.length);
                var data = new Uint8Array(arrayBuffer);
                for (var i = 0, len = bytes.length; i < len; ++i) {
                    data[i] = bytes.charCodeAt(i);
                }
                return arrayBuffer;
            }
            Blob.base64ToArrayBuffer = base64ToArrayBuffer;
            /**
             * Base64 string to Uint8Array
             *
             * @param base64 {string} [in] Base64 string data
             * @return {Uint8Array} Uint8Array data
             */
            function base64ToUint8Array(encoded) {
                var bytes = window.atob(encoded);
                var data = new Uint8Array(bytes.length);
                for (var i = 0, len = bytes.length; i < len; ++i) {
                    data[i] = bytes.charCodeAt(i);
                }
                return data;
            }
            Blob.base64ToUint8Array = base64ToUint8Array;
            /**
             * ArrayBuffer to base64 string
             *
             * @param arrayBuffer {ArrayBuffer} [in] ArrayBuffer data
             * @return {string} base64 data
             */
            function arrayBufferToBase64(arrayBuffer) {
                var bytes = new Uint8Array(arrayBuffer);
                return this.uint8ArrayToBase64(bytes);
            }
            Blob.arrayBufferToBase64 = arrayBufferToBase64;
            /**
             * Uint8Array to base64 string
             *
             * @param bytes {Uint8Array} [in] Uint8Array data
             * @return {string} base64 data
             */
            function uint8ArrayToBase64(bytes) {
                var data = "";
                for (var i = 0, len = bytes.byteLength; i < len; ++i) {
                    data += String.fromCharCode(bytes[i]);
                }
                return window.btoa(data);
            }
            Blob.uint8ArrayToBase64 = uint8ArrayToBase64;
            /**
             * URL Object
             *
             * @return {any} URL Object
             */
            Blob.URL = (function () {
                return Tools.global.URL || Tools.global.webkitURL;
            })();
        })(Blob = Tools.Blob || (Tools.Blob = {}));
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));
/* tslint:disable:max-line-length */
var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.DateTime] ";
        /**
         * @class DateTime
         * @brief 時刻操作のユーティリティクラス
         */
        var DateTime = (function () {
            function DateTime() {
            }
            ///////////////////////////////////////////////////////////////////////
            // public static method
            /**
             * 基点となる日付から、n日後、n日前を算出
             *
             * @param base    {Date}   [in] 基準日
             * @param addDays {Number} [in] 加算日. マイナス指定でn日前も設定可能
             * @return {Date} 日付オブジェクト
             */
            DateTime.computeDate = function (base, addDays) {
                var dt = new Date(base.getTime());
                var baseSec = dt.getTime();
                var addSec = addDays * 86400000; //日数 * 1日のミリ秒数
                var targetSec = baseSec + addSec;
                dt.setTime(targetSec);
                return dt;
            };
            /**
             * Convert string to date object
             *
             * @param {String} date string ex) YYYY-MM-DDTHH:mm:SS.SSS
             * @return {Object} date object
             */
            DateTime.convertISOStringToDate = function (dateString) {
                var dateTime = dateString.split("T"), dateArray = dateTime[0].split("-"), timeArray, secArray, dateObject;
                if (dateTime[1]) {
                    timeArray = dateTime[1].split(":");
                    secArray = timeArray[2].split(".");
                }
                if (timeArray) {
                    dateObject = new Date(dateArray[0], dateArray[1] - 1, dateArray[2], timeArray[0], timeArray[1], secArray[0], secArray[1]);
                }
                else {
                    if (dateArray[2]) {
                        dateObject = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
                    }
                    else if (dateArray[1]) {
                        dateObject = new Date(dateArray[0], dateArray[1] - 1);
                    }
                    else {
                        dateObject = new Date(dateArray[0]);
                    }
                }
                return dateObject;
            };
            /**
             *  Convert a date object into a string in PMOAPI recorded_date format(the ISO 8601 Extended Format)
             *
             * @param date   {Date}   [in] date object
             * @param target {String} [in] {year | month | date | hour | min | sec | msec }
             * @return {String}
             */
            DateTime.convertDateToISOString = function (date, target) {
                if (target === void 0) { target = "msec"; }
                var isoDateString;
                switch (target) {
                    case "year":
                    case "month":
                    case "date":
                    case "hour":
                    case "min":
                    case "sec":
                    case "msec":
                        break;
                    default:
                        console.warn(TAG + "unknown target: " + target);
                        target = "msec";
                }
                isoDateString = date.getFullYear();
                if ("year" === target) {
                    return isoDateString;
                }
                isoDateString += ("-" + DateTime.numberToDoubleDigitsString(date.getMonth() + 1));
                if ("month" === target) {
                    return isoDateString;
                }
                isoDateString += ("-" + DateTime.numberToDoubleDigitsString(date.getDate()));
                if ("date" === target) {
                    return isoDateString;
                }
                isoDateString += ("T" + DateTime.numberToDoubleDigitsString(date.getHours()));
                if ("hour" === target) {
                    return isoDateString;
                }
                isoDateString += (":" + DateTime.numberToDoubleDigitsString(date.getMinutes()));
                if ("min" === target) {
                    return isoDateString;
                }
                isoDateString += (":" + DateTime.numberToDoubleDigitsString(date.getSeconds()));
                if ("sec" === target) {
                    return isoDateString;
                }
                isoDateString += ("." + String((date.getMilliseconds() / 1000).toFixed(3)).slice(2, 5));
                return isoDateString;
            };
            /**
             * Convert file system compatible string to date object
             *
             * @param {String} date string ex) yyyy_MM_ddTHH_mm_ss_SSS
             * @return {Object} date object
             */
            DateTime.convertFileSystemStringToDate = function (dateString) {
                var dateTime = dateString.split("T"), dateArray = dateTime[0].split("_"), timeArray, secArray, dateObject;
                if (dateTime[1]) {
                    timeArray = dateTime[1].split("_");
                }
                if (timeArray) {
                    dateObject = new Date(dateArray[0], dateArray[1] - 1, dateArray[2], timeArray[0], timeArray[1], timeArray[2], timeArray[3]);
                }
                else {
                    if (dateArray[2]) {
                        dateObject = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
                    }
                    else if (dateArray[1]) {
                        dateObject = new Date(dateArray[0], dateArray[1] - 1);
                    }
                    else {
                        dateObject = new Date(dateArray[0]);
                    }
                }
                return dateObject;
            };
            /**
             *  Convert a date object into a string in file system compatible format(yyyy_MM_ddTHH_mm_ss_SSS)
             *
             * @param date   {Date}   [in] date object
             * @param target {String} [in] {year | month | date | hour | min | sec | msec }
             * @return {String}
             */
            DateTime.convertDateToFileSystemString = function (date, target) {
                if (target === void 0) { target = "msec"; }
                var fileSystemString;
                switch (target) {
                    case "year":
                    case "month":
                    case "date":
                    case "hour":
                    case "min":
                    case "sec":
                    case "msec":
                        break;
                    default:
                        console.warn(TAG + "unknown target: " + target);
                        target = "msec";
                }
                fileSystemString = date.getFullYear();
                if ("year" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("_" + DateTime.numberToDoubleDigitsString(date.getMonth() + 1));
                if ("month" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("_" + DateTime.numberToDoubleDigitsString(date.getDate()));
                if ("date" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("T" + DateTime.numberToDoubleDigitsString(date.getHours()));
                if ("hour" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("_" + DateTime.numberToDoubleDigitsString(date.getMinutes()));
                if ("min" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("_" + DateTime.numberToDoubleDigitsString(date.getSeconds()));
                if ("sec" === target) {
                    return fileSystemString;
                }
                fileSystemString += ("_" + String((date.getMilliseconds() / 1000).toFixed(3)).slice(2, 5));
                return fileSystemString;
            };
            ///////////////////////////////////////////////////////////////////////
            // private static method
            /**
             * Convert num to string(double digits)
             *
             * @param  {Number} number (0 <number < 100)
             * @return {String} double digits string
             */
            DateTime.numberToDoubleDigitsString = function (num) {
                if (num < 0 || num > 100) {
                    return null;
                }
                if (num < 10) {
                    return "0" + num;
                }
                return "" + num;
            };
            return DateTime;
        })();
        Tools.DateTime = DateTime;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));


/*jshint multistr: true */
var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.Functions] ";
        /**
         * Math.abs よりも高速な abs
         */
        function abs(x) {
            return x >= 0 ? x : -x;
        }
        Tools.abs = abs;
        /**
         * Math.max よりも高速な max
         */
        function max(lhs, rhs) {
            return lhs >= rhs ? lhs : rhs;
        }
        Tools.max = max;
        /**
         * Math.min よりも高速な min
         */
        function min(lhs, rhs) {
            return lhs <= rhs ? lhs : rhs;
        }
        Tools.min = min;
        /**
         * condition() が true を返すまで deferred
         */
        function await(condition, msec) {
            if (msec === void 0) { msec = 0; }
            var df = $.Deferred();
            var proc = function () {
                if (!condition()) {
                    setTimeout(proc, msec);
                }
                else {
                    df.resolve();
                }
            };
            setTimeout(proc, msec);
            return df.promise();
        }
        Tools.await = await;
        /**
         * 数値を 0 詰めして文字列を生成
         */
        function toZeroPadding(no, limit) {
            var signed = "";
            no = Number(no);
            if (isNaN(no) || isNaN(limit) || limit <= 0) {
                return null;
            }
            if (no < 0) {
                no = Tools.abs(no);
                signed = "-";
            }
            return signed + (Array(limit).join("0") + no).slice(-limit);
        }
        Tools.toZeroPadding = toZeroPadding;
        /**
         * 多重継承のための実行時継承関数
         *
         * Sub Class 候補オブジェクトに対して Super Class 候補オブジェクトを直前の Super Class として挿入する。
         * prototype のみコピーする。
         * インスタンスメンバをコピーしたい場合、Super Class が疑似コンストラクタを提供する必要がある。
         * 詳細は cdp.tools.Functions.spec.ts を参照。
         *
         * @param subClass   {constructor} [in] オブジェクトの constructor を指定
         * @param superClass {constructor} [in] オブジェクトの constructor を指定
         */
        function inherit(subClass, superClass) {
            var _prototype = subClass.prototype;
            function _inherit() {
                this.constructor = subClass;
            }
            _inherit.prototype = superClass.prototype;
            subClass.prototype = new _inherit();
            $.extend(subClass.prototype, _prototype);
        }
        Tools.inherit = inherit;
        /**
         * mixin 関数
         *
         * TypeScript Official Site に載っている mixin 関数
         * http://www.typescriptlang.org/Handbook#mixins
         * 既に定義されているオブジェクトから、新規にオブジェクトを合成する。
         *
         * @param derived {constructor}    [in] 合成されるオブジェクトの constructor を指定
         * @param bases   {constructor...} [in] 合成元オブジェクトの constructor を指定 (可変引数)
         */
        function mixin(derived) {
            var bases = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                bases[_i - 1] = arguments[_i];
            }
            bases.forEach(function (base) {
                Object.getOwnPropertyNames(base.prototype).forEach(function (name) {
                    derived.prototype[name] = base.prototype[name];
                });
            });
        }
        Tools.mixin = mixin;
        /**
         * DPI 取得
         */
        function getDevicePixcelRatio() {
            var mediaQuery;
            var is_firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
            if (null != window.devicePixelRatio && !is_firefox) {
                return window.devicePixelRatio;
            }
            else if (window.matchMedia) {
                mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
					(min--moz-device-pixel-ratio: 1.5),\
					(-o-min-device-pixel-ratio: 3/2),\
					(min-resolution: 1.5dppx)";
                if (window.matchMedia(mediaQuery).matches) {
                    return 1.5;
                }
                mediaQuery = "(-webkit-min-device-pixel-ratio: 2),\
					(min--moz-device-pixel-ratio: 2),\
					(-o-min-device-pixel-ratio: 2/1),\
					(min-resolution: 2dppx)";
                if (window.matchMedia(mediaQuery).matches) {
                    return 2;
                }
                mediaQuery = "(-webkit-min-device-pixel-ratio: 0.75),\
					(min--moz-device-pixel-ratio: 0.75),\
					(-o-min-device-pixel-ratio: 3/4),\
					(min-resolution: 0.75dppx)";
                if (window.matchMedia(mediaQuery).matches) {
                    return 0.7;
                }
            }
            else {
                return 1;
            }
        }
        Tools.getDevicePixcelRatio = getDevicePixcelRatio;
        function doWork(worker, msg) {
            var df = $.Deferred();
            if (!worker) {
                return df.reject("null argument");
            }
            var wk;
            switch (typeof worker) {
                case "object":
                    wk = worker;
                    break;
                case "string":
                    try {
                        wk = new Worker(worker);
                    }
                    catch (ex) {
                        console.error(TAG + ex);
                        return df.reject(ex);
                    }
                    break;
                default:
                    return df.reject("invalid type argument");
            }
            wk.onerror = function (error) { return df.reject(error); };
            wk.onmessage = function (event) { return df.resolve(event.data); };
            wk.postMessage(msg);
            return df.promise();
        }
        Tools.doWork = doWork;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));

/* tslint:disable:max-line-length */
var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.Promise] ";
        /**
         * Promise オブジェクトの作成
         * jQueryDeferred オブジェクトから、Tools.Promise オブジェクトを作成する
         *
         * @param df {JQueryDeferred} [in] jQueryDeferred instance を指定
         * @param options? {Object}   [in] jQueryPromise を拡張するオブジェクトを指定
         * @return {IPromise} Tools.IPromise オブジェクト
         */
        function makePromise(df, options) {
            var _abort = function (info) {
                var detail = info ? info : { message: "abort" };
                if (null != this.dependency) {
                    if (this.dependency.abort) {
                        this.dependency.abort(detail);
                    }
                    else {
                        console.error(TAG + "[call] dependency object doesn't have 'abort()' method.");
                    }
                    if (this.callReject && "pending" === this.state()) {
                        df.reject(detail);
                    }
                }
                else if ("pending" === this.state()) {
                    df.reject(detail);
                }
            };
            var _dependOn = function (promise) {
                var _this = this;
                if (promise.abort) {
                    this.dependency = promise;
                    promise.always(function () {
                        _this.dependency = null;
                    });
                }
                else {
                    console.error(TAG + "[set] dependency object doesn't have 'abort()' method.");
                }
                return promise;
            };
            var target = $.extend({}, {
                dependency: null,
                callReject: false,
            }, options);
            var promise = df.promise(target);
            if (null == promise.abort) {
                promise.abort = _abort.bind(promise);
            }
            if (null == promise.dependOn) {
                promise.dependOn = _dependOn.bind(promise);
            }
            return promise;
        }
        Tools.makePromise = makePromise;
        function wait() {
            var deferreds = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                deferreds[_i - 0] = arguments[_i];
            }
            // 投入法が可変引数だった場合は配列に修正する
            var _deferreds = _.flatten(deferreds);
            // 実際の作業
            var df = $.Deferred();
            var results = [];
            var initialized = false;
            var isFinished = function () {
                if (!initialized) {
                    return false;
                }
                else {
                    return !_.some(results, function (element) {
                        return "pending" === element.status;
                    });
                }
            };
            _deferreds.forEach(function (deferred, index) {
                results.push({
                    status: "pending",
                    args: null,
                });
                deferred.then(function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    results[index].status = "resolved";
                    results[index].args = args;
                }, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    results[index].status = "rejected";
                    results[index].args = args;
                }).always(function () {
                    if (isFinished()) {
                        df.resolve(results);
                    }
                });
            });
            initialized = true;
            if (isFinished()) {
                df.resolve(results);
            }
            return df.promise();
        }
        Tools.wait = wait;
        /**
         * @class PromiseManager
         * @brief 複数の DataProvider.Promise を管理するクラス
         */
        var PromiseManager = (function () {
            function PromiseManager() {
                this._pool = [];
                this._id = 0;
            }
            PromiseManager.prototype.add = function (promise) {
                var _this = this;
                if (promise == null) {
                    return null;
                }
                // abort() を持っていない場合はエラー
                if (!promise.abort) {
                    console.error(TAG + "[add] promise object doesn't have 'abort()' method.");
                    return promise;
                }
                var cookie = {
                    promise: promise,
                    id: this._id++,
                };
                this._pool.push(cookie);
                promise.always(function () {
                    _this._pool = _.reject(_this._pool, function (element) {
                        if (element.id === cookie.id) {
                            return true;
                        }
                        return false;
                    });
                });
                return promise;
            };
            /**
             * 管理対象の Promise に対して abort を発行
             * キャンセル処理に対するキャンセルは不可
             *
             * @return {jQueryPromise}
             */
            PromiseManager.prototype.cancel = function (info) {
                var promises = this.promises();
                _.each(promises, function (element) {
                    if (element.abort) {
                        element.abort(info);
                    }
                });
                return wait.apply(null, promises);
            };
            /**
             * 管理対象の Promise を配列で返す
             *
             * @return {Promise[]}
             */
            PromiseManager.prototype.promises = function () {
                return _.pluck(this._pool, "promise");
            };
            return PromiseManager;
        })();
        Tools.PromiseManager = PromiseManager;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));



var CDP;
(function (CDP) {
    var Tools;
    (function (Tools) {
        var TAG = "[CDP.Tools.Template] ";
        //___________________________________________________________________________________________________________________//
        /**
         * @class Template
         * @brief template script を管理するユーティリティクラス
         */
        var Template = (function () {
            function Template() {
            }
            ///////////////////////////////////////////////////////////////////////
            // 公開メソッド
            /**
             * 指定した id, class 名, Tag 名をキーにテンプレートの JQuery Element を取得する。
             *
             * @param key [in] id, class, tag を表す文字列
             * @param src [in] 外部 html を指定する場合は url を設定
             * @return template が格納されている JQuery Element
             */
            Template.getTemplateElement = function (key, src) {
                var mapElement = Template.getElementMap();
                var $element = mapElement[key];
                try {
                    if (!$element) {
                        if (src) {
                            var html = Template.findHtmlFromSource(src);
                            $element = $(html).find(key);
                        }
                        else {
                            $element = $(key);
                        }
                        // 要素の検証
                        if ($element <= 0) {
                            throw ("invalid [key, src] = [" + key + ", " + src + "]");
                        }
                        mapElement[key] = $element;
                    }
                }
                catch (exception) {
                    console.error(TAG + exception);
                    return null;
                }
                return $element;
            };
            /**
             * Map オブジェクトの削除
             * 明示的にキャッシュを開放する場合は本メソッドをコールする
             */
            Template.empty = function () {
                Template._mapElement = null;
                Template._mapSource = null;
            };
            /**
             * 指定した id, class 名, Tag 名をキーに JST を取得する。
             *
             * @param key [in] id, class, tag を表す文字列
             * @param src [in] 外部 html を指定する場合は url を設定
             * @return コンパイルされた JST オブジェクト
             */
            Template.getJST = function (key, src) {
                var $element = this.getTemplateElement(key, src);
                var template = null;
                var jst;
                if (null != Tools.global.Hogan) {
                    template = Hogan.compile($element.text());
                    jst = function (data) {
                        return template.render(data);
                    };
                }
                else {
                    template = _.template($element.html());
                    jst = function (data) {
                        // 改行とタブは削除する
                        return template(data).replace(/\n|\t/g, "");
                    };
                }
                return jst;
            };
            ///////////////////////////////////////////////////////////////////////
            // 内部メソッド
            //! Element Map オブジェクトの取得
            Template.getElementMap = function () {
                if (!Template._mapElement) {
                    Template._mapElement = {};
                }
                return Template._mapElement;
            };
            //! URL Map オブジェクトの取得
            Template.getSourceMap = function () {
                if (!Template._mapSource) {
                    Template._mapSource = {};
                }
                return Template._mapSource;
            };
            //! URL Map から HTML を検索. 失敗した場合は undefined が返る
            Template.findHtmlFromSource = function (src) {
                var mapSource = Template.getSourceMap();
                var html = mapSource[src];
                if (!html) {
                    $.ajax({
                        url: src,
                        method: "GET",
                        async: false,
                        dataType: "html",
                        success: function (data) {
                            html = data;
                        },
                        error: function (data, status) {
                            throw ("ajax request failed. status: " + status);
                        }
                    });
                    // キャッシュに格納
                    mapSource[src] = html;
                }
                return html;
            };
            return Template;
        })();
        Tools.Template = Template;
    })(Tools = CDP.Tools || (CDP.Tools = {}));
})(CDP || (CDP = {}));

    return CDP.Tools;
}));
