import moment, { Moment } from 'moment';
import { EventInfo, Filter } from '../api/types';


export interface CalendarData {
    rows: CalendarRowData[],
    firstCalDay: Moment,
    firstMonthDay: Moment,
    lastCalDay: Moment,
    lastMonthDay: Moment
}

export interface CalendarDayData {
    dayOfMonth: number,
    events: CalendarEventData[],
    otherMonth: boolean,
    currentRow?: number
}

export interface CalendarEventData {
    eventInfo: EventInfo,
    start: Moment,
    end: Moment,
    initialPlacement: boolean,
    filtered?: boolean,
    endRow?: number,
    startRow?: number,
    startCol?: number,
    endCol?: number
}

export interface CalendarRowData {
    dayNumbers: number[],
    days: CalendarDayData[],
    unused: boolean
}

export function buildCalendarStructure(today: Moment): CalendarData {
    const calendar: CalendarRowData[] = [];

    // Duplicate moment because it's mutable value
    const td = moment(today);

    const firstDayWeekPos = moment(td).subtract(td.date() - 1, 'days').days();
    const daysInPrevMonth = moment(td).subtract(1, 'months').daysInMonth();

    // Start calendar with 6 rows
    for (let i = 0; i < 6; i++) {
        calendar.push({ dayNumbers: [], days: [], unused: false });
    }

    for (let i = 0; i < firstDayWeekPos; i++) {
        const dayOfMonth = daysInPrevMonth - (firstDayWeekPos - i - 1);
        const calDay = { dayOfMonth, events: [], otherMonth: true };
        calendar[0].days[i] = calDay;
        calendar[0].dayNumbers[i] = dayOfMonth;
    }

    for (let i = 0; i < td.daysInMonth(); i++) {
        const calDay = { dayOfMonth: i + 1, events: [], otherMonth: false };
        const rowIndex = ~~((i + firstDayWeekPos) / 7);
        const dayIndex = (i + firstDayWeekPos) % 7;

        calendar[rowIndex].days[dayIndex] = calDay;
        calendar[rowIndex].dayNumbers[dayIndex] = i + 1;
    }

    let lastRow = calendar.length - 1;
    if (calendar[calendar.length - 2].days.length !== 7) {
        // Set last calendar row to unused
        calendar[calendar.length - 1].unused = true;
        lastRow--;
    }

    const row = calendar[lastRow];
    const newChildrenCount = 7 - row.days.length;
    for (let i = 0; i < newChildrenCount; i++) {
        let calDay = { dayOfMonth: i + 1, events: [], otherMonth: true };
        row.days[i + (7 - newChildrenCount)] = calDay;
        row.dayNumbers[i + (7 - newChildrenCount)] = i + 1;
    }

    const firstMonthDay = moment(td).subtract(td.date() - 1, 'days');
    const firstCalDay = moment(firstMonthDay).subtract(firstMonthDay.days(), 'days');
    const lastMonthDay = moment(td).add(td.daysInMonth() - td.date(), 'days');
    const lastCalDay = moment(lastMonthDay).add(6 - lastMonthDay.days(), 'days');

    return { firstMonthDay, firstCalDay, lastMonthDay, lastCalDay, rows: calendar, };
}

export function placeEvent(event: CalendarEventData, calendar: CalendarData, filters: Filter[]) {
    let { eventInfo, start, end } = event;
    let { firstCalDay, lastCalDay } = calendar;

    if (end.isBefore(firstCalDay) || start.isAfter(lastCalDay)) {
        return;
    }

    if (applyFilters(eventInfo, filters)) {
        event.filtered = true;
    } else {
        event.filtered = false;
    }

    // Reset start to firstCalDay if the actual start is before the current month.
    start = start.isBefore(firstCalDay) ? firstCalDay : start;

    // The Math.ceil call corrects for messed up daylight savings timespans
    const span = Math.round(moment.duration(moment(end).diff(moment(start))).asDays());
    const daysSinceCalStart = Math.floor(moment.duration(start.diff(firstCalDay)).asDays());
    const col = daysSinceCalStart % 7;
    const row = ~~(daysSinceCalStart / 7);

    const calDay = calendar.rows[row].days[col];

    const startCol = col + 1;
    const endCol = Math.max(Math.min(9, startCol + span), startCol + 1);

    // If this event is long, and if it intersects with another event in a later column, move this entire
    // event up one row to keep them from intersecting
    if (endCol > startCol + 1) {
        for (let checkCol = startCol; checkCol < endCol; checkCol++) {
            if (calendar.rows[row].days[checkCol]) {
                event.startRow = calendar.rows[row].days[checkCol].events.length + 1;
                event.endRow = event.startRow + 1;
                break;
            }
        }
    }

    if (endCol > (startCol + 1)) {
        for (let i = 1; i < Math.min(7 - col, span + 1); i++) {
            calendar.rows[row].days[col + i].events.push({
                eventInfo,
                start,
                end,
                filtered: event.filtered,
                initialPlacement: false
            });
        }
    }
    if (endCol > 8) {
        placeEvent({
            eventInfo,
            end,
            initialPlacement: true,
            filtered: event.filtered,
            start: moment(start).startOf('day').add(7 - col, 'days')
        }, calendar, filters);
    }

    event.startCol = startCol;
    event.endCol = endCol;
    calDay.events.push(event);
}

export function applyFilters(eventInfo: EventInfo, filters: Filter[]): boolean {
    for (let filter of filters) {
        const eventRealmId = eventInfo[eventInfo.realm + '_id'];
        // !== is an xor: positive filters invert the output of the normal filter
        if (filter.course_ids.map(identifier => identifier.course_id).some(id => id == eventRealmId) !== filter.positive) {
            return true;
        }
    }
    return false;
}
