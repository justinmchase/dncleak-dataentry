var fs = require('fs')
var path = require('path')
var readline = require('readline')
var async = require('async')
var Nightmare = require('nightmare')
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

fs.writeFileSync('data.xsl', '', 'utf8')
var urls = fs.readFileSync('urls.txt', 'utf8').split('\n')
rl.question('What is your reddit username? ', (name) => {
  rl.close()
  function get (url, callback) {
    var nightmare = Nightmare({
      show: true,
      fullscreen: true,
      openDevTools: { mode: 'right' },
      waitTimeout: Number.MAX_VALUE
    })
    nightmare
      .goto(url)
      .evaluate(() => {
        var bodyText = document.body.innerHTML.toLowerCase()
        window.DATA = {
          date: document.querySelector('header').innerHTML.match(/Date:\s*(.*)[\n]/)[1].trim(),
          subject: document.querySelector('h2').innerHTML.trim(),
          description: '',
          from: document.querySelector('header').innerHTML.match(/From:\s*(.*)[\n]/)[1].trim(),
          to: document.querySelector('header .sh').innerHTML.trim(),
          attachments: document.querySelector('a[href="#attachments"]') ? 'Yes' : 'No',
          propaganda: 'No',
          elections: 'No',
          meetings: bodyText.indexOf('meet') > -1 ? 'Yes' : 'No',
          industry: 'No',
          geo: 'No',
          money: bodyText.indexOf('$') > -1 ? 'Yes' : 'No'
        }
        window.desc = function (d) { window.DATA.description = d }
        window.propaganda = function () { window.DATA.propaganda = 'Yes' }
        window.election = function () { window.DATA.election = 'Yes' }
        window.meeting = function () { window.DATA.meeting = 'Yes' }
        window.industry = function () { window.DATA.industry = 'Yes' }
        window.geo = function () { window.DATA.industry = 'Yes' }
        window.money = function () { window.DATA.money = 'Yes' }
        window.done = function () { window.COMPLETE = true }
      })
      .evaluate((name) => {
        console.log('\n\n%c Hello ' + name + '!', 'color: red; font-size: 32px\n\n')
        console.log('\n\n%c Read the email and come up with a brief description.\n\n', 'font-size: 24px; font-weight: bold')
        console.log('\n\n%c Available functions to set data:', 'font-size: 24px; font-weight: bold')
        console.log('\n\n%c' +
          '  desc("Scheming about how to sabotage Bernie")\n' +
          '  propaganda()\n' +
          '  election()\n' +
          '  meeting()\n' +
          '  industry()\n' +
          '  geo()\n' +
          '  money()\n' +
          '  done()\n\n',
          'font-size: 16px; font-family: monospace')
      }, name)
      .wait(() => !!window.COMPLETE)
      .evaluate(() => { return window.DATA })
      .end()
      .then((result) => {
        console.log(result)
        var line = `${name}\t` +
          `${result.date}\t` +
          `${result.subject}\t` +
          `${result.description}\t` +
          `${result.from}\t` +
          `${result.to}\t` +
          `${result.attachments}\t` +
          `${result.propaganda}\t` +
          `${result.elections}\t` +
          `${result.meetings}\t` +
          `${result.industry}\t` +
          `${result.geo}\t` +
          `${result.money}\r`

        fs.appendFile('data.xls', line, 'utf8', callback)
      })
      .catch(err => callback(err))
  }

  async.mapSeries(urls, get, (err, results) => {
    if (err) return console.log(err)
    console.log()
    console.log(`Open this file: "${path.join(__dirname, 'data.xls')}" and paste the contents into the google doc."`)
  })
})
