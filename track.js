// Generated by CoffeeScript 1.6.3
(function() {
  var colors, exec, grabToken, headers, init, l, listener, lookupPlace, p, pad, params, request, say, scheduler, searchTrains, searchUrl, url, util;

  exec = require('child_process').exec;

  util = require('util');

  colors = require('colors');

  request = require('request').defaults({
    jar: true
  });

  pad = function(n, width, z) {
    z = z || '0';
    n = n + '';
    if (n.length >= width) {
      return n;
    } else {
      return new Array(width - n.length + 1).join(z) + n;
    }
  };

  process.stdin.setRawMode(true);

  process.stdin.resume();

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', listener = function(key) {
    if (key === '\u0003' || key.charCodeAt(0) === 27) {
      return process.exit();
    }
  });

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
    'GV-Screen': '1600x900',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/28.0.1500.71 Chrome/28.0.1500.71 Safari/537.36'
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
      var buffer, index, place;
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
              process.stdin.removeListener('data', listener);
              l('\nSelected place: ' + b[n].title + '(' + b[n].id + ')');
              cb(b[n]);
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

  searchTrains = function(cb) {
    var formatDate;
    formatDate = function(d) {
      d = new Date(d * 1000);
      return "" + (d.getDate()) + "-" + (d.getMonth() + 1) + "-" + (d.getFullYear()) + " " + (d.getHours()) + ":" + (d.getMinutes());
    };
    p("Searching..." + (Array(100).join(' ')) + "\r");
    return request.post({
      url: searchUrl,
      headers: headers,
      json: params
    }, function(error, response, body) {
      var train, type, value, _i, _j, _len, _len1, _ref;
      if (body.error) {
        l('API reporting an error: ' + body.value);
        process.exit();
      }
      value = body.value;
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        train = value[_i];
        p("" + train.num.green + ": " + train.from.station.blue.bold + " - " + train.till.station.blue.bold);
        p(" : " + (formatDate(train.from.date)) + " - " + (formatDate(train.till.date)) + " : ");
        _ref = train.types;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          type = _ref[_j];
          p(("" + type.letter + "(" + type.places + ") ").green);
        }
      }
      return cb();
    });
  };

  scheduler = function() {
    var attempts, doIt;
    attempts = 0;
    return (doIt = function() {
      attempts++;
      return searchTrains(function() {
        setTimeout(doIt, 5000);
        return p(': Attempts: ' + attempts + '\r');
      });
    })();
  };

  (init = function() {
    var a, num, usage, userSettings;
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
    a = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        num = a[_i];
        _results.push(parseInt(num));
      }
      return _results;
    })();
    userSettings.date = new Date(a[2], a[1] - 1, a[0]);
    if (Object.prototype.toString.call(userSettings.date) === "[object Date]" && isNaN(userSettings.date.getTime())) {
      l('Invalid date');
      process.exit();
    }
    return lookupPlace(userSettings.from, function(place) {
      userSettings.from_id = place.id;
      userSettings.from = place.title;
      return lookupPlace(userSettings.to, function(place) {
        var time;
        userSettings.to_id = place.id;
        userSettings.to = place.title;
        time = new Date();
        p('Initial connection');
        return request(url, function(error, response, body) {
          time = (new Date()).valueOf() - time.valueOf();
          l(': ' + time + 'ms \n');
          grabToken(/\$\$_.+?\)\)\(\)/.exec(body)[0]);
          params.station_id_from = userSettings.from_id;
          params.station_id_till = userSettings.to_id;
          params.station_from = userSettings.from;
          params.station_till = userSettings.to;
          params.date_dep = "" + (pad(userSettings.date.getDate(), 2)) + "." + (pad(userSettings.date.getMonth() + 1, 2)) + "." + (pad(userSettings.date.getFullYear(), 4));
          return scheduler();
        });
      });
    });
  })();

}).call(this);

/*
//@ sourceMappingURL=track.map
*/
