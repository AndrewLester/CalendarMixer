import moment from './libraries/moment.min.js';

export class CourseIdentifier {
    constructor(courseId, name, realm) {
        this.course_id = id;
        this.course_name = name;
        this.course_realm = realm;
    }
}

export class CalendarData {
    constructor(rows, firstCalDay, firstMonthDay, lastCalDay, lastMonthDay) {
        this.rows = rows;
        this.firstCalDay = firstCalDay;
        this.firstMonthDay = firstMonthDay;
        this.lastCalDay = lastCalDay;
        this.lastMonthDay = lastMonthDay;
    }
}

export class CalendarDayData {
    constructor(dayOfMonth, events=[], otherMonth=false) {
        this.currentRow = 1;
        this.dayOfMonth = dayOfMonth;
        this.events = events;
        this.otherMonth = otherMonth;
    }
}

export class CalendarEventData {
    constructor(eventInfo, initialPlacement=true, filtered=false, start, end) {
        this.eventInfo = eventInfo;
        this.start = start || moment(eventInfo['start'], 'YYYY-MM-DD hh:mm:ss');
        this.end = end || (eventInfo['has_end'] ? moment(eventInfo['end'], 'YYYY-MM-DD hh:mm:ss') : this.start);
        this.initialPlacement = initialPlacement;
        this.filtered = filtered;
    }
}

export class CalendarRowData {
    constructor(dayNums=[], days=[], unused=false) {
        this.dayNums = dayNums;
        this.days = days;
        this.unused = unused;
    }
}

// Create "now" moment to store changes in viewed calendar month.
let linkDate = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];
let now = moment(linkDate, 'YYYY-MM').isValid() ? moment(linkDate, 'YYYY-MM') : moment();

export function buildCalendarStructure(today) {
    let calendar = [];

    // Duplicate moment because it's mutable value
    let td = moment(today);

    let firstDayWeekPos = moment(td).subtract(td.date() - 1, 'days').days();
    let daysInPrevMonth = moment(td).subtract(1, 'months').daysInMonth();

    // Start calendar with 6 rows
    for (let i = 0; i < 6; i++) {
        calendar.push(new CalendarRowData());
    }

    for (let i = 0; i < firstDayWeekPos; i++) {
        let dayOfMonth = daysInPrevMonth - (firstDayWeekPos - i - 1);
        let calDay = new CalendarDayData(dayOfMonth, [], true);
        calendar[0].days[i] = calDay;
        calendar[0].dayNums[i] = dayOfMonth;
    }

    for (let i = 0; i < td.daysInMonth(); i++) {
        let calDay = new CalendarDayData(i + 1);
        let rowIndex = ~~((i + firstDayWeekPos) / 7);
        let dayIndex = (i + firstDayWeekPos) % 7;

        calendar[rowIndex].days[dayIndex] = calDay;
        calendar[rowIndex].dayNums[dayIndex] = i + 1;
    }

    let lastRow = calendar.length - 1;
    if (calendar[calendar.length - 2].days.length !== 7) {
        // Set last calendar row to unused
        calendar[calendar.length - 1].unused = true;
        lastRow--;
    }

    let row = calendar[lastRow];
    let newChildrenCount = 7 - row.days.length;
    for (let i = 0; i < newChildrenCount; i++) {
        let calDay = new CalendarDayData(i + 1, [], true);
        row.days[i + (7 - newChildrenCount)] = calDay;
        row.dayNums[i + (7 - newChildrenCount)] = i + 1;
    }

    let firstMonthDay = moment(td).subtract(td.date() - 1, 'days');
    let firstCalDay = moment(firstMonthDay).subtract(firstMonthDay.days(), 'days');
    let lastMonthDay = moment(td).add(td.daysInMonth() - td.date(), 'days');
    let lastCalDay = moment(lastMonthDay).add(6 - lastMonthDay.days(), 'days');

    return new CalendarData(calendar, firstCalDay, firstMonthDay, lastCalDay, lastMonthDay);
}

export function placeEvent(event, calendar, filters) {
    let { eventInfo, start, end } = event;
    let { firstCalDay, lastCalDay } = calendar;

    if (end.isBefore(firstCalDay) || start.isAfter(lastCalDay)) {
        return;
    }

    let filtered = false;

    if (applyFilters(eventInfo, filters)) {
        filtered = true;
        event.filtered = filtered;
    }

    // Reset start to firstCalDay if the actual start is before the current month.
    start = start.isBefore(firstCalDay) ? firstCalDay : start;

    // The Math.ceil call corrects for messed up daylight savings timespans
    let span = Math.round(moment.duration(moment(end).diff(moment(start))).asDays());
    let daysSinceCalStart = Math.floor(moment.duration(start.diff(firstCalDay)).asDays());
    let col = daysSinceCalStart % 7;
    let row = ~~(daysSinceCalStart / 7);

    let calDay = calendar.rows[row].days[col];

    let startCol = col + 1;
    let eventRow = row + 1;
    let endCol = Math.max(Math.min(9, startCol + span), startCol + 1);
    
    // TODO: Readd this
    // If this event is long, and if it intersects with another event in a later column, move this entire
    // event up one row to keep them from intersecting
    // for (let checkCol = startCol; checkCol < endCol - 1; checkCol++) {
    //     if (calendar[row].days[checkCol] && calendar[row].days[checkCol].currentRow > calDay.currentRow) {
    //         calDay.currentRow = calendar[row].days[checkCol].currentRow;
    //         break;
    //     }
    // }
    
    if (endCol > (startCol + 1)) {
        for (let i = 1; i < Math.min(7 - col, span + 1); i++) {
            calendar.rows[row].days[col + i].events.push(new CalendarEventData(eventInfo, false, filtered));
        }
    }
    if (endCol > 8) {
        placeEvent(new CalendarEventData(eventInfo, true, filtered, moment(start).startOf('day').add(7 - col, 'days')), calendar, filters);
    }

    event.startCol = startCol;
    event.endCol = endCol;
    calDay.events.push(event);
}

export function applyFilters(eventInfo, filters) {
    for (let filter of filters) {
        let eventRealmId = eventInfo[eventInfo['realm'] + '_id'];
        // xor: positive filters invert the output of the normal filter
        if (filter.course_ids.map(e => e.id).some(id => id == eventRealmId) ^ filter.positive) {
            return true;
        }
    }
    return false;
}
