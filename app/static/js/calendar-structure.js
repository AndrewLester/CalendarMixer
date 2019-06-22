var eventList = $('#event-list'),
    filterList = $('#filter-list-ul'),
    calendarGrid = $('#calendar'),
    eventRows = $('.event-row'),
    previousMonthButton = $('#previous-month'),
    nextMonthButton =  $('#next-month'),
    currentDateLabel = $('#current-date');

let calendar = [[],[],[],[],[],[]];
// Create "now" moment to store changes in viewed calendar month.
let linkDate = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];
let now = moment(linkDate, 'YYYY-MM').isValid() ? moment(linkDate, 'YYYY-MM') : moment();
let rows = document.querySelectorAll('.calendar-row .header');

var firstCalDay;
var firstMonthDay;
var lastCalDay;
var lastMonthDay;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildCalendarStructure(today) {
    // Setup month change buttons first
    currentDateLabel.text(moment(today).format('MMMM YYYY'));
    nextMonthButton.text(moment(today).add(1, 'months').format('MMM') + ' →');
    previousMonthButton.text('← ' + moment(today).subtract(1, 'months').format('MMM'));

    let firstDayOfWeek = moment(today).subtract(moment(today).date() - 1, 'days').days();
    let daysInPrevMonth = moment(today).subtract(1, 'months').daysInMonth();
    for (let i = 0; i < firstDayOfWeek; i++) {
        let elem = document.createElement('div');
        elem.classList.add('other-month');
        elem.textContent = daysInPrevMonth - (firstDayOfWeek - i - 1);
        calendar[0][i] = {day: daysInPrevMonth - (firstDayOfWeek - i - 1), currentRow: 1};
        rows[0].append(elem);
    }
    
    for (let i = 0; i < moment(today).daysInMonth(); i++) {
        let wrapper = document.createElement('div');
        if ((i + 1) == moment(today).date() &&
         moment().year() === moment(today).year() && moment().month === moment(today).month()) {
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
        // Hide unused last calendar row
        row.parentElement.classList.add('unused');
        rowSubtract = 2;
        row = rows[rows.length - 2];
    }
    let childNum = 7 - row.childElementCount;
    for (let i = 0; i < childNum; i++) {
        let elem = document.createElement('div');
        elem.classList.add('other-month');
        elem.textContent = i + 1;
        calendar[calendar.length - rowSubtract][i + (7 - childNum)] = {day: i + 1, currentRow: 1};
        row.append(elem);
    }

    firstMonthDay = moment(today).subtract(moment(today).date() - 1, 'days');
    firstCalDay = firstMonthDay.subtract(firstMonthDay.days(), 'days');
    lastMonthDay = moment(today).add(moment(today).daysInMonth() - moment(today).date(), 'days');
    lastCalDay = lastMonthDay.add(6 - lastMonthDay.days(), 'days');
}

buildCalendarStructure(now.startOf('day'));

async function navigateMonths(months) {
    calendarGrid.removeClass('moving-right moving-left');
    await sleep(20);
    calendarGrid.addClass(months > 0 ? 'moving-right' : 'moving-left');
    // Wait for half of animation to finish
    await sleep(150);
    clearCalendar();
    buildCalendarStructure(now.add(months, 'months'));
    document.dispatchEvent(new Event('monthChange'));
}

previousMonthButton.click(navigateMonths.bind(null, -1));
nextMonthButton.click(navigateMonths.bind(null, 1));

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

function clearCalendar() {
    calendar = [[],[],[],[],[],[]];

    for (let header of rows) {
        header.parentElement.classList.remove('unused');
        header.innerHTML = '';
        header.parentElement.lastElementChild.innerHTML = '';
    }
}