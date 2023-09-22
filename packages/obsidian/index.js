#!/usr/bin/env node
// import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import minimist from 'minimist'

// const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const args = minimist(process.argv.slice(2))
const targets = args._
const target = targets[0] || 'daily'

const config = require('./config.json')

run()

async function run() {
  const templatePath = config[target].template
  const templateData = await fs.readFile(templatePath, 'utf8')
  const now = new Date()
  if (args.next && ['daily', 'saturday', 'sunday'].includes(target)) now.setDate(now.getDate() + 1)
  if (args.next && target === 'week') now.setDate(now.getDate() + 7)
  const currentTime = getCurrentTime(now)
  const nameEnum = {
    daily: 'time',
    saturday: 'time',
    sunday: 'time',
    week: 'week',
  }
  const fileName = currentTime[nameEnum[target]]
  fs.writeFile(`${config[target].target}/${fileName}.md`, templateData)
  return templateData
}

function getCurrentTime(nowTime) {
  const year = nowTime.getFullYear()
  const month = `${nowTime.getMonth() + 1}`
  const day = `${nowTime.getDate()}`
  const week = `${getWeek()}`
  return {
    year,
    month,
    day,
    time: `${year}-${month.length === 1 ? padLefZero(month) : month}-${day.length === 1 ? padLefZero(day) : day}`,
    week: `${year}-W-${week.length === 1 ? padLefZero(week) : week}`,
  }
  function getWeek() {
    const firstDayOfYear = new Date(year, 0, 1)
    const firstWeekStartDay = firstDayOfYear.getDay()
    const diffDays = Math.ceil((nowTime - (firstDayOfYear - firstWeekStartDay * 86400000)) / 86400000)
    return Math.ceil(diffDays / 7)
  }
  function padLefZero(str) {
    return (`00${str}`).substr(str.length)
  }
}
