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
var identifiers = {
    set ids(value) {
        if (this.value !== value) {
            this.listener(value);
        }
        this.value = value;
    },
    get ids() {
        return this.value;
    },
    listener: function(e){},
    whenSet: function(val) {
        if (this.value) {
            val(this.value);
        }
        this.listener = val;
    }
};
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
    identifiers.ids = identifiers.ids || await get('calendar/identifiers');
    initial = false;
}

addAllEvents()

function autoSizing(data) {
    data.styles.width = data.offsets.reference.width;
    data.offsets.popper.left = data.offsets.reference.left;
    return data;
}

let courseAutoComplete = null;

function addRecognizedCourse(wrapper) {
    let recognizedCourse = document.createElement('div');
    recognizedCourse.classList.add('recognized-course');
    let text = document.createElement('div');
    text.textContent = wrapper.dataset.courseName;
    let deleteIcon = document.createElement('div');
    recognizedCourse.append(text);
    recognizedCourse.dataset = wrapper.dataset;
    courseInputBox.insertBefore(recognizedCourse, courseChooser);
}

function createCourseElement(identifier) {
    let wrapper = document.createElement('div');
    wrapper.classList.add('course-identifier-wrapper');
    let image = document.createElement('div');
    let name = document.createElement('p');
    name.textContent = Object.values(identifier)[0];
    wrapper.dataset.courseId = Object.keys(identifier)[0];
    wrapper.dataset.realm = Object.values(identifier)[1];
    wrapper.dataset.courseName = Object.values(identifier)[0];
    wrapper.append(name);
    wrapper.addEventListener('click', function() {
        addRecognizedCourse(this);
        courseChooser.value = '';
        destroyPopper();
    });
    return wrapper;
}

function destroyPopper() {
    if (courseAutoComplete !== null) {
        courseAutoComplete.destroy();
        popperElement.style.display = 'none';
        popperElement.innerHTML = '';
        courseAutoComplete = null;
    }
}

function createPopper() {
    identifiers.whenSet(val => {
        courseAutoComplete = new Popper(document.getElementsByClassName('course-input')[0], popperElement, {
            onCreate: () => {
                popperElement.style.display = 'flex';
            },
            modifiers: {
                flip: {
                    enabled: false
                },
                autoSizing: {
                    enabled: true,
                    fn: autoSizing,
                    order: 840,
                }
            }
        });
        for (let id of val) {
            popperElement.append(createCourseElement(id));
        }
    });
}

let popperElement = document.getElementById('identifier-complete');
let courseChooser = document.getElementsByClassName('course-chooser')[0];
let courseInputBox = document.getElementsByClassName('course-input')[0];

courseChooser.addEventListener('focus', createPopper);

courseChooser.addEventListener('keyup', function(e) {
    if (!identifiers.ids) return;
    let matches = [];
    for (let identifier of identifiers.ids) {
        let name = Object.values(identifier)[0];
        let words = name.split(' ');
        for (let word of words) {
            if (!this.value || 
            name.substring(name.indexOf(word)).toLowerCase().startsWith(this.value.toLowerCase())) {
                matches.push(createCourseElement(identifier));
                break;
            }
        }
    }
    popperElement.innerHTML = '';
    matches.forEach(e => popperElement.append(e));
});
document.addEventListener('mousedown', () => {
    destroyPopper();
}, false);
popperElement.addEventListener('mousedown', e => {
    e.stopPropagation();
}, false);
