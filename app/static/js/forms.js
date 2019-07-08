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

    async function saveForm(elem, postFunction, url) {
        let formData = new FormData();
        formData.append('filter_id', JSON.stringify({data: elem.dataset.filterId}));
        formData.append('positive', JSON.stringify({data: $(elem).find('.filter-type').prop('checked')}));
        formData.append('course_ids', JSON.stringify({data: $.map($(elem).find('.recognized-course'), e => e.dataset).map(d => {
            return {course_id: d.courseId, course_name: d.courseName, course_realm: d.realm}
        })}));
            
        await postFunction(url, formData);
    }

    function addSubmitListener(elem, postFunction, url) {
        elem.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveForm(elem, postFunction, url);
        }, false);
    }

    function addRecognizedCourse(dataset, form, inputElem) {
        let template = $('#recognized-course-template').html();
        Mustache.parse(template);
        var rendered = Mustache.render(template, dataset);
        rendered = $(rendered).insertBefore(inputElem);
        $(rendered).find('.delete-icon').click(function(){
            this.parentElement.parentElement.removeChild(this.parentElement);
            $(form).trigger('change');
        });
        $(form).trigger('change');
    }

    function createAutocompleteMultiInput(form, wrapper, input, popperTemplate, completionsList) {
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
            if (popper !== null) return;
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
                    addToAutocomplete(id);
                    if (input.value.length !== 0) {
                        input.dispatchEvent(new KeyboardEvent('keyup', { 'key': '' }));
                    }
                }
            });
        }
        function addToAutocomplete(identifier, startPos, length) {
            let template = $('#popper-item-template').html();
            let dataset = Object.assign({}, identifier);
            let courseName = Object.values(dataset)[0];
            Mustache.parse(template);
            if (startPos !== undefined) {
                dataset.start_pos = true;
                dataset.bold = courseName.slice(startPos, startPos + length);
                dataset.name_begin = courseName.slice(0, startPos);
                dataset.name_end = courseName.slice(startPos + length);
            } else {
                dataset.name = courseName;
            }
            let rendered = Mustache.render(template, dataset);
            rendered = $(rendered).appendTo(popperTemplate);
            $(rendered).click(function(){
                addRecognizedCourse({ name: courseName, id: Object.keys(identifier)[0], realm: identifier.realm }, form, input);
                input.value = '';
                input.focus();
                destroyPopper();
            });
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
        input.addEventListener('keyup', function () {
            if (!completionsList.completions) return;
            if (popper === null) createPopper();

            let matches = false;
            popperTemplate.innerHTML = '';
            for (let completion of completionsList.completions) {
                if (isAlreadyUsed(completion)) continue;
                let name = Object.values(completion)[0];
                let words = name.split(' ');
                for (let word of words) {
                    let identifiedString = name.substring(name.indexOf(word));
                    if (!this.value || identifiedString.toLowerCase().startsWith(this.value.toLowerCase())) {
                        matches = true;
                        addToAutocomplete(completion,
                            name.indexOf(identifiedString), this.value.length);
                        break;
                    }
                }
            }
            if (!matches) {
                $('<p>No Matches</p>').appendTo(popperTemplate);
            }
        });
        document.addEventListener('mousedown', destroyPopper, false);
        popperTemplate.addEventListener('mousedown', e => e.stopPropagation(), false);
        input.addEventListener('mousedown', e => e.stopPropagation(), false);
    }
    return {
        addRecognizedCourse,
        asyncAutocompleteList,
        createAutocompleteMultiInput,
        addSubmitListener,
        saveForm
    }
}());