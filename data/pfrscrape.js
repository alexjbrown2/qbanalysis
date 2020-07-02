const axios = require('axios')
const cheerio = require('cheerio')
const tableToCsv = require('node-table-to-csv')
var fs = require('fs')

const url = `https://aws.pro-football-reference.com/boxscores/201909080crd.htm`
// load payload into cheerio


const getGameData = (htmlString) => {
    // date, time, week, roof, weather, over/under
    const $ = cheerio.load(htmlString)
    const gameData = []

    //pull out home/away, date, time from top div
    const scorebox = $('div.scorebox').html()
    const teamContainer = $(scorebox).find('div:first-child')
    const team = $(teamContainer).find('strong > a')
    const homeTeam = $(team[0]).text()
    const awayTeam = $(team[1]).text()
    
    const date = $(scorebox).find('.scorebox_meta > div:nth-child(1)').text()
    const fulltime = $(scorebox).find('.scorebox_meta > div:nth-child(2)').text()
    const time = fulltime.replace('Start Time: ', '')

    const string = $('#all_game_info').html()
    var uncomment = string.replace('<\!--', '')
    const uncomment2 = uncomment.replace('-->', '')

    const myTable = $(uncomment2).find("#game_info")
    const csvData = tableToCsv(myTable.parent().html())

    return {
        "date" : date,
        "time" : time,
        "home": homeTeam,
        "away" : awayTeam,
        "otherInfo" : csvData
    }
}
const getTables = (html) => {
    //replacing commented out piece that was affecting cheerio
    const $ = cheerio.load(html)
    var string = $('#all_passing_advanced').html()
    var uncomment = string.replace('<\!--', '')
    const uncomment2 = uncomment.replace('-->', '')

    //grab my table
    const myTable = $(uncomment2).find("#passing_advanced")
    const csvData = tableToCsv(myTable.parent().html())

    return csvData
}

const compileAll = (htmlString) => {
    const passing_stats = getTables(htmlString)
    var game_info = getGameData(htmlString)
    const otherInfo = game_info.otherInfo.split('\n')
    const justOurFilter = otherInfo.filter(i => i.includes('Roof') || i.includes('Surface') || i.includes('Weather'))
    game_info['otherInfo'] = justOurFilter
    console.log(game_info)
}
axios.get(url).then(res => {
    compileAll(res.data)
    fs.writeFile('201909080crd.csv', getTables(res.data), (err) => {
        if (err) throw err;
        console.log('Success')
    })
}).catch(err => {
    console.log(err)
})