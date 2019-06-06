var eventList = $('#event-list'),
    filterList = $('#filter-list-ul'),
    calendarGrid = $('#calendar-grid');

function Skeleton(parent, elementType) {
    this.parent = parent;
    this.elementType = elementType;
}

Skeleton.prototype.remove = function() {

}

Skeleton.prototype.apply = function() {

}

function skeletonUl(list) {
    for (let i = 0; i < 5; i++) {
        let elem = document.createElement('li');
        let half = list.width() / 2;
        let width = ~~(Math.random() * (list.width() - half) + half);
        elem.style.setProperty('--width', width + 'px');
        elem.style.width = 'var(--width)';
        list.append(elem);
    }
}

function skeletonDiv(parent) {
    for (let i = 0; i < 5; i++) {
        let elem = document.createElement('div');
        elem.style.gridColumn = '1 / ' + ~~(Math.random() * 7 + 1);
        elem.style.gridRow = Math.min(i + 2, 5);
        parent.append(elem);
        elem.classList.add('skeleton');
        let half = elem.style.width / 2;
        let width = ~~(Math.random() * (elem.style.width - half) + half);
        elem.style.setProperty('--width', width + 'px');
        elem.style.width = 'var(--width)';
    }
}

function getData(url, mapper, skeletonFunction, list) {
    skeletonFunction(list);
    $.ajax({
        dataType: 'json',
        url: url,
        ifModified: true,
        success: data => {
                    list.empty();
                    if (list == eventList) {
                        $('#calendar-grid').find('.skeleton').remove();
                    }
                    for (let item of data) {
                        let elem = document.createElement('li');
                        mapper(elem, item);
                        list.append(elem);
                        setTimeout(() => list.addClass('shown'), 100);
                    }}
    }).done(() => {
        list.removeClass('skeleton');
        //list.width('auto');
    });
}

function placeCalendar(elem, item) {
    elem.textContent = item.title;
    let divElem = document.createElement('div');
    divElem.textContent = elem.textContent;
    calendarGrid.append(divElem);
}

getData('calendar/events', placeCalendar, _ => {
    skeletonDiv(calendarGrid); 
    skeletonUl(eventList);
}, eventList);
getData(
    'calendar/filter', 
    (elem, item) => elem.textContent = item.course_ids.map(id => id.name).join(', '),
    skeletonUl,
    filterList
);