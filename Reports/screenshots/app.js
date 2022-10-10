var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should greet the named user|angularjs homepage",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7900,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006a0006-0020-002e-00fa-0092008f004b.png",
        "timestamp": 1664269565609,
        "duration": 2053
    },
    {
        "description": "should list todos|todo list|angularjs homepage",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7900,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00150087-000a-00ea-00be-001400710009.png",
        "timestamp": 1664269567867,
        "duration": 1171
    },
    {
        "description": "should add a todo|todo list|angularjs homepage",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7900,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001c00da-0030-002b-0056-00eb00e60043.png",
        "timestamp": 1664269569181,
        "duration": 1426
    },
    {
        "description": "Vijaysals login|A suite is just a function",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 13932,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=105.0.5195.127)\n  (Driver info: chromedriver=105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853}),platform=Windows NT 10.0.19044 x86_64)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=105.0.5195.127)\n  (Driver info: chromedriver=105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853}),platform=Windows NT 10.0.19044 x86_64)\n    at Object.checkLegacyResponse (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:461:65\n    at ManagedPromise.invokeCallback_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at loginpage1.email (D:\\Protractorframework\\Locator\\VijaysalespageObj.js:64:12)\n    at UserContext.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:42:19)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Vijaysals login\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:10:5)\n    at addSpecsToSuite (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:9:1)\n    at Module._compile (node:internal/modules/cjs/loader:1105:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)\n    at Module.load (node:internal/modules/cjs/loader:981:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:822:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270698531,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270701022,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270702069,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270702801,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270703352,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:37501 \"[Meta Pixel] - You are sending a non-standard event 'ViewCategory'. The preferred way to send these events is using trackCustom. See 'https://developers.facebook.com/docs/ads-for-websites/pixel-events/#events' for more information.\"",
                "timestamp": 1664270703801,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270703914,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270703916,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270704914,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270706135,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270706147,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270707201,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270708246,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 263:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270708785,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 234:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270708896,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270709060,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270711900,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270712414,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270713011,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.lb.en.z9QjrzsHcOc.O/m=client/rt=j/sv=1/d=1/ed=1/rs=AHpOoo8359JQqZQ0dzCVJ5Ui3CZcERHEWA/cb=gapi.loaded_0?le=scs 586:208 \"Your client application uses libraries for user authentication or authorization that will soon be deprecated. See the [Migration Guide](https://developers.google.com/identity/gsi/web/guides/gis-migration) for more information.\"",
                "timestamp": 1664270713409,
                "type": ""
            }
        ],
        "screenShotFile": "00b3004f-00f8-00b6-00e1-007500eb0049.png",
        "timestamp": 1664270698158,
        "duration": 15270
    },
    {
        "description": "Vijaysals login|A suite is just a function",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11780,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=105.0.5195.127)\n  (Driver info: chromedriver=105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853}),platform=Windows NT 10.0.19044 x86_64)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=105.0.5195.127)\n  (Driver info: chromedriver=105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853}),platform=Windows NT 10.0.19044 x86_64)\n    at Object.checkLegacyResponse (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\nFrom: Task: WebElement.sendKeys()\n    at Driver.schedule (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:461:65\n    at ManagedPromise.invokeCallback_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at loginpage1.email (D:\\Protractorframework\\Locator\\VijaysalespageObj.js:64:12)\n    at UserContext.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:42:19)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Vijaysals login\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:10:5)\n    at addSpecsToSuite (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\Protractorframework\\Testcase\\Smoke\\Vijaysales_loginSpec.js:9:1)\n    at Module._compile (node:internal/modules/cjs/loader:1105:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)\n    at Module.load (node:internal/modules/cjs/loader:981:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:822:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270753508,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270754612,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270755543,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270756200,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270756741,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:37501 \"[Meta Pixel] - You are sending a non-standard event 'ViewCategory'. The preferred way to send these events is using trackCustom. See 'https://developers.facebook.com/docs/ads-for-websites/pixel-events/#events' for more information.\"",
                "timestamp": 1664270757445,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270757470,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270757523,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270758835,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270759688,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270759782,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270760554,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270760971,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 259:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270761454,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 234:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270761617,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270761617,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270761866,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 259:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270762259,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 234:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664270762260,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270762523,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270765147,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664270765770,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664270766366,
                "type": ""
            }
        ],
        "screenShotFile": "005a00db-00d1-0020-0062-00e900d900fd.png",
        "timestamp": 1664270753171,
        "duration": 13561
    },
    {
        "description": "Vijaysals login|A suite is just a function",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 3156,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\RBT\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)"
        ],
        "browserLogs": [],
        "timestamp": 1664276330394,
        "duration": 60095
    },
    {
        "description": "Vijaysals login|A suite is just a function",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8196,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664276998413,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664276999465,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277000676,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277001172,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277001896,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:37501 \"[Meta Pixel] - You are sending a non-standard event 'ViewCategory'. The preferred way to send these events is using trackCustom. See 'https://developers.facebook.com/docs/ads-for-websites/pixel-events/#events' for more information.\"",
                "timestamp": 1664277002375,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277002466,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277002492,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277004729,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277005634,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277005658,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277006559,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277006942,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 259:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664277007319,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 234:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664277007503,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277007625,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277008913,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 259:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664277009257,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 234:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664277009314,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277009540,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277012579,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277013152,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277013857,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.lb.en.z9QjrzsHcOc.O/m=client/rt=j/sv=1/d=1/ed=1/rs=AHpOoo8359JQqZQ0dzCVJ5Ui3CZcERHEWA/cb=gapi.loaded_0?le=scs 586:208 \"Your client application uses libraries for user authentication or authorization that will soon be deprecated. See the [Migration Guide](https://developers.google.com/identity/gsi/web/guides/gis-migration) for more information.\"",
                "timestamp": 1664277014338,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277018098,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664277018508,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664277019180,
                "type": ""
            }
        ],
        "screenShotFile": "00fd00c4-0074-00a9-00a0-0028006d0013.png",
        "timestamp": 1664276997695,
        "duration": 21513
    },
    {
        "description": "Vijaysals login|A suite is just a function",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7088,
        "browser": {
            "name": "chrome",
            "version": "105.0.5195.127"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358679939,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358681505,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358682323,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358683035,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358683943,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:37501 \"[Meta Pixel] - You are sending a non-standard event 'ViewCategory'. The preferred way to send these events is using trackCustom. See 'https://developers.facebook.com/docs/ads-for-websites/pixel-events/#events' for more information.\"",
                "timestamp": 1664358684717,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358684788,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358684848,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358686683,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358687985,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358687990,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://d2xamzlzrdbdbn.cloudfront.net/combinedJS/ProductPageRevised_combinedJS_vijaysales_7685.js 3:200239 Uncaught ReferenceError: let is not defined",
                "timestamp": 1664358688788,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358689195,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://d2xamzlzrdbdbn.cloudfront.net/combinedJS/ProductPageRevised_combinedJS_vijaysales_7685.js 3:203291 Uncaught ReferenceError: let is not defined",
                "timestamp": 1664358689298,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358689992,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-KCMXDXV 262:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664358690663,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtag/js?id=G-PMVQ2KVSK3&l=dataLayer&cx=c 237:75 Uncaught TypeError: a is not a function",
                "timestamp": 1664358690664,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358691055,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358693959,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358694822,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358695880,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.lb.en.z9QjrzsHcOc.O/m=client/rt=j/sv=1/d=1/ed=1/rs=AHpOoo8359JQqZQ0dzCVJ5Ui3CZcERHEWA/cb=gapi.loaded_0?le=scs 586:208 \"Your client application uses libraries for user authentication or authorization that will soon be deprecated. See the [Migration Guide](https://developers.google.com/identity/gsi/web/guides/gis-migration) for more information.\"",
                "timestamp": 1664358697284,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358701316,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security - Error with Permissions-Policy header: Parse of permissions policy failed because of errors reported by structured header parser.",
                "timestamp": 1664358702100,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://graph.facebook.com/v11.0/2840454615985117/events - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1664358702823,
                "type": ""
            }
        ],
        "screenShotFile": "001a00d8-00e4-0036-0080-0076006b003f.png",
        "timestamp": 1664358679406,
        "duration": 23472
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
