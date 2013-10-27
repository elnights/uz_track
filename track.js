// Generated by CoffeeScript 1.6.3
(function() {
  var colors, exec, grabToken, headers, init, l, lookupPlace, p, params, request, say, searchTrains, searchUrl, url, util;

  exec = require('child_process').exec;

  util = require('util');

  colors = require('colors');

  request = require('request').defaults({
    jar: true
  });

  process.stdin.setRawMode(true);

  p = function() {
    return process.stdout.write.apply(process.stdout, arguments);
  };

  l = function() {
    return console.log.apply(console, arguments);
  };

  say = function(word) {
    return exec("echo " + word + " |espeak", function(error, stdout, stderr) {
      if (error !== null) {
        return console.log('exec error: ' + error);
      }
    });
  };

  url = 'http://booking.uz.gov.ua/ru/';

  searchUrl = 'http://booking.uz.gov.ua/ru/purchase/search/';

  params = {
    time_dep: '00:00',
    time_dep_till: '',
    search: ''
  };

  headers = {
    'GV-Referer': url,
    'GV-Ajax': 1,
    'GV-Screen': '1600x900'
  };

  global.localStorage = {
    setItem: function(key, value) {
      return headers[key] = value;
    }
  };

  grabToken = function(code) {
    return eval(code);
  };

  lookupPlace = function(s, cb) {
    return request("http://booking.uz.gov.ua/ru/purchase/station/" + (encodeURIComponent(s)) + "/", function(e, r, b) {
      var buffer, index, listener, place;
      b = JSON.parse(b).value;
      b = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = b.length; _i < _len; _i++) {
          place = b[_i];
          _results.push({
            id: place.station_id,
            title: place.title
          });
        }
        return _results;
      })();
      l('Please, clarify the place for ' + s);
      for (index in b) {
        place = b[index];
        l(index + ': ' + place.title);
      }
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      buffer = '';
      return process.stdin.on('data', listener = function(key) {
        var n;
        if (key === '\u0003' || key.charCodeAt(0) === 27) {
          process.exit();
        }
        if (key.charCodeAt(0) === 13 && buffer) {
          n = ~~Number(buffer);
          if (String(n) === buffer && n >= 0) {
            if (b[n]) {
              process.stdin.pause();
              process.stdin.removeListener('data', listener);
              l('\nSelected place: ' + b[n].title + '(' + b[n].id + ')');
              cb(buffer);
              return;
            } else {
              l('Invaid place index');
              buffer = '';
              return;
            }
          } else {
            l('Invaid input');
            buffer = '';
            return;
          }
        }
        buffer += key;
        return p(key);
      });
    });
  };

  searchTrains = function() {
    var formatDate;
    formatDate = function(d) {
      d = new Date(d * 1000);
      return "" + (d.getDate()) + "-" + (d.getMonth() + 1) + "-" + (d.getFullYear()) + " " + (d.getHours()) + ":" + (d.getMinutes());
    };
    p('Searching...\r');
    return request.post({
      url: searchUrl,
      headers: headers,
      json: params
    }, function(error, response, body) {
      var train, type, value, _i, _j, _len, _len1, _ref, _results;
      if (body.error) {
        l('API reporting an error: ' + body.value);
        process.exit();
      }
      value = body.value;
      _results = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        train = value[_i];
        p("" + train.num.green + ": " + train.from.station.blue.bold + " - " + train.till.station.blue.bold);
        p(" : " + (formatDate(train.from.date)) + " - " + (formatDate(train.till.date)) + " : ");
        _ref = train.types;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          type = _ref[_j];
          p(("" + type.letter + "(" + type.places + ") ").green);
        }
        _results.push(l(''));
      }
      return _results;
    });
  };

  (init = function() {
    var a, num, usage, userSettings, _i, _len;
    usage = 'Usage: from=Луганск to=Одесса date=29.10.2013';
    userSettings = {};
    process.argv.slice(2).forEach(function(item) {
      var a;
      if (item.indexOf('=') !== -1) {
        a = item.split('=');
        return userSettings[a[0]] = a[1];
      }
    });
    if (!userSettings.from || !userSettings.to || !userSettings.date) {
      l(usage);
      process.exit();
    }
    a = userSettings.date.split('.');
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      num = a[_i];
      a = parseInt(num);
    }
    userSettings.date = new Date(a[2], a[1], a[0]);
    if (Object.prototype.toString.call(userSettings.date) === "[object Date]" && !isNaN(userSettings.date.getTime())) {
      l('Invalid date');
      process.exit();
    }
    return lookupPlace(userSettings.from, function(id) {
      userSettings.from_id = id;
      return lookupPlace(userSettings.to, function(id) {
        var time;
        userSettings.to_id = id;
        time = new Date();
        p('Initial connection');
        return request(url, function(error, response, body) {
          time = (new Date()).valueOf() - time.valueOf();
          l(': ' + time + 'ms \n');
          grabToken(/\$\$_.+?\)\)\(\)/.exec(body)[0]);
          return searchTrains();
        });
      });
    });
  })();

}).call(this);

/*
//@ sourceMappingURL=track.map
*/
