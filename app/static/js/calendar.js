var eventList = $('#event-list'),
    filterList = $('#filter-list-ul'),
    calendarGrid = $('#calendar-grid');

function getData() {
    return new Promise(resolve => {
        $.ajax({
            dataType: 'json',
            url: 'calendar/events',
            ifModified: true,
            success: data => resolve(data)
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let colors = ['rgba(236, 252, 17, 0.5)', 'rgba(17, 182, 252, 0.5)', 'rgba(248, 17, 252, 0.5)', 
            'rgba(244, 26, 26, 0.5)', 'rgba(46, 224, 11, 0.5)'
];

function addElement(parent, name, color, start, end, long) {
    let text = document.createElement('div');
    text.classList.add('tooltip', 'added');
    if (long) {
        text.classList.add('long');
    }
    text.textContent = name;
    text.style.backgroundColor = color;
    text.style.gridColumn = start + ' / ' + end;
    parent.append(text);
    tippy(text, {
        content: name,
        arrow: true,
        duration: [100, 100]
    });
    setTimeout(() => {
        text.classList.replace('added', 'shown');
    }, 100);
    setTimeout(() => {
        text.classList.replace('complete', 'added');
    }, 3000);
}

eventRows = document.querySelectorAll('.event-row');

async function add() {
    await sleep(2000);
    var elem = document.getElementById('row1-events');
    for (let row of eventRows) {
        row.innerHTML = '';
        row.classList.remove('event-row-skeleton');
    }
    
    //TODO: Place Longest spanning events first.
    //TODO: Sort elements by soonest to furthest away in time.
    
    let data = await getData();

    for (let event of data) {
        let start = moment(event['start'].split(' ')[0], 'YYYY-MM-DD');
        let end = moment(event['end'].split(' ')[0], 'YYYY-MM-DD');
        if (!event['has_end']) {
            end = start;
        }
        placeEvent(event, start, end);
    }

    // addElement(elem, 'Block 1 Final Exam', 'rgba(244, 26, 26, 0.5)', 1, 5);
    // addElement(elem, 'Block 2 Final Exam', 'rgba(248, 17, 252, 0.5)', 2, 3);
    // addElement(elem, 'Block 3 Final Exam', 'rgba(17, 182, 252, 0.5)', 4, 5);
    // addElement(elem, 'Block 4 Final Exam', 'rgba(236, 252, 17, 0.5)', 5, 6);

    // addElement(document.getElementById('row2-events'), 'Wow cool event', 'rgba(46, 224, 11, 0.5)', 3, 7);
    // addElement(document.getElementById('row2-events'), 'codeninjatime', 'rgba(96,72,38,1)',1 ,9 );
    
    // for (let i = 0; i < 50; i++) {
        
        
        
        
    //     //await sleep(500);
    // }
}
let calendar = [[],[],[],[],[],[]];
let rows = document.querySelectorAll('.calendar-row .header');
let firstDayOfWeek = moment().subtract(moment().date() - 1, 'days').days();
let daysInPrevMonth = moment().subtract(1, 'months').daysInMonth();
for (let i = 0; i < firstDayOfWeek; i++) {
    let elem = document.createElement('div');
    elem.style.color = 'gray';
    elem.textContent = daysInPrevMonth - (firstDayOfWeek - i - 1);
    calendar[0][i] = daysInPrevMonth - (firstDayOfWeek - i - 1);
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
    calendar[~~((i + firstDayOfWeek) / 7)][(i + firstDayOfWeek) % 7] = i + 1;
    
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
    calendar[calendar.length - rowSubtract][i + (7 - childNum)] = i + 1;
    row.append(elem);
}

// for (let row of eventRows) {
//     for (let i = 0; i < 3; i++) {
//         let skeleton = document.createElement('div');
//         skeleton.classList.add('skeleton');
//         let low = ~~(Math.random() * 7 + 1)
//         let high = ~~(Math.random() * (7 - (low + 1)) + (low + 1));
//         skeleton.style.gridColumn =  low + ' / ' + high;
//         row.append(skeleton);
//     }
// }
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
function placeEvent(event, start, end) {
    if (start.isBefore(firstCalDay) || start.isAfter(lastCalDay)) {
        return;
    }

    let span = moment.duration(end.diff(start));
    let startCol = 1;
    let endCol = 2;
    let eventRow = 1;
    top_loop:
    for (let calRow of calendar) {
        for (let calDay of calRow) {
            if (calDay === start.date()) {
                startCol = calRow.indexOf(calDay) + 1;
                eventRow = calendar.indexOf(calRow) + 1;
                endCol = calRow.indexOf(calDay + (span.asDays() + 1)) + 1;
                break top_loop;
            }
        }
    }
    let elem = document.getElementById('row' + eventRow + '-events');
    addElement(elem, event['title'], colors[~~(Math.random() * colors.length)], startCol, endCol, span.asDays() > 0);
}

add()
