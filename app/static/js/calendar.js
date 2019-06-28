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

function post(url, data) {
    return new Promise(resolve => {
        $.ajax({
            contentType: false,
            processData: false,
            url: url,
            method: 'POST',
            data: data,
            success: data => resolve(data)
        });
    });
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

function addElement(parent, event, filtered, openRow, start, end, long) {
    let name = event['title'];
    let color = colors[~~(Math.random() * colors.length)];
    let text = document.createElement('div');
    text.classList.add(initial ? 'added' : 'shown');
    text.dataset.description = event['description'];
    text.dataset.realm = event['realm'];
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
var identifiers = FORMS.asyncAutocompleteList();
var initial = true;

async function addAllEvents() {
    filters = filters || await get('calendar/filter');
    if (initial) {
        for (let row of eventRows) {
            row.innerHTML = '';
            row.classList.remove('event-row-skeleton');
        }
    }
    data = data || get('calendar/events').then(data => data.forEach(event => {
        let filtered = !filterEvent(event, filters);
        let start = moment(event['start'].split(' ')[0], 'YYYY-MM-DD');
        let end = event['has_end'] ? moment(event['end'].split(' ')[0], 'YYYY-MM-DD') : start;
        placeEvent(event, start, end, filtered);
    }));
    identifiers.completions = identifiers.completions || await get('calendar/identifiers');
    initial = false;
}

addAllEvents()
let template = document.getElementById('identifier-complete');

for (let form of document.forms) {
    if (form.classList.contains('course-filter')) {
        let input = form.querySelectorAll('.course-input')[0];
        FORMS.createAutocompleteMultiInput(input, input.lastElementChild, template, identifiers);
        FORMS.addSubmitListener(form, post, 'calendar/filter');
    }
}
