var eventList = document.getElementById('event-list'),
    filterSkeleton = document.getElementById('filter-list'),
    filterList = document.getElementById('filter-list-ul');

$.getJSON('calendar/events', (data, status) => {
    if (status !== 'success') {
        console.log(status);
        return;
    }

    for (let event of data) {
        let elem = document.createElement('li');
        elem.textContent = event.title;
        eventList.appendChild(elem);
    }
});

$.getJSON('calendar/filter', (data, status) => {
    if (status !== 'success') {
        console.log(status)
        return;
    }

    for (let filter of data) {
        let elem = document.createElement('li');
        elem.textContent = filter.course_ids.map(id => id.name).join(', ');
        filterList.appendChild(elem);
    }
}).done(() => {
    //$('filter-list').removeClass('skeleton');
});