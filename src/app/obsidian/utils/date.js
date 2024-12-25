import { padLefZero } from './general';
export function formatDate(date) {
    var year = date.getFullYear();
    var month = "".concat(date.getMonth() + 1);
    var day = "".concat(date.getDate());
    var hours = "".concat(date.getHours());
    var minutes = "".concat(date.getMinutes());
    var seconds = "".concat(date.getSeconds());
    var week = "".concat(getWeek(date));
    return {
        year: year,
        month: month,
        day: day,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        time: "".concat(year, "-").concat(month.length === 1 ? padLefZero(month) : month, "-").concat(day.length === 1 ? padLefZero(day) : day),
        week: "".concat(year, "-W-").concat(week),
        empty: "".concat(year).concat(month).concat(day).concat(hours).concat(minutes).concat(seconds),
        task: 'task',
    };
}
export function getWeek(date) {
    var firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    var firstWeekStartDay = firstDayOfYear.getDay();
    if (firstWeekStartDay === 0)
        firstWeekStartDay = 6;
    else
        firstWeekStartDay -= 1;
    firstDayOfYear.setDate(firstDayOfYear.getDate() - firstWeekStartDay);
    var diffDays = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24);
    var weekNumber = Math.floor(diffDays / 7) + 1;
    return weekNumber.toString().padStart(2, '0');
}
