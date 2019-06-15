var eventList = $('#event-list'),
    filterList = $('#filter-list-ul'),
    calendarGrid = $('#calendar-grid'),
    eventRows = $('.event-row');


let calendar = [[],[],[],[],[],[]];
let rows = document.querySelectorAll('.calendar-row .header');
let firstDayOfWeek = moment().subtract(moment().date() - 1, 'days').days();
let daysInPrevMonth = moment().subtract(1, 'months').daysInMonth();
for (let i = 0; i < firstDayOfWeek; i++) {
    let elem = document.createElement('div');
    elem.style.color = 'gray';
    elem.textContent = daysInPrevMonth - (firstDayOfWeek - i - 1);
    calendar[0][i] = {day: daysInPrevMonth - (firstDayOfWeek - i - 1), currentRow: 1};
    rows[0].append(elem);
}

for (let i = 0; i < moment().daysInMonth(); i++) {
    let wrapper = document.createElement('div');
    if ((i + 1) == moment().date()) {
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
console.log(calendar);
let spans = ['2 / 6', '1 / 3', '5 / 7', '2 / 5', '7 / 8'];
for (let row of eventRows) {
    row.classList.add('event-row-skeleton');
    for (let span of spans) {
        let skeleton = document.createElement('div');
        skeleton.classList.add('skeleton');
        skeleton.style.gridColumn = span;
        row.append(skeleton);
    }
}

let firstMonthDay = moment().subtract(moment().date() - 1, 'days');
let firstCalDay = firstMonthDay.subtract(firstMonthDay.days(), 'days');
let lastMonthDay = moment().add(moment().daysInMonth() - moment().date(), 'days');
let lastCalDay = lastMonthDay.add(6 - lastMonthDay.days(), 'days');
function placeEvent(event, start, end, filtered) {
    if (start.isBefore(firstCalDay) || start.isAfter(lastCalDay)) {
        return;
    }

    let span = moment.duration(end.diff(start));
    let startCol = 1;
    let endCol = 2;
    let eventRow = 1;
    let currentRow = 0;
    let calDayFound = null;
    //TODO: Change from For loops to mod operations

    top_loop:
    for (let calRow of calendar) {
        for (let calDay of calRow) {
            if (calDay.day === start.date()) {
                startCol = calRow.indexOf(calDay) + 1;
                eventRow = calendar.indexOf(calRow) + 1;
                endCol = (calRow.indexOf(calDay) + 1) + (span.asDays() - 1) + 1;
                if (endCol > (startCol + 1)) {
                    for (let i = 1; i < Math.min(8, span.asDays()); i++) {
                        calRow[calRow.indexOf(calDay) + i].currentRow += 1;
                    }
                }
                if (endCol > 8) {
                    placeEvent(event, start.add(7 - start.days()), span.asDays() - (7 - startCol));
                }
                currentRow = calDay.currentRow++;
                calDayFound = calDay;
                break top_loop;
            }
        }
    }
    let elem = document.getElementById('row' + eventRow + '-events');
    let ifAdded = addElement(elem, event['title'], filtered, currentRow, startCol, endCol, span.asDays() > 0);
    calDayFound.currentRow += ifAdded;
}