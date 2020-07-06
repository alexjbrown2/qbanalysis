const axios = require('axios')
const cheerio = require('cheerio')
const tableToCsv = require('node-table-to-csv')
var fs = require('fs')

const week = 1
const weekMax = 17
const year = 2019

const getGameUrls = (html) => {
    const $ = cheerio.load(html)
    var string = $('.game_summaries .game_summary .gamelink a')
    var second = $(string).attr('href')
    const list = []
    for (i = 0; i < 20; i++) {
        var href = $(string[i]).attr('href')
        if (href !== undefined) {
            list.push(href)
        }
    }
    return list.join()
}
var url;

const oneWeeksGames = (week, year) => {
    const url = `https://aws.pro-football-reference.com/years/${year}/week_${week}.htm`
    axios.get(url).then(res => {
        getGameUrls(res.data)
        fs.writeFile(`data/week${week}_${year}_gameurls.txt`, getGameUrls(res.data), (err) => {
            if (err) throw err;
            console.log(`Success - Wrote Week\ ${week}'s ${year} game urls to file`)
        })
    }).catch(err => {
        console.log(err)
    })
}
// loop weeks requests
(()=>{
    for (t = 1; t < 22; t++) {
        oneWeeksGames(t, year)
    }
})()
