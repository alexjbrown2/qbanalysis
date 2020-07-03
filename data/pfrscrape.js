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
    for (let i of justOurFilter){
        if(i.includes('Roof')){
            game_info['roof'] = i.split(',')[1]
        }
        if(i.includes('Surface')){
            game_info['surface'] = i.split(',')[1]
        }
        if(i.includes('Weather')){
            game_info['weather'] = i.split(',')[1]
        }
    }

    //form csv
    const headers = "Home,Away,Date,Time,Weather,Roof,Surface"
    var values  = ""

    values+= `${game_info.home},${game_info.away},${game_info.date},${game_info.time},${game_info.weather ? game_info.weather : 'na'},${game_info.roof ? game_info.roof : 'na'},${game_info.surface ? game_info.surface : ''}`

    var allValues = `${headers}\n${values}\n${passing_stats}`
    
    return allValues.replace(/"/g,"")
}
axios.get(url).then(res => {
    fs.writeFile('201909080crd.csv', compilteAll(res.data), (err) => {
        if (err) throw err;
        console.log('Success')
    })
}).catch(err => {
    console.log(err)
})