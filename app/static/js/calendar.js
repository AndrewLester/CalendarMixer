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
            processData: false,
            contentType: false,
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

function addElement(parent, event, filtered, openRow, start, end, long, init) {
    let name = event['title'];
    let color = colors[~~(Math.random() * colors.length)];
    let text = document.createElement('div');
    text.classList.add(init ? 'added' : 'shown');
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
    if (init) {
        setTimeout(() => text.classList.replace('added', 'shown'), 100);
    }
    return added;
}

function filterEvent(event, filters) {
    for (let filter of filters) {
        let eventRealmId = event[event['realm'] + '_id'];
        // xor: only one side can be true for the output to be true;
        if (filter.course_ids.map(e => e.id).some(id => id == eventRealmId) ^ filter.positive) {
            return false;
        }
    }
    return true;
}

function displayFilters(filters) {
    if (filters.length !== 0) {
        $('#filter-editor').find('.course-filter').remove();
    }
    for (let filter of filters) {
        let template = $('#filter-template').html();
        Mustache.parse(template);
        let rendered = Mustache.render(template, filter, {
            'recognized-course-template': $('#recognized-course-template').html()
        });
        $('#filter-editor').append(rendered);
        let wrapper = $('#filter-editor').find('#filter-form-1');
        wrapper.find('.delete-icon').click(function(){
            wrapper.find('.course-input')[0].removeChild($(this).parent()[0]);
            wrapper.trigger('change');
        });
    }
}

var data;
var filters;
var identifiers = FORMS.asyncAutocompleteList();
var initial = true;

async function addAllEvents() {
    identifiers.completions = (identifiers.completions ? Promise.resolve(identifiers.completions) : false) || get('calendar/identifiers');
    // Await filters because they are necessary to place events
    filters = filters || await get('calendar/filter');
    data = data ? Promise.resolve(data) : get('calendar/events');
    data.then(d => {
        data = d;
        let initial = eventRows[0].classList.contains('event-row-skeleton');
        if (eventRows[0].classList.contains('event-row-skeleton')) {
            for (let row of eventRows) {
                row.innerHTML = '';
                row.classList.remove('event-row-skeleton');
            }
        }
        d.forEach(event => {
            let filtered = !filterEvent(event, filters);
            let start = moment(event['start'].split(' ')[0], 'YYYY-MM-DD');
            let end = event['has_end'] ? moment(event['end'].split(' ')[0], 'YYYY-MM-DD') : start;
            placeEvent(event, start, end, filtered, initial);
        });
    }).catch(e => console.log(e));
    if (initial) {
        displayFilters(filters);
    }
    initial = false;
}

async function generateForms() {
    await addAllEvents()
    let template = document.getElementById('identifier-complete');

    for (let form of document.forms) {
        if (form.classList.contains('course-filter')) {
            $(form).change(filterSaveIcon.clickIcon);
            let input = form.querySelectorAll('.course-input')[0];
            FORMS.createAutocompleteMultiInput(form, input, input.lastElementChild, template, identifiers);
            FORMS.addSubmitListener(form, post, 'calendar/filter');
        }
    }
}

function spinner(element, func) {
    let button = element.find('.icon-button');
    let spinner = element.find('.spinner');
    let text = element.siblings('p');
    spinner.hide();
    let lastSaved;
    button.click(async () => {
        await animationEnd(button, 200);
        button.hide();
        spinner.show();
        await func();
        lastSaved = moment();
        text.text('Last saved a few seconds ago')
        spinner.hide();
        button.show();
    });
    setInterval(() => {
        if (!lastSaved) return;
        text.text('Last saved ' + moment.duration(lastSaved.diff(moment())).humanize(true));
    }, 60000);
    return { clickIcon: () => button.click() };
}
const filterSaveIcon = spinner($('#save-element'), async () => {
    for (let form of document.forms) {
        await FORMS.saveForm(form, post, 'calendar/filter');
    }
});

generateForms();

