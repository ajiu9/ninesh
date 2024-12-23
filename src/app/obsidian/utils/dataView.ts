/* eslint-disable no-eval */

import { getWeek } from './date'

export interface taskItem {
  text: string
  project?: string
  type?: string
  scheduled?: string
  completion?: string
  link?: string
}

export function getTasksData(args) {
  const { task } = args
  if (task === 'weekly') {
    const s = args.s || `${new Date().getFullYear()}-W-${getWeek(new Date())}.md`
    return getWeekly(s, args)
  }
  if (task === 'yearly')
    return getYearly(args.s || `#Plan/Weekly/${new Date().getFullYear()}`)
}

function getWeekly(selector: any, args: any) {
  function getTaskData(params: { selector: any, filterCb?: (item: any) => boolean, args?: any }) {
    const data = `\`\`\`dataviewjs\n
    ${getFormatWeeklyTask.toString()}\n
    ${getWeeklyTasks.toString()}\n
    getWeeklyTasks(${toString(params)})\n\`\`\`
    `
    return data
  }
  function getWeeklyTasks({ selector, filterCb, args }) {
    const page = dv.page(selector)
    getFormatWeeklyTask(page, filterCb, args)
  }
  let data = getTaskData({ selector, filterCb: item => !item.completed })
  data = `${data}\n\r` + '---\n\r'
  data = data + getTaskData({ selector, args })
  return data
}

function getYearly(selector: any) {
  const data = `## Yearly Tasks\n\r\`\`\`dataviewjs\n
  ${getFormatWeeklyTask.toString()}\n
  const pages = dv.pages('${selector}')
  console.log('pages:',pages.forEach(item => console.log('item:',item.file.name)))

  pages.sort((a, b) => {
    console.log('a:',a,'b:', b)
    const getWeekNumber = (str) => {
      const ret = str?.split('-')
      if (ret && ret.length === 3) return parseInt(ret[2].slice(-2))
      return 0
    };
    console.log(getWeekNumber(b?.file?.name), getWeekNumber(a?.file?.name))
    return getWeekNumber(b?.file?.name) - getWeekNumber(a?.file?.name);
  })
  console.log('pages:',pages.forEach(item => console.log('item:',item.file.name)))
  pages.forEach((page) => {
    getFormatWeeklyTask(page)
  })
  \n\`\`\`
  `

  return data
}

function getFormatWeeklyTask(page, filterCb, args) {
  if (filterCb)
    filterCb = eval(filterCb)
  else
    filterCb = item => item.completed

  const taskList = new Set()

  const tableName = ['Name', 'Scheduled', 'Project']
  if (args?.completion) tableName.push('Completion')
  if (args?.completlinksion) tableName.push('links')

  if (!page) return dv.el('p', 'No Data')
  const { tasks = [], name, path } = page.file
  dv.header(4, name)
  taskList.add({
    name,
    path,
    tasks,
  })
  const parseText = (input) => {
    const regex = /\[(\w+)::([^[\]]*)]/g
    const projectReg = /【([\w\W]+)】/
    const typeReg = /(^[\w\W]+)：/

    const result = {}

    input = input.replace(regex, (match, key, value) => {
      result[key] = value.trim()
      return ''
    })

    result.text = input.trim()

    const matchProject = input.match(projectReg)
    if (matchProject)
      result.project = matchProject[1]

    const matchType = input.match(typeReg)
    if (matchType)
      result.type = matchType[1]

    return result
  }

  const getSummaries = (data) => {
    if (!data) return []

    const sums = []
    const props = Array.from({ length: data[0]?.length })
    props?.forEach((_item, index) => {
      if (index === 0) return sums[index] = 'Total'

      const values = data.map((item) => {
        // only calculate time of days,hours,minutes
        const { days, hours, minutes } = item[index] || {}
        return Number(days) * 24 + Number(hours) + Number(minutes) / 60
      })
      if (!values.every(value => Number.isNaN(value))) {
        sums[index] = values.reduce((prev, curr) => {
          const value = Number(curr)
          if (!Number.isNaN(value))
            return prev + curr
          else
            return prev
        }, 0)
      }
      if (sums[index]) sums[index] = `${sums[index]} hours`
      else sums[index] = '-'
    })
    return sums
  }

  const getData = (args) => {
    const ret: Array<taskItem[]> = []
    dv.array(Array.from(taskList)).forEach((item) => {
      const { /* name, path, links, */tasks } = item
      tasks.filter(filterCb).forEach((el) => {
        const { text, project, type } = parseText(el.text)
        if (!text.includes('[work]')) return
        const tableItem = [
          text.replace('[work]', ''),
          el.scheduled,
          project || type,
        ]
        if (args?.completion) tableItem.push(el.completion)
        if (args?.link) tableItem.push(el.link)

        ret.push(tableItem)
      })
    })
    const summary = getSummaries(ret)
    ret.push(summary)
    return ret
  }
  dv.table(tableName, getData(args))
}

function toString(data) {
  const replacer = (key, value) => {
    if (typeof value === 'function')
      return value.toString()

    return value
  }
  return JSON.stringify(data, replacer)
}
