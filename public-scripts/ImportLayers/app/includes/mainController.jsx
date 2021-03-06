/**
 * Function to generate the controller
 * @param {Object} view the view
 * @return {Object} the controller
 */
var mainController = function (view) {

    /***********************************************
     * Properties
     ***********************************************/

    var that = {};

    // privates
    var my = {};

    my.array_of_checkbox = [];
    my.mainView = view;
    my.progressView;
    my.report;

    /***********************************************
     * Functions
     ***********************************************/


    /**
     * Function to init ui components
     */

    /**
     * Function to run the script
     */
    that.run = function () {

        if (!is_form_valid() ) {
            exit();
        }

        var source_doc = app.activeDocument;
        var target_doc = IN.Document.open(my.mainView.target_path.text);

        // make sure that the document is valid
        is_document_valid(source_doc, target_doc);

        // duplicate very layers
        duplicate_layers(source_doc, target_doc);

    }

    /**
     * Function to valid the form
     * @param {View} mainView the view
     * @param {Folder} folder_source the source folder
     */
    function is_form_valid() {

        var is_valid, str;

        is_valid = true;

        if (!my.mainView.target_path.length) {

            str = TRANS.CONTROLLER.EMPTY_DOC.printf();
            alert(str);
            is_valid = false;

        }

        return is_valid;

    }

    function duplicate_layers(source_doc, target_doc) {


        var source_layers = source_doc.layers;
        var count = source_layers.length;
        var tf_map = {};
        var link_map = [];

        // loop on this array from the end to respect layer order
        for (var i = count - 1; i >= 0; i--) {

            var current_layer_name = source_layers[i].name;
            var checkbox_layer = my.array_of_checkbox.find('text', current_layer_name);

            // add only layer that the user want to add
            if (checkbox_layer.value && checkbox_layer.text === current_layer_name) {

                var current_layer = target_doc.layers.add({name: current_layer_name});
                var all_frames = source_layers[i].pageItems.everyItem().getElements();
                var count_frames = all_frames.length;

                for (var j = count_frames - 1; j >= 0; j--) {


                    if (all_frames[j].constructor.name === 'TextFrame'
                        && my.mainView.items_textframes.value) {

                        copy_with_textframes(all_frames[j], current_layer, tf_map, link_map);

                    }

                    if (all_frames[j].constructor.name === 'Graphic'
                        && my.mainView.items_graphics.value) {

                        copy_with_textframes(all_frames[j], current_layer);

                    }

                    if (all_frames[j].constructor.name !== 'TextFrame' && all_frames[j].constructor.name !== 'Graphic'
                        && my.mainView.items_others.value) {

                        copy_with_textframes(all_frames[j], current_layer);

                    }

                }

            }

        }

        if (my.mainView.repair_textframes.value) {

            repair_text_frames_links(link_map, tf_map);

        }

    }


    /**
     * Function to copy an item to an other layer
     * keep each textframe id to rebuild text threading
     * @param item
     * @param dest_layer
     * @param tf_map
     * @param link_map
     */
    function copy_with_textframes(item, dest_layer, tf_map, link_map) {

        tf_map[item.id] = item.duplicate(dest_layer);

        if (typeof item.previousTextFrame !== "undefined" && item.previousTextFrame && item.textFrameIndex > 0) {

            link_map.push({
                item: item,
                prev: item.previousTextFrame
            });

        }

    };


    /**
     * Function rebuild textframe threading after a copy / paste
     * @param link_map
     * @param tf_map
     */
    function repair_text_frames_links(link_map, tf_map) {

        for (var i = 0; i < link_map.length; i++) {

            var old_item = link_map[i].item;
            var parent_item = tf_map[old_item.id];
            var new_prev_item;

            if (link_map[i].prev) {

                new_prev_item = tf_map[link_map[i].prev.id];
                parent_item.previousTextFrame = new_prev_item; // Set previous (and implicitly merge contents)

            }

        }

    };


    /**
     * Function to check if a document is valid
     * (same number of pages in source and target document, same size, same number of spread)
     * @param source_doc
     * @param target_doc
     */
    function is_document_valid(source_doc, target_doc) {

        if (source_doc.pages.length !== target_doc.pages.length) {

            throw {
                name: 'InvalidDocumentError',
                message: 'number of pages of both documents must be the same',
                fileName: $.fileName,
                lineNumber: $.line
            };

        }

        if (source_doc.documentPreferences.pageWidth !== target_doc.documentPreferences.pageWidth) {

            throw {
                name: 'InvalidDocumentError',
                message: 'the witdh of both document aren\'t the same',
                fileName: $.fileName,
                lineNumber: $.line
            };

        }

        if (source_doc.documentPreferences.pageHeight !== target_doc.documentPreferences.pageHeight) {

            throw {
                name: 'InvalidDocumentError',
                message: 'height of both document aren\'t the same',
                fileName: $.fileName,
                lineNumber: $.line
            };

        }

        for (var i = 0; i < source_doc.spreads.length; i++) {

            if (source_doc.spreads[i].pages.length !== target_doc.spreads[i].pages.length) {

                throw {
                    name: 'InvalidDocumentError',
                    message: 'Documents do not have the same number of spreads per page',
                    fileName: $.fileName,
                    lineNumber: $.line
                };

            }

        }

    };


    /**
     *
     */
    function init() {

        var layers = app.activeDocument.layers;

        // add layer to group
        if (layers) {

            /**
             * build a matrices with x rows of 3 element
             * each row is a new group
             */
            var MAX_ELEMENT_ROW = 3;
            var NUMBER_OF_ROW = Math.ceil(layers.length / MAX_ELEMENT_ROW);
            var i = 0;

            for (var row = 0; row < NUMBER_OF_ROW; row++) {

                // build a new row
                var grp = my.mainView.pans.layers.group('layers', {
                    orientation: 'row',
                    alignChildren: 'left',
                    alignment: 'top'
                });

                /**
                 * add maximum 3 checkbox per row
                 * if the index is superior than array.lenght stop
                 */
                for (var el = 0; el < MAX_ELEMENT_ROW; el++) {

                    if (i < layers.length) {

                        var my_checkbox = grp.add('checkbox', layers[i].name);
                        my.array_of_checkbox.push(my_checkbox);
                        i++;

                    }
                    else {
                        break;
                    }
                }

            }
        }


    };


    /**
     * Function to update the source folder
     * @param {Folder} source
     */
    function update_source(source) {

        my.mainView.target_path.text = source;

    }

    /***********************************************
     * Events handler
     ***********************************************/


    /**
     * Function to set the source folder path
     */
    function set_source() {

        var files = File.openDialog(
            TRANS.CONTROLLER.SELECT_IMAGES,
            H.Utils.get_file_filter(['.indd'], 'Select a document'), true
        );


        // if the user do not cancel the add dialog box update the source
        if (files) {
            update_source(new File(files).fsName);
        }


    }

    // add events listeners
    my.mainView.target_add.addEventListener('click', set_source);

    init();

    return that;

};

