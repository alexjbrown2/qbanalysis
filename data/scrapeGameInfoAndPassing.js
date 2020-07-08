const axios = require('axios')
const cheerio = require('cheerio')
const tableToCsv = require('node-table-to-csv')
var fs = require('fs')
const { isCompositeComponentWithType } = require('react-dom/test-utils')

const abbrevs = {
    "PIT": "Pittsburgh Steelers",
    "NWE": "New England Patriots",
    "TAM": "Tampa Bay Buccaneers",
    "CAR": "Carolina Panthers",
    "PHI": "Philadelphia Eagles",
    "ATL": "Atlanta Falcons",
    "SFO": "San Francisco 49ers",
    "CIN": "Cincinnati Bengals",
    "CHI": "Chicago Bears",
    "DEN": "Denver Broncos",
    "LAC": "Los Angeles Chargers",
    "DET": "Detroit Lions", 
    "MIN": "Minnesota Vikings",
    "GNB": "Green Bay Packers",
    "JAX": "Jacksonville Jaguars",
    "HOU": "Houston Texans",
    "MIA": "Miami Dolphins",
    "BUF": "Buffalo Bills",
    "NYG": "New York Giants",
    "IND": "Indianapolis Colts",
    "TEN": "Tennessee Titans",
    "SEA": "Seattle Seahawks",
    "KAN": "Kansas City Chiefs",
    "OAK": "Oakland Raiders",
    "NOR": "New Orleans Saints",
    "LAR": "Los Angeles Rams",
    "ARI": "Arizona Cardinals",
    "BAL": "Baltimore Ravens", 
    "DAL": "Dallas Cowboys",
    "WAS": "Washington Redskins",
    "CLE": "Cleveland Browns",
    "NYJ": "New York Jets",
}

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
    const noCommaDate = date.replace(',', '')
    const fulltime = $(scorebox).find('.scorebox_meta > div:nth-child(2)').text()
    const time = fulltime.replace('Start Time: ', '')

    const string = $('#all_game_info').html()
    var uncomment = string.replace('<\!--', '')
    const uncomment2 = uncomment.replace('-->', '')

    const myTable = $(uncomment2).find("#game_info")
    const csvData = tableToCsv(myTable.parent().html())
    return {
        "date" : noCommaDate,
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
    //Note: Had to modify the node-table-to-csv package to prevent empty strings in the csv
    const myTable = $(uncomment2).find("#passing_advanced")
    const csvData = tableToCsv(myTable.parent().html())

    return csvData
}

const compileJustGameInfo = (htmlString) => {
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
            const fullWeather = i.split(',')
            game_info['weather'] = `${fullWeather[1] ? fullWeather[1] : 'n'} ${fullWeather[2] ? fullWeather[2] : 'n'} ${fullWeather[3] ? fullWeather[3] : 'n'}`
        }
    }

    //form csv
    const headers = "Home,Away,Date,Time,Weather,Roof,Surface"
    var values  = ""

    values+= `${game_info.home},${game_info.away},${game_info.date},${game_info.time},${game_info.weather ? game_info.weather : 'na'},${game_info.roof ? game_info.roof : 'na'},${game_info.surface ? game_info.surface : ''}`

    var passingValues = `${passing_stats}`
    var wholePassing = passingValues.split('\n')
    
    var newArray = []
    //var removeSecondHeader = wholePassing.splice(2, 1)
    var gameInfoValues = `${values}\n`
    //add Date to Stat CSV
    //DONE: Need to account for multiple qbs per team
    newArray.push(wholePassing[0]+= ',GameDateID')
    for(let qbLine of wholePassing){
        if(!qbLine.startsWith('Player')){          
            newArray.push(qbLine+= `,${game_info.date}-${game_info.away}`)
        }
            
    }
    //An empty array value is tagging along - needs to be popped
    newArray.pop()
    var passingCsv = newArray.join("\n")
    return gameInfoValues.replace(/"/g,"")
}
const compileAll = (htmlString, type, justData = null) => {
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
            const fullWeather = i.split(',')
            game_info['weather'] = `${fullWeather[1] ? fullWeather[1] : 'n'} ${fullWeather[2] ? fullWeather[2] : 'n'} ${fullWeather[3] ? fullWeather[3] : 'n'}`
        }
    }

    //form csv
    const headers = "Home,Away,Date,Time,Weather,Roof,Surface"
    var values  = ""

    values+= `${game_info.home},${game_info.away},${game_info.date},${game_info.time},${game_info.weather ? game_info.weather : 'na'},${game_info.roof ? game_info.roof : 'na'},${game_info.surface ? game_info.surface : ''}`

    var passingValues = `${passing_stats}`
    var wholePassing = passingValues.split('\n')
    
    var newArray = []
    //var removeSecondHeader = wholePassing.splice(2, 1)
    var gameInfoValues = `${headers}\n${values}`
    //add Date to Stat CSV
    //DONE: Need to account for multiple qbs per team
    newArray.push(wholePassing[0]+= ',GameDateID')
    for(let qbLine of wholePassing){
        if(!qbLine.startsWith('Player')){          
            newArray.push(qbLine+= `,${game_info.date}-${game_info.away}`)
        }
            
    }
    //An empty array value is tagging along - needs to be popped
    newArray.pop()
    var passingCsv = newArray.join("\n")
    if(type == 'passing'){
       return passingCsv.replace(/"/g,"")
    } else if(type == 'info'){
        return gameInfoValues.replace(/"/g,"")
    }
}
const writeFiles = (url, urlOfGame) => {
    axios.get(url).then(res => {
        fs.appendFile(`data/game_info/2019_game_info.csv`, compileJustGameInfo(res.data,'info'), (err) => {
            if (err) throw err;
            console.log(`Success - Wrote All 2019 Game Info`)
        })
        /*fs.writeFile(`data/passing/${urlOfGame}_passing.csv`, compileAll(res.data, 'passing'), (err) => {
            if (err) throw err;
            console.log(`Success - Wrote Game\'s ${urlOfGame} Passing Stats`)
        })
        
        fs.writeFile(`data/game_info/${urlOfGame}_gameInfo.csv`, compileAll(res.data, 'info'), (err) => {
            if (err) throw err;
            console.log(`Success - Wrote ${urlOfGame} Game Info`)
        })*/
    }).catch(err => {
        console.log(err)
    })
}
const loopThroughWeekURLs = (txtFile) => {
    const buffer = fs.readFileSync(txtFile, 'utf8').split('\n')
    const urlArray = buffer[0].split(',')
    
    for( let indivUrl of urlArray){
        const url = `https://aws.pro-football-reference.com${indivUrl}`
        const removeHTM = indivUrl.replace('.htm', '')
        const removeBox = removeHTM.replace('/boxscores', '')
        writeFiles(url, removeBox)
    }
}
(() => {
    for(i = 1; i<22; i++){ 
        loopThroughWeekURLs(`data/week${i}_2019_gameurls.txt`)
    }
})()

     
