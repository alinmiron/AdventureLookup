// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

(function () {
    const DEBOUNCE = 250;
    const $page = $('#page--create-adventure, #page--edit-adventure');
    if (!$page.length) {
        return;
    }

    const similarTitlesUrl = $page.data('similar-titles-url');
    const searchUrl = $page.data('search-url');

    let $title = $('#appbundle_adventure_title');
    $title.on('change keyup paste', debounce(function (e) {
        $.getJSON(similarTitlesUrl, {
            q: $(this).val()
        }).done(function (data) {
            const similarAdventuresWarning = $('.similar-adventures-warning');
            const similarAdventuresList = $('.similar-adventures-list');
            if (data.length === 0) {
                similarAdventuresWarning.addClass('hidden-xs-up');
            } else {
                similarAdventuresList.empty();
                for (let i = 0; i < data.length; i++) {
                    const adventure = data[i];
                    const link = $('<a></a>');
                    link.text(adventure.title);
                    link.attr('target', '_blank');
                    // TODO: We should not hardcode the URL here!
                    link.attr('href', '/adventures/' + adventure['slug']);
                    similarAdventuresList.append($('<li></li>').append(link));
                }
                similarAdventuresWarning.removeClass('hidden-xs-up');
            }
        })
    }, DEBOUNCE));

    $('input[data-autocomplete]').each(function () {
        const $field = $(this);
        const fieldName = $field.attr('id').split('_').pop();
        $field.selectize({
            create: true,
            valueField: 'title',
            labelField: 'title',
            searchField: 'title',
            maxItems: 1,
            preload: 'focus',
            load: function(query, callback) {
                $.ajax({
                    url: searchUrl.replace(/__FIELD__/g, fieldName),
                    data: {
                        q: query
                    },
                    type: 'GET',
                    error: function() {
                        callback();
                    },
                    success: function(res) {
                        callback(res.map((content) => {return {'title': content}}));
                    }
                });
            }
        });
    });

    let newFieldIndex = 0;

    $('select[name^="appbundle_adventure"]').each(function () {
        const $select = $(this);
        const fieldName = $select.attr('id').split('_').pop();

        let createNewItemCallback = false;
        if ($select.data('allow-add')) {
            createNewItemCallback = function(query, callback) {
                const $modal = $('#newFieldContentModal');
                const $modalForm = $modal.find('.modal-form');
                const $modalAddBtn = $modal.find('#newFieldContentModal-add');

                // Create new form
                const $newEntities = $(`#appbundle_adventure_${fieldName}-new`);
                const prototype = $newEntities
                    .data('prototype')
                    .replace(/__name__/g, ++newFieldIndex)
                    .replace(/__label__/g, '');
                $modalForm.html(prototype);
                $modalForm.find('select').selectize();

                // Set name attribute
                const $nameInput = $(`#appbundle_adventure_${fieldName}-new_${newFieldIndex}_name`);
                $nameInput.val(query);

                $modalAddBtn.one('click', () => {
                    $modalAddBtn.attr('disabled', true);
                    $modalForm.children()
                        .addClass('d-none')
                        .appendTo($newEntities);
                    callback({title: query, value: 'n' + query});
                    $modal.one('hidden.bs.modal', () => {
                        selectized.focus();
                    });
                    $modal.modal('hide');
                });
                $modalAddBtn.attr('disabled', false);

                $modal.one('shown.bs.modal', function () {
                    $modalAddBtn.focus()
                });
                $modal.modal('show');
            };
        }

        const selectized = $select.selectize({
            create: createNewItemCallback,
            //sortField: 'title',
            //valueField: 'title',
            labelField: 'title',
            maxItems: $select.attr('multiple') ? null : 1,
            preload: 'focus',
            searchField: 'title',
            render: {
                option: function(item, escape) {
                    return '<div>' + escape(item.title) + '</div>';
                }
            },
            load: function(query, callback) {
                $.ajax({
                    url: searchUrl.replace(/__FIELD__/g, fieldName),
                    data: {
                        q: query
                    },
                    type: 'GET',
                    error: function() {
                        callback();
                    },
                    success: function(res) {
                        callback(res.map((content) => {return {'title': content}}));
                    }
                });
            }
        })[0].selectize;
    });
})();