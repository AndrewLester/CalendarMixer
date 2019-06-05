var eventList = $('#event-list'),
    filterList = $('#filter-list-ul');

function getData(url, mapper, list) {
    for (let i = 0; i < 5; i++) {
        let elem = document.createElement('li');
        let half = list.width() / 2;
        let width = ~~(Math.random() * (list.width() - half) + half);
        elem.style.setProperty('--width', width + 'px');
        elem.style.width = 'var(--width)';
        list.append(elem);
    }
    $.ajax({
        dataType: 'json',
        url: url,
        success: data => {
                    list.empty();
                    for (let item of data) {
                        let elem = document.createElement('li');
                        mapper(elem, item);
                        list.append(elem);
                        setTimeout(() => list.addClass('shown'), 100);
                    }}
    }).done(() => {
        list.removeClass('skeleton');
    });
}

getData('calendar/events', (elem, item) => elem.textContent = item.title, eventList);
getData('calendar/filter', (elem, item) => elem.textContent = item.course_ids.map(id => id.name).join(', '), filterList);