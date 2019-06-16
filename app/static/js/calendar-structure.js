var eventList = $('#event-list'),
    filterList = $('#filter-list-ul'),
    calendarGrid = $('#calendar-grid'),
    eventRows = $('.event-row');

let calendar = [[],[],[],[],[],[]];
let rows = document.querySelectorAll('.calendar-row .header');

var firstCalDay;
var firstMonthDay;
var lastCalDay;
var lastMonthDay;

function buildCalendarStructure(today) {
    let firstDayOfWeek = moment(today).subtract(moment(today).date() - 1, 'days').days();
    let daysInPrevMonth = moment(today).subtract(1, 'months').daysInMonth();
    for (let i = 0; i < firstDayOfWeek; i++) {
        let elem = document.createElement('div');
        elem.style.color = 'gray';
        elem.textContent = daysInPrevMonth - (firstDayOfWeek - i - 1);
        calendar[0][i] = {day: daysInPrevMonth - (firstDayOfWeek - i - 1), currentRow: 1};
        rows[0].append(elem);
    }
    
    for (let i = 0; i < moment(today).daysInMonth(); i++) {
        let wrapper = document.createElement('div');
        if ((i + 1) == moment(today).date()) {
            let elem = document.createElement('div');
            elem.textContent = i + 1;
            elem.id = 'today';
            wrapper.classList.add('today-wrapper');
            wrapper.append(elem);
        } else {
            wrapper.textContent = i + 1;
        }
        calendar[~~((i + firstDayOfWeek) / 7)][(i + firstDayOfWeek) % 7] = {day: i + 1, currentRow: 1};
        
        rows[~~((i + firstDayOfWeek) / 7)].append(wrapper);
    }
    let rowSubtract = 1;
    let row = rows[rows.length - 1];
    if (rows[rows.length - 2].childElementCount !== 7) {
        rowSubtract = 2;
        row = rows[rows.length - 2];
    }
    let childNum = 7 - row.childElementCount;
    for (let i = 0; i < childNum; i++) {
        let elem = document.createElement('div');
        elem.style.color = 'gray';
        elem.textContent = i + 1;
        calendar[calendar.length - rowSubtract][i + (7 - childNum)] = {day: i + 1, currentRow: 1};
        row.append(elem);
    }

    firstMonthDay = moment(today).subtract(moment(today).date() - 1, 'days');
    firstCalDay = firstMonthDay.subtract(firstMonthDay.days(), 'days');
    lastMonthDay = moment(today).add(moment(today).daysInMonth() - moment(today).date(), 'days');
    lastCalDay = lastMonthDay.add(6 - lastMonthDay.days(), 'days');
}

buildCalendarStructure(moment().startOf('day'));

function placeEvent(event, start, end, filtered) {
    if (start.isBefore(firstCalDay) || start.isAfter(lastCalDay)) {
        return;
    }

    let span = moment.duration(end.diff(start));
    let daysSinceCalStart = moment.duration(start.diff(firstCalDay)).asDays();
    let col = daysSinceCalStart % 7;
    let row = ~~(daysSinceCalStart / 7);
    let calDay = calendar[row][col];

    let startCol = col + 1;
    let eventRow = row + 1;
    let endCol = startCol + (span.asDays() - 1) + 1;
    if (endCol > (startCol + 1)) {
        for (let i = 1; i < Math.min(8, span.asDays()); i++) {
            calendar[row][col + i].currentRow += 1;
        }
    }
    if (endCol > 8) {
        placeEvent(event, start.add(7 - start.days()), span.asDays() - (7 - startCol));
    }
    let elem = document.getElementById('row' + eventRow + '-events');
    let ifAdded = addElement(elem, event['title'], filtered, calDay.currentRow++, startCol, endCol, span.asDays() > 0);
    calDay.currentRow += ifAdded;
}