import { padLefZero } from './general'

export interface CurrentTimeType {
  year: string | number
  month: string | number
  day: string | number
  hours: string | number
  minutes: string | number
  seconds: string | number
  time: string | number
  week: string | number
  empty: string
  task: string
}
export function formatDate(date: Date): CurrentTimeType {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`
  const day = `${date.getDate()}`
  const hours = `${date.getHours()}`
  const minutes = `${date.getMinutes()}`
  const seconds = `${date.getSeconds()}`
  const week = `${getWeek(date)}`
  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    time: `${year}-${month.length === 1 ? padLefZero(month) : month}-${day.length === 1 ? padLefZero(day) : day}`,
    week: `${year}-W-${week}`,
    empty: `${year}${month}${day}${hours}${minutes}${seconds}`,
    task: 'task',
  }
}

export function getWeek(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  let firstWeekStartDay = firstDayOfYear.getDay()
  if (firstWeekStartDay === 0)
    firstWeekStartDay = 6

  else
    firstWeekStartDay -= 1

  firstDayOfYear.setDate(firstDayOfYear.getDate() - firstWeekStartDay)
  const diffDays = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
  const weekNumber = Math.floor(diffDays / 7) + 1

  return weekNumber.toString().padStart(2, '0')
}
