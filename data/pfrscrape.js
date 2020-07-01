const axios = require('axios')
const cheerio = require('cheerio')
const tableToCsv = require('node-table-to-csv')
var fs = require('fs')

const url = `https://aws.pro-football-reference.com/boxscores/201909080crd.htm`
// load payload into cheerio
const $ = cheerio.load(html)

const getGameData = () => {
    // date, time, week, roof, weather, over/under
}
const getTables = (html) => {
    //replacing commented out piece that was affecting cheerio
    var string = $('#all_passing_advanced').html()
    var uncomment = string.replace('<\!--', '')
    const uncomment2 = uncomment.replace('-->', '')

    //grab my table
    const myTable = $(uncomment2).find("#passing_advanced")
    const csvData = tableToCsv(myTable.parent().html())

    return csvData
}
axios.get(url).then(res => {  
    fs.writeFile('201909080crd.csv', getTables(res.data), (err) => {
        if (err) throw err;
        console.log('Success')
    })
}).catch(err => {
    console.log(err)
})