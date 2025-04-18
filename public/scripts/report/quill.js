import { openTableSelector, mergeSelectedCells, reset } from './table.js';

const Font = Quill.import('formats/font');
Font.whitelist = ['times-new-roman', 'arial', 'courier-new', 'calibri', 'calibri-light'];
Quill.register(Font, true);

export const Instance = new Quill('#editor', {
    modules: {
        syntax: true,
        toolbar: {
            container: '#toolbar-container',
            handlers: {
                'table': function (event) {
                    openTableSelector(Instance, event);
                },
                'mergeCells': function () {
                    mergeSelectedCells(Instance);
                },
                'resetQuill': function () {
                    reset(Instance);
                }
            }
        },
    },
    theme: 'snow',
});
