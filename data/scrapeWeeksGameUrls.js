const axios = require('axios')
const cheerio = require('cheerio')
const tableToCsv = require('node-table-to-csv')
var fs = require('fs')

const week = 1
const year = 2019

const url = `https://aws.pro-football-reference.com/years/${year}/week_${week}.htm`

const getTables = (html) => {
    //replacing commented out piece that was affecting cheerio
    const $ = cheerio.load(html)
    var string = $('.game_summaries .game_summary .gamelink a')
    var second = $(string).attr('href')
    //var uncomment = string.replace('<\!--', '')
    //const uncomment2 = uncomment.replace('-->', '')
    const list = []
    for(i = 0;i<20;i++){
       var href = $(string[i]).attr('href')
        if (href !== undefined){
           list.push(href)
       }
    }
    console.log(list)
}
axios.get(url).then(res => {
    getTables(res.data)
    //fs.writeFile(`data/${urlOfGame}_passing.csv`, compileAll(res.data, 'passing'), (err) => {
    //    if (err) throw err;
    //    console.log('Success - Wrote Game\'s Passing Stats')
    //})
}).catch(err => {
    console.log(err)
})