/* eslint-disable no-eval */
import { getWeek } from './date';
export function getTasksData(args) {
    var task = args.task;
    if (task === 'weekly') {
        var s = args.s || "".concat(new Date().getFullYear(), "-W-").concat(getWeek(new Date()), ".md");
        return getWeekly(s, args);
    }
    if (task === 'yearly')
        return getYearly(args.s || "#Plan/Weekly/".concat(new Date().getFullYear()));
}
function getWeekly(selector, args) {
    function getTaskData(params) {
        var data = "```dataviewjs\n\n    ".concat(getFormatWeeklyTask.toString(), "\n\n    ").concat(getWeeklyTasks.toString(), "\n\n    getWeeklyTasks(").concat(toString(params), ")\n```\n    ");
        return data;
    }
    function getWeeklyTasks(_a) {
        var selector = _a.selector, filterCb = _a.filterCb, args = _a.args;
        var page = dv.page(selector);
        getFormatWeeklyTask(page, filterCb, args);
    }
    var data = getTaskData({ selector: selector, filterCb: function (item) { return !item.completed; } });
    data = "".concat(data, "\n\r") + '---\n\r';
    data = data + getTaskData({ selector: selector, args: args });
    return data;
}
function getYearly(selector) {
    var data = "## Yearly Tasks\n\r```dataviewjs\n\n  ".concat(getFormatWeeklyTask.toString(), "\n\n  const pages = dv.pages('").concat(selector, "')\n  console.log('pages:',pages.forEach(item => console.log('item:',item.file.name)))\n\n  pages.sort((a, b) => {\n    console.log('a:',a,'b:', b)\n    const getWeekNumber = (str) => {\n      const ret = str?.split('-')\n      if (ret && ret.length === 3) return parseInt(ret[2].slice(-2))\n      return 0\n    };\n    console.log(getWeekNumber(b?.file?.name), getWeekNumber(a?.file?.name))\n    return getWeekNumber(b?.file?.name) - getWeekNumber(a?.file?.name);\n  })\n  console.log('pages:',pages.forEach(item => console.log('item:',item.file.name)))\n  pages.forEach((page) => {\n    getFormatWeeklyTask(page)\n  })\n  \n```\n  ");
    return data;
}
function getFormatWeeklyTask(page, filterCb, args) {
    if (filterCb)
        filterCb = eval(filterCb);
    else
        filterCb = function (item) { return item.completed; };
    var taskList = new Set();
    var tableName = ['Name', 'Scheduled', 'Project'];
    if (args === null || args === void 0 ? void 0 : args.completion)
        tableName.push('Completion');
    if (args === null || args === void 0 ? void 0 : args.completlinksion)
        tableName.push('links');
    if (!page)
        return dv.el('p', 'No Data');
    var _a = page.file, _b = _a.tasks, tasks = _b === void 0 ? [] : _b, name = _a.name, path = _a.path;
    dv.header(4, name);
    taskList.add({
        name: name,
        path: path,
        tasks: tasks,
    });
    var parseText = function (input) {
        var regex = /\[(\w+)::([^[\]]*)]/g;
        var projectReg = /【([\w\W]+)】/;
        var typeReg = /(^[\w\W]+)：/;
        var result = {};
        input = input.replace(regex, function (match, key, value) {
            result[key] = value.trim();
            return '';
        });
        result.text = input.trim();
        var matchProject = input.match(projectReg);
        if (matchProject)
            result.project = matchProject[1];
        var matchType = input.match(typeReg);
        if (matchType)
            result.type = matchType[1];
        return result;
    };
    var getSummaries = function (data) {
        var _a;
        if (!data)
            return [];
        var sums = [];
        var props = Array.from({ length: (_a = data[0]) === null || _a === void 0 ? void 0 : _a.length });
        props === null || props === void 0 ? void 0 : props.forEach(function (_item, index) {
            if (index === 0)
                return sums[index] = 'Total';
            var values = data.map(function (item) {
                // only calculate time of days,hours,minutes
                var _a = item[index] || {}, days = _a.days, hours = _a.hours, minutes = _a.minutes;
                return Number(days) * 24 + Number(hours) + Number(minutes) / 60;
            });
            if (!values.every(function (value) { return Number.isNaN(value); })) {
                sums[index] = values.reduce(function (prev, curr) {
                    var value = Number(curr);
                    if (!Number.isNaN(value))
                        return prev + curr;
                    else
                        return prev;
                }, 0);
            }
            if (sums[index])
                sums[index] = "".concat(sums[index], " hours");
            else
                sums[index] = '-';
        });
        return sums;
    };
    var getData = function (args) {
        var ret = [];
        dv.array(Array.from(taskList)).forEach(function (item) {
            var /* name, path, links, */ tasks = item.tasks;
            tasks.filter(filterCb).forEach(function (el) {
                var _a = parseText(el.text), text = _a.text, project = _a.project, type = _a.type;
                if (!text.includes('[work]'))
                    return;
                var tableItem = [
                    text.replace('[work]', ''),
                    el.scheduled,
                    project || type,
                ];
                if (args === null || args === void 0 ? void 0 : args.completion)
                    tableItem.push(el.completion);
                if (args === null || args === void 0 ? void 0 : args.link)
                    tableItem.push(el.link);
                ret.push(tableItem);
            });
        });
        var summary = getSummaries(ret);
        ret.push(summary);
        return ret;
    };
    dv.table(tableName, getData(args));
}
function toString(data) {
    var replacer = function (key, value) {
        if (typeof value === 'function')
            return value.toString();
        return value;
    };
    return JSON.stringify(data, replacer);
}
