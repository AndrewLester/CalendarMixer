function get(url) {
    return new Promise(resolve => {
        $.ajax({
            dataType: 'json',
            url: url,
            ifModified: true,
            success: data => resolve(data)
        });
    });
}

function post(url) {
    
}

const colors = [
    'rgba(236, 252, 17, 0.5)', 'rgba(17, 182, 252, 0.5)', 'rgba(248, 17, 252, 0.5)', 
    'rgba(244, 26, 26, 0.5)', 'rgba(46, 224, 11, 0.5)', 'rgba(237, 138, 33, 0.5)', 
    'rgba(76, 255, 174, 0.5)', 'rgba(41, 38, 255, 0.5)', 'rgba(179, 58, 255, 0.5)'
];

function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

function handleFilteredElement(elem) {
    elem.classList.add('filtered');
}

function addElement(parent, name, filtered, openRow, start, end, long) {
    let color = colors[~~(Math.random() * colors.length)];
    let text = document.createElement('div');
    text.classList.add(initial ? 'added' : 'shown');
    if (long) {
        text.classList.add('long');
    }
    text.textContent = name;
    text.style.backgroundColor = color;
    text.style.gridColumn = start + ' / ' + end;
    let endRow = openRow + 1;
    let added = 0;
    if (filtered) {
        handleFilteredElement(text);
    }
    parent.append(text);
    // -- Section * Styling that requires element dimensions --
    if (isOverflown(text) && !long) {
        // Correct for new height being 45px. This line height increase helps hide any third row of text.
        text.style.lineHeight = '21px';
        endRow += 1;
        added = 1;
    }
    text.style.setProperty('--start-row', openRow);
    text.style.gridRow = openRow + ' / ' + endRow;
    // -- Section --
    tippy(text, {content: name, arrow: true, duration: [100, 100]});
    if (initial) {
        setTimeout(() => text.classList.replace('added', 'shown'), 100);
    }
    return added;
}

function filterEvent(event, filters) {
    for (let filter of filters) {
        for (let course_id of filter.course_ids) {
            let eventId = event['section_id'] || event['group_id'];
            // xor: only one side can be true for the output to be true;
            if ((course_id.id == eventId) ^ filter.positive) {
                return false;
            }
        }
    }
    return true;
}

var data;
var filters;
var identifiers;
var initial = true;

async function addAllEvents() {
    data = data || await get('calendar/events');
    filters = filters || await get('calendar/filter');
    if (initial) {
        for (let row of eventRows) {
            row.innerHTML = '';
            row.classList.remove('event-row-skeleton');
        }
    }
    for (let event of data) {
        let filtered = !filterEvent(event, filters);
        let start = moment(event['start'].split(' ')[0], 'YYYY-MM-DD');
        let end = moment(event['end'].split(' ')[0], 'YYYY-MM-DD');
        if (!event['has_end']) {
            end = start;
        }
        placeEvent(event, start, end, filtered);
    }
    identifiers = identifiers || await get('calendar/identifiers');
    initial = false;
}

addAllEvents()

function autoSizing(data) {
    data.styles.width = data.offsets.reference.width;
    data.offsets.popper.left = data.offsets.reference.left;
    return data;
}

let popperElement = document.getElementById('identifier-complete');
let courseAutoComplete = new Popper(document.getElementsByClassName('course-chooser')[0], popperElement, {
    onCreate: () => popperElement.style.display = 'flex',
    modifiers: {
        autoSizing: {
            enabled: true,
            fn: autoSizing,
            order: 840,
        }
    }
});
console.log(courseAutoComplete);
