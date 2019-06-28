const FORMS = (function () {
    function asyncAutocompleteList() {
        return {
            set completions(value) {
                value.then(v => {
                    if (this.listener && this.value !== v) {
                        this.listener(v);
                    }
                    this.value = v;
                })
            },
            get completions() {
                return this.value;
            },
            whenSet: function (val) {
                if (this.value) {
                    val(this.value);
                }
                this.listener = val;
            }
        }
    }

    for (let deleteIcon of document.querySelectorAll('.delete-icon')) {
        let recognizedCourse = deleteIcon.parentElement;
        deleteIcon.addEventListener('click', () => recognizedCourse.parentElement.removeChild(recognizedCourse));
    }

    function addSubmitListener(elem, postFunction, url) {
        elem.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let formData = new FormData(elem);
            formData.append('positive', $(elem).find('.filter-type').value == 'checked');
            let ids = $.map($(elem).find('.recognized-course'), e => e.dataset).map(d => {
                return {
                    course_id: d.courseId,
                    course_name: d.courseName,
                    course_realm: d.realm
                }
            });
            formData.append('course_ids', ids);
            postFunction(url, formData);
        }, false);
    }

    function addRecognizedCourse(dataset, wrapper, inputElem) {
        let template = $('#recognized-course-template').html();
        Mustache.parse(template);
        var rendered = Mustache.render(template, dataset);
        $(rendered).insertBefore(inputElem);
        $(wrapper).find('.delete-icon').click(() => $(wrapper).remove($(rendered)));
        // let recognizedCourse = document.createElement('div');
        // recognizedCourse.classList.add('recognized-course');
        // let text = document.createElement('div');
        // text.textContent = dataset.courseName;
        // let deleteIcon = document.createElement('img');
        // deleteIcon.src = '/static/img/close.svg';
        // deleteIcon.classList.add('delete-icon');
        // deleteIcon.addEventListener('click', );
        // recognizedCourse.append(text);
        // recognizedCourse.append(deleteIcon);
        // recognizedCourse.dataset.courseName = dataset.courseName;
        // recognizedCourse.dataset.courseId = dataset.courseId;
        // recognizedCourse.dataset.realm = dataset.realm;
        // wrapper.insertBefore(recognizedCourse, inputElem);
    }

    function createAutocompleteMultiInput(wrapper, input, popperTemplate, completionsList) {
        let popper = null;
        function isAlreadyUsed(completion) {
            let recognized = wrapper.querySelectorAll('div.recognized-course');
            for (let elem of recognized) {
                if (elem.dataset.courseName == Object.values(completion)[0] &&
                    elem.dataset.courseId == Object.keys(completion)[0] &&
                    elem.dataset.realm == completion.realm) {
                    return true;
                }
            }
            return false;
        }
        function popperSizeModifier(data) {
            data.styles.width = data.offsets.reference.width;
            data.offsets.popper.left = data.offsets.reference.left;
            return data;
        }
        function createPopper() {
            completionsList.whenSet(val => {
                popper = new Popper(wrapper, popperTemplate, {
                    onCreate: () => popperTemplate.style.display = 'flex',
                    modifiers: {
                        flip: { enabled: false },
                        autoSizing: {
                            enabled: true,
                            fn: popperSizeModifier,
                            order: 840,
                        }
                    }
                });
                for (let id of val) {
                    if (isAlreadyUsed(id)) continue;
                    popperTemplate.append(createCourseElement(id));
                    if (input.value.length !== 0) {
                        input.dispatchEvent(new KeyboardEvent('keyup', { 'key': '' }));
                    }
                }
            });
        }
        function createCourseElement(identifier, startPos, length) {
            let wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('course-identifier-wrapper');
            let image = document.createElement('div');
            let name = document.createElement('p');
            let courseName = Object.values(identifier)[0];
            if (startPos !== undefined) {
                let span = document.createElement('span');
                span.textContent = courseName.slice(startPos, startPos + length);
                span.style.fontWeight = 'bold';
                name.append(span);
                name.insertAdjacentText('afterbegin', courseName.slice(0, startPos));
                name.insertAdjacentText('beforeend', courseName.slice(startPos + length));
            } else {
                name.textContent = courseName;
            }
            wrapperDiv.dataset.realm = identifier.realm;
            wrapperDiv.append(image, name);
            wrapperDiv.addEventListener('click', function () {
                addRecognizedCourse({ name: courseName, id: Object.keys(identifier)[0], realm: identifier.realm }, wrapper, input);
                input.value = '';
                input.focus();
                destroyPopper();
            });
            return wrapperDiv;
        }
        function destroyPopper() {
            if (popper !== null) {
                popper.destroy();
                popperTemplate.style.display = 'none';
                popperTemplate.innerHTML = '';
                popper = null;
            }
        }
        input.addEventListener('focus', function() {
            createPopper();
            $(this).parent().css('border-bottom-color', '#29b6f6');
        });
        $(input).blur(e => $(e.target).parent().css('border-bottom-color', 'gray'));
        input.addEventListener('keyup', function (e) {
            if (!completionsList.completions) return;
            if (popper === null) createPopper();

            let matches = [];
            for (let completion of completionsList.completions) {
                if (isAlreadyUsed(completion)) continue;
                let name = Object.values(completion)[0];
                let words = name.split(' ');
                for (let word of words) {
                    let identifiedString = name.substring(name.indexOf(word));
                    if (!this.value || identifiedString.toLowerCase().startsWith(this.value.toLowerCase())) {
                        matches.push(createCourseElement(completion,
                            name.indexOf(identifiedString), this.value.length));
                        break;
                    }
                }
            }
            if (matches.length === 0) {
                let noItems = document.createElement('p');
                noItems.textContent = 'No Matches';
                matches.push(noItems);
            }
            popperTemplate.innerHTML = '';
            matches.forEach(e => popperTemplate.append(e));
        });
        document.addEventListener('mousedown', destroyPopper, false);
        popperTemplate.addEventListener('mousedown', e => e.stopPropagation(), false);
        input.addEventListener('mousedown', e => e.stopPropagation(), false);
    }
    return {
        addRecognizedCourse,
        asyncAutocompleteList,
        createAutocompleteMultiInput,
        addSubmitListener
    }
}());