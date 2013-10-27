exec = require('child_process').exec
util = require('util');

colors = require('colors')

request = require('request').defaults({jar: true})

pad = (n, width, z) ->
  z = z || '0'
  n = n + ''
  return if n.length >= width then n else new Array(width - n.length + 1).join(z) + n

process.stdin.setRawMode true

#punycode = require 'punycode'

p = ()-> process.stdout.write.apply(process.stdout, arguments)
l = ()-> console.log.apply(console, arguments)

say = (word) -> 
  exec "echo #{word} |espeak", (error, stdout, stderr) -> 
    if error != null
     console.log('exec error: ' + error)

url = 'http://booking.uz.gov.ua/ru/'
searchUrl = 'http://booking.uz.gov.ua/ru/purchase/search/'
params = 
#  station_id_from: '2214000'
#  station_id_till: '2218000'
#  station_from: 'Донецк'
#  station_till: 'Львов'
#  date_dep: '29.10.2013'
  time_dep: '00:00'
  time_dep_till: ''
  search: ''
     
headers = 
  'GV-Referer': url
  'GV-Ajax': 1
  'GV-Screen': '1600x900'
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/28.0.1500.71 Chrome/28.0.1500.71 Safari/537.36'
 
global.localStorage = 
    setItem: (key, value) -> headers[key] = value

grabToken = (code) ->
  #console.log code 
  eval code

lookupPlace = (s, cb) ->
  request "http://booking.uz.gov.ua/ru/purchase/station/#{encodeURIComponent(s)}/", (e, r, b) ->
    b = JSON.parse(b).value
    b = ({id: place.station_id, title: place.title} for place in b)
    l 'Please, clarify the place for ' + s
    for index, place of b
      l(index + ': ' + place.title)

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

#    process.stdin.on 'data', (text) ->
#      console.log 'received data:', util.inspect(text)
#      cb(b[text])

    buffer = ''
    process.stdin.on 'data', listener = (key) ->
      #ctrl-c ( end of text )
      if key == '\u0003' or key.charCodeAt(0) == 27
        process.exit()
      if key.charCodeAt(0) == 13 && buffer
        n = ~~Number(buffer);
        if String(n) == buffer && n >= 0
          if b[n]
            process.stdin.pause()
            process.stdin.removeListener('data', listener)
            l '\nSelected place: ' + b[n].title + '(' + b[n].id + ')'

            cb b[n]
            return
          else
            l 'Invaid place index'
            buffer = ''
            return
        else
          l 'Invaid input'
          buffer = ''
          return
      buffer += key
      p key

searchTrains = ->
  formatDate = (d) ->
    d = new Date(d*1000)
    "#{d.getDate()}-#{d.getMonth() + 1}-#{d.getFullYear()} #{d.getHours()}:#{d.getMinutes()}"

  p('Searching...\r')
  request.post({
    url: searchUrl
    headers: headers
    json: params
  }, (error, response, body) ->

    if body.error
      l 'API reporting an error: ' + body.value
      process.exit()

    value = body.value
    for train in value
      p("#{train.num.green}: #{train.from.station.blue.bold} - #{train.till.station.blue.bold}")
      p(" : #{formatDate(train.from.date)} - #{formatDate(train.till.date)} : \r")
      for type in train.types
        p("#{type.letter}(#{type.places}) ".green)
      l('')  
  )

do init = ->
  #command line arguments
  usage = 'Usage: from=Луганск to=Одесса date=29.10.2013'
  userSettings = {}
  process.argv.slice(2).forEach (item) ->
    if item.indexOf('=') != -1
      a = item.split('=')
      userSettings[a[0]] = a[1]
  
  if !userSettings.from || !userSettings.to || !userSettings.date
    l usage
    process.exit()

  a = userSettings.date.split('.')
  a = (parseInt(num) for num in a)
  userSettings.date = new Date(a[2], a[1]-1, a[0])
  if Object.prototype.toString.call(userSettings.date) == "[object Date]" and isNaN userSettings.date.getTime()
    l 'Invalid date'
    process.exit()

  lookupPlace userSettings.from, (place) ->
    userSettings.from_id = place.id
    userSettings.from = place.title

    lookupPlace userSettings.to, (place) ->
      userSettings.to_id = place.id
      userSettings.to = place.title
      
      #all data is ready, let's start
      time = new Date();
      p('Initial connection')
      request url, (error, response, body) ->
        time = (new Date()).valueOf() - time.valueOf()
        l(': ' + time + 'ms \n')
        grabToken(/\$\$_.+?\)\)\(\)/.exec(body)[0])
        params.station_id_from = userSettings.from_id
        params.station_id_till = userSettings.to_id
        params.station_from = userSettings.from
        params.station_till = userSettings.to
        params.date_dep = "#{pad(userSettings.date.getDate(), 2)}.#{pad(userSettings.date.getMonth()+1, 2)}.#{pad(userSettings.date.getFullYear(), 4)}"
        searchTrains()
