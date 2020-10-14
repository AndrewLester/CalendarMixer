import moment from 'moment';
import type { EventInfo, Filter } from '../api/types';

export interface CalendarData {
    rows: CalendarRowData[];
    firstCalDay: moment.Moment;
    firstMonthDay: moment.Moment;
    lastCalDay: moment.Moment;
    lastMonthDay: moment.Moment;
    filled?: boolean;
}

export interface CalendarDayData {
    dayOfMonth: number;
    events: CalendarEventData[];
    otherMonth: boolean;
    currentRow?: number;
}

export interface CalendarEventData {
    eventInfo: EventInfo;
    start: moment.Moment;
    end: moment.Moment;
    initialPlacement: boolean;
    startCol?: number;
    endCol?: number;
    filtered?: boolean;
    endRow?: number;
    startRow?: number;
}

export interface CalendarRowData {
    dayNumbers: number[];
    days: CalendarDayData[];
    unused: boolean;
}

export function buildCalendarStructure(month: moment.Moment): CalendarData {
    const calendar: CalendarRowData[] = [];

    // Duplicate moment because it's mutable value
    const td = moment(month);

    const firstDayWeekPos = moment(td)
        .subtract(td.date() - 1, 'days')
        .days();
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

    let lastRowIndex = calendar.length - 1;
    if (calendar[lastRowIndex].days.length === 0) {
        // Set last calendar row to unused
        calendar[lastRowIndex].unused = true;
        lastRowIndex--;
    }

    const lastRow = calendar[lastRowIndex];
    const newChildrenCount = 7 - lastRow.days.length;
    for (let i = 0; i < newChildrenCount; i++) {
        let calDay = { dayOfMonth: i + 1, events: [], otherMonth: true };
        lastRow.days[i + (7 - newChildrenCount)] = calDay;
        lastRow.dayNumbers[i + (7 - newChildrenCount)] = i + 1;
    }

    const firstMonthDay = moment(td).subtract(td.date() - 1, 'days');
    const firstCalDay = moment(firstMonthDay).subtract(
        firstMonthDay.days(),
        'days'
    );
    const lastMonthDay = moment(td).add(td.daysInMonth() - td.date(), 'days');
    const lastCalDay = moment(lastMonthDay).add(
        6 - lastMonthDay.days(),
        'days'
    );

    return {
        firstMonthDay,
        firstCalDay,
        lastMonthDay,
        lastCalDay,
        rows: calendar,
    };
}

export function placeEvent(
    event: CalendarEventData,
    calendar: CalendarData,
    filters: Filter[]
) {
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

    // The number of days the event spans over
    const span =
        moment(end).endOf('day').diff(moment(start).startOf('day'), 'days') + 1;
    const daysSinceCalStart = start.diff(firstCalDay, 'days');

    const col = daysSinceCalStart % 7;
    const row = ~~(daysSinceCalStart / 7);

    const calDay = calendar.rows[row].days[col];

    const gridStartCol = col + 1;
    const gridEndCol = Math.min(8, Math.max(gridStartCol + span, gridStartCol + 1));

    // If the event is "long" (> 1 column)
    if (gridEndCol > gridStartCol + 1) {
        // If this event is long, and if it intersects with another event in a later column,
        // move this entire event up one row to keep them from intersecting
        for (let checkCol = gridStartCol; checkCol < gridEndCol; checkCol++) {
            if (calendar.rows[row].days[checkCol]) {
                event.startRow =
                    calendar.rows[row].days[checkCol].events.length + 1;
                event.endRow = event.startRow + 1;
                break;
            }
        }

        for (let i = 1; i < Math.min(7 - col, span + 1); i++) {
            calendar.rows[row].days[col + i].events.push({
                eventInfo,
                start,
                end,
                filtered: event.filtered,
                initialPlacement: false,
            });
        }
    }

    // Recalculate the end column here to find the actual event length
    if (Math.max(gridStartCol + span, gridStartCol + 1) > 8) {
        placeEvent(
            {
                eventInfo,
                end,
                initialPlacement: true,
                filtered: event.filtered,
                start: moment(start).add(7 - col, 'days').startOf('day'),
            },
            calendar,
            filters
        );
    }

    event.startCol = gridStartCol;
    event.endCol = gridEndCol;
    calDay.events.push(event);
}

export function applyFilters(eventInfo: EventInfo, filters: Filter[]): boolean {
    for (let filter of filters) {
        const eventRealmId: string = eventInfo[eventInfo.realm + '_id'].toString();
        // !== is an xor: positive filters invert the output of the normal filter
        if (
            filter.course_ids
                // @ts-ignore
                .map((identifier) => identifier.id)
                .some((id) => id.toString() == eventRealmId) !== filter.positive
        ) {
            return true;
        }
    }
    return false;
}
