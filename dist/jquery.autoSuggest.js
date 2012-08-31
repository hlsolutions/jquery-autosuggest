/*! jQuery AutoSuggest - v2.0.0 - 2012-08-31
* http://hlsolutions.github.com/jquery-autosuggest
* Copyright (c) 2012 Jan Philipp; Licensed MIT, GPL */

// Generated by CoffeeScript 1.3.3

/*
jQuery AutoSuggest 2

This is a rewritten version of Drew Wilsons "AutoSuggest" plugin from 2009/2010.
www.drewwilson.com / code.drewwilson.com/entry/autosuggest-jquery-plugin

Originally forked by Wu Yuntao (on GitHub)
http://github.com/wuyuntao/jquery-autosuggest
Based on the 1.6er release dated in July, 2012
*/


(function() {
  var $, ConfigResolver, Events, SelectionHolder, Utils;

  $ = jQuery;

  /* A collection of utility functions.
  */


  Utils = (function() {

    function Utils() {}

    Utils.prototype._ = void 0;

    Utils.escapeQuotes = function(text) {
      if (text) {
        return text.replace(/"/g, '\\"');
      }
    };

    Utils.escapeHtml = function(text) {
      return $('<span/>').text(text).html();
    };

    return Utils;

  })();

  /* A collection of configuration resolvers.
  */


  ConfigResolver = (function() {

    function ConfigResolver() {}

    ConfigResolver.prototype._ = void 0;

    /*
      Resolving the extra params as an object.
      The input of options.extraParams can be a string, a function or an object.
    */


    ConfigResolver.getExtraParams = function(options) {
      var obj, pair, parts, result, _i, _len, _ref;
      result = options.extraParams;
      if ($.isFunction(result)) {
        result = result(this);
      }
      /**
       * AutoSuggest <= 1.7 supported only a string of params. Since 2, the extra params will be used as a standard
       * $.fn.Ajax "data" parameter. The next lines will ensure that the result is such an object.
      */

      if ($.type(result) === 'string') {
        obj = {};
        _ref = result.split('&');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pair = _ref[_i];
          if (!(pair !== '')) {
            continue;
          }
          parts = pair.split('=', 2);
          if (parts.length) {
            obj[parts[0]] = parts[1];
          }
        }
        result = obj;
      }
      return result;
    };

    return ConfigResolver;

  })();

  /* The SelectionControl maintains and manage any selections.
  */


  SelectionHolder = (function() {

    SelectionHolder.prototype._ = void 0;

    SelectionHolder.prototype.hiddenField = null;

    SelectionHolder.prototype.items = null;

    function SelectionHolder(hiddenField, items) {
      this.hiddenField = hiddenField;
      this.items = items != null ? items : [];
    }

    SelectionHolder.prototype.syncToHiddenField = function() {
      var item, value, _i, _len, _ref;
      value = '';
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        value += ',' + item;
      }
      if (value) {
        value += ',';
      }
      this.hiddenField.val(value || ',');
    };

    SelectionHolder.prototype.add = function(item) {
      if (!this.exist(item)) {
        this.items.push(item);
      }
      this.syncToHiddenField();
    };

    SelectionHolder.prototype.remove = function(item) {
      this.items = $.grep(this.items, function(value) {
        return value !== item;
      });
      this.syncToHiddenField();
    };

    SelectionHolder.prototype.isEmpty = function() {
      return this.items.length === 0;
    };

    SelectionHolder.prototype.exist = function(item) {
      return $.inArray(item, this.items) !== -1;
    };

    SelectionHolder.prototype.getAll = function() {
      return this.items.slice(0);
    };

    SelectionHolder.prototype.clear = function() {
      this.items = [];
      this.syncToHiddenField();
    };

    return SelectionHolder;

  })();

  Events = (function() {

    function Events() {}

    Events.onSelectionAdded = function(scope, element, options, item) {
      if ($.isFunction(options.selectionAdded)) {
        return options.selectionAdded.call(scope, element, item);
      }
    };

    Events.onSelectionRemoved = function(scope, element, options, item) {
      if ($.isFunction(options.selectionRemoved)) {
        options.selectionRemoved.call(scope, element, item);
      }
      return element.remove();
    };

    Events.onSelectionClicked = function(scope, element, options, item) {
      if ($.isFunction(options.selectionClick)) {
        return options.selectionClick.call(scope, element, item);
      }
    };

    return Events;

  })();

  /*
  Defines the actual jQuery plugin
  */


  $.fn.autoSuggest = function(data, options) {
    /**
     * plugin's default options
    */

    var ajaxRequest, defaults, fetcher;
    defaults = {
      asHtmlID: false,
      /**
       * Defines whether the HTML5 placeholder attribute should used.
      */

      usePlaceholder: false,
      /**
       * Defines predefined values which will be selected.
       * @type string a comma seperated list of name/id values OR array of object items
      */

      preFill: null,
      /**
       * Defines text shown as a placeholder.
       * This text will be displayed when nothing is selected and the field isn't focused.
       * @type string
      */

      startText: 'Enter Name Here',
      /**
       * Defines text shown in the suggestion resultbox when there isn't a match.
       * @type string
      */

      emptyText: 'No Results Found',
      /**
       * Defines text shown when the limit of selections was exceeded.
       * @type string
      */

      limitText: 'No More Selections Are Allowed',
      /**
       * Defines the property of an item which will be used for display.
       * @type string default 'value'
      */

      selectedItemProp: 'value',
      /**
       * Defines the property of an item which will be used for identification (id).
       * @type string default 'value'
      */

      selectedValuesProp: 'value',
      /**
       * Defines the property of an item which will be used for searching.
       * @type string default 'value'
      */

      searchObjProps: 'value',
      /**
       * Defines the query parameter. Used for sending the search query.
       * @type string default 'q'
      */

      queryParam: 'q',
      /**
       * Defines the limit parameter. Used for limiting the results.
       * @type string default 'limit'
      */

      limitParam: 'limit',
      /**
       * number for 'limit' param on ajaxRequest
       * @type number
      */

      retrieveLimit: null,
      /**
       * Defines additional extraParams which will be appended to the ajaxRequest.
       * The recommended way is defining an object or a function returning such a object.
       *
       * If this is a string or a function returning a string, the string must be a valid query url. Internally,
       * the string will be split by '&' and '=' and built to an object. This is only available due backwards
       * compatibility.
       *
       * @type string, function or object
      */

      extraParams: null,
      /**
       * Defines whether the user input is case sensitive or not. Default is case insensitive.
       * @type boolean default false
      */

      matchCase: false,
      /**
       * Defines the minimum of characters before the input will be a query against the defined fetcher (i.e. Ajax).
       * @type number default 1
      */

      minChars: 1,
      /**
       * Defines the key delay. This is a recommended way when using an asynchronous fetcher (Ajax).
       * @type number default 400
      */

      keyDelay: 400,
      /**
       * Defines whether the result list's search/suggestion results should be highlight with the user query.
       * @type boolean default true
      */

      resultsHighlight: true,
      /**
       * Defines the limit of search/suggestion results.
       * @type number default none
      */

      selectionLimit: false,
      /**
       * Defines whether the result list should be displayed.
       * @type boolean default true
      */

      showResultList: true,
      /**
       * Defines whether the result list should be displayed even when there are no results.
       * @type boolean default false
      */

      showResultListWhenNoMatch: false,
      /**
       * Defines whether the input field can create new selections which aren't part of the suggestion.
       * @type boolean default true
      */

      canGenerateNewSelections: true,
      /**
       * FIXME needs doc
       * @type function
      */

      start: null,
      /**
       * Defines a trigger when clicking on a selection element.
       * @type function with arguments: element
      */

      selectionClick: null,
      /**
       * Defines a trigger after adding a selection element.
       * @type function with arguments: elementBefore, id
      */

      selectionAdded: null,
      /**
       * Defines a callback for removing a selection item.
       * @type function with arguments: element
      */

      selectionRemoved: null,
      /**
       * Defines a callback called for every item that will be rendered.
       * @type function with arguments: element
      */

      formatList: null,
      /**
       * Defines a callback function intercepting the url
       * @return String should return the ajaxRequest url
      */

      beforeRequest: null,
      /**
       * Defines a callback function intercepting the result data.
      */

      afterRequest: null,
      /**
       * Defines a deferred callback function for the internal ajax request (on success).
      */

      onAjaxRequestDone: null,
      /**
       * Defines a deferred callback function for the internal ajax request (on error).
      */

      onAjaxRequestFail: null,
      /**
       * Defines a deferred callback function for the internal ajax request (on complete).
      */

      onAjaxRequestAlways: null,
      /**
       * Defines a trigger after clicking on a search result element.
       * @type function with arguments: data
      */

      resultClick: null,
      /**
       * Defines a trigger called after processData.
       * @type function
      */

      resultsComplete: null,
      /**
       * Defines whether an "event.preventDefault()" should be executed on an ENTER key.
       * @type boolean default false
      */

      neverSubmit: false,
      /**
       * Defines whether an "event.stopPropagation()" should be executed on an ESC key.
       * @type boolean default false
      */

      preventPropagationOnEscape: false,
      /**
       * Defines the base options used for the ajaxRequest.
      */

      ajaxOptions: {
        type: 'get',
        dataType: 'json'
      },
      /**
       * specifies a list of attributes which will be applied to each input on startup
      */

      inputAttrs: {
        autocomplete: 'off'
      }
    };
    options = $.extend({}, defaults, options);
    ajaxRequest = null;
    fetcher = (function() {
      switch ($.type(data)) {
        case 'function':
          return data;
        case 'string':
          return function(query, callback) {
            var ajaxRequestConfig, extraParams, onDone, params;
            params = {};
            /* ensures query is encoded
            */

            params["" + options.queryParam] = encodeURIComponent(decodeURIComponent(query));
            if (options.retrieveLimit) {
              params[options.limitParam] = encodeURIComponent(options.retrieveLimit);
            }
            extraParams = ConfigResolver.getExtraParams(options);
            if ($.type(extraParams) === 'object') {
              $.extend(params, extraParams);
            }
            ajaxRequestConfig = $.extend({}, options.ajaxOptions, {
              url: data,
              data: params
            });
            onDone = function(data) {
              var data2;
              data2 = $.isFunction(options.afterRequest) ? options.afterRequest.apply(this, [data]) : data;
              return callback(data2, query);
            };
            ajaxRequest = $.ajax(ajaxRequestConfig).done(onDone);
            if (options.onAjaxRequestDone) {
              ajaxRequest.done(options.onAjaxRequestDone);
            }
            if (options.onAjaxRequestFail) {
              ajaxRequest.fail(options.onAjaxRequestFail);
            }
            if (options.onAjaxRequestAlways) {
              ajaxRequest.always(options.onAjaxRequestAlways);
            }
          };
        case 'array':
        case 'object':
          return function(query, callback) {
            return callback(data, query);
          };
      }
    })();
    if (!fetcher) {
      return;
    }
    /*
      For each selected item, we will create an own scope.
      All variables above are "instance" locale!
    */

    return this.each(function(element) {
      var abortRequest, actualInputWrapper, addSelection, currentSelection, elementId, hiddenInput, i, input, input_focus, interval, item, keyChange, lastKeyPressCode, lastKeyWasTab, moveSelection, new_value, num_count, prefilledValue, prev, processData, processRequest, resultsContainer, resultsList, selectionsContainer, timeout, value, _i, _j, _len, _len1, _ref, _ref1;
      options.inputAttrs = $.extend(options.inputAttrs, {});
      input_focus = false;
      input = $(this);
      element = null;
      elementId = null;
      if (!options.asHtmlID) {
        element = "" + element + (Math.floor(Math.random() * 100));
        elementId = "as-input-" + element;
      } else {
        element = options.asHtmlID;
        elementId = element;
      }
      options.inputAttrs.id = elementId;
      if (options.usePlaceholder) {
        options.inputAttrs.placeholder = options.startText;
      }
      input.attr(options.inputAttrs);
      input.addClass('as-input');
      if (!options.usePlaceholder) {
        input.val(options.startText);
      }
      input.wrap("<ul class=\"as-selections\" id=\"as-selections-" + element + "\"></ul>").wrap("<li class=\"as-original\" id=\"as-original-" + element + "\"></li>");
      selectionsContainer = $("#as-selections-" + element);
      actualInputWrapper = $("#as-original-" + element);
      resultsContainer = $("<div class=\"as-results\" id=\"as-results-" + element + "\"></div>");
      resultsList = $("<ul class=\"as-list\"></ul>");
      hiddenInput = $("<input type=\"hidden\" class=\"as-values\" name=\"as_values_" + element + "\" id=\"as-values-" + element + "\" />");
      currentSelection = new SelectionHolder(hiddenInput);
      prefilledValue = '';
      interval = null;
      timeout = null;
      prev = '';
      lastKeyWasTab = false;
      lastKeyPressCode = null;
      num_count = 0;
      /**
       * Adds the specified selection.
       * @param Object data
       * @param Number num
      */

      addSelection = function(data, num) {
        var closeElement, item;
        currentSelection.add(data[options.selectedValuesProp]);
        item = $("<li class=\"as-selection-item\" id=\"as-selection-" + num + "\" data-value=\"" + (Utils.escapeQuotes(Utils.escapeHtml(data[options.selectedValuesProp]))) + "\"></li>");
        item.click(function() {
          element = $(this);
          if ($.isFunction(options.selectionClick)) {
            options.selectionClick.call(this, element);
          }
          selectionsContainer.children().removeClass('selected');
          element.addClass('selected');
        });
        item.mousedown(function() {
          input_focus = false;
        });
        closeElement = $("<a class=\"as-close\">&times;</a>");
        closeElement.click(function() {
          currentSelection.remove(data[options.selectedValuesProp]);
          if ($.isFunction(options.selectionRemoved)) {
            options.selectionRemoved.call(this, item);
          }
          item.remove();
          input_focus = true;
          input.focus();
          return false;
        });
        if (typeof data[options.selectedItemProp] !== 'string') {
          actualInputWrapper.before(item.append(data[options.selectedItemProp]).prepend(closeElement));
        } else {
          actualInputWrapper.before(item.text(data[options.selectedItemProp]).prepend(closeElement));
        }
        Events.onSelectionAdded(this, actualInputWrapper.prev(), options, data[options.selectedValuesProp]);
        return actualInputWrapper.prev();
      };
      /*
            DO START
      */

      if ($.isFunction(options.start)) {
        options.start.call(this, {
          add: function(data) {
            var counted, item;
            counted = $(selectionsContainer).find('li').length;
            item = addSelection(data, "u" + counted);
            return item != null ? item.addClass('blur') : void 0;
          },
          remove: function(value) {
            currentSelection.remove(value);
            return selectionsContainer.find("li[data-value=\"" + (Utils.escapeHtml(value)) + "\"]").remove();
          }
        });
      }
      switch ($.type(options.preFill)) {
        case 'string':
          _ref = options.preFill.split(',');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            value = _ref[_i];
            item = {};
            item["" + options.selectedValuesProp] = value;
            if (value !== '') {
              addSelection(item, "000" + i);
            }
          }
          prefilledValue = options.preFill;
          break;
        case 'array':
          prefilledValue = '';
          if (options.preFill.length) {
            _ref1 = options.preFill;
            for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
              item = _ref1[i];
              new_value = item[options.selectedValuesProp];
              if (typeof new_value === 'undefined') {
                new_value = '';
              }
              prefilledValue += new_value + ',';
              if (new_value !== '') {
                addSelection(item, "000" + i);
              }
            }
          }
      }
      if (prefilledValue !== '') {
        input.val('');
        selectionsContainer.find('li.as-selection-item').addClass('blur').removeClass('selected');
      }
      input.after(hiddenInput);
      selectionsContainer.click(function() {
        input_focus = true;
        input.focus();
      });
      selectionsContainer.mousedown(function() {
        input_focus = false;
      });
      selectionsContainer.after(resultsContainer);
      keyChange = function() {
        /*
              Since most IME does not trigger any key events, if we press [del]
              and type some chinese character, `lastKeyPressCode` will still be [del].
              This might cause problem so we move the line to key events section;
              ignore if the following keys are pressed: [del] [shift] [capslock]
        */

        var string;
        string = input.val().replace(/[\\]+|[\/]+/g, '');
        if (string === prev) {
          return;
        }
        prev = string;
        if (string.length >= options.minChars) {
          selectionsContainer.addClass('loading');
          return processRequest(string);
        } else {
          selectionsContainer.removeClass('loading');
          return resultsContainer.hide();
        }
      };
      processRequest = function(string) {
        if ($.isFunction(options.beforeRequest)) {
          string = options.beforeRequest.apply(this, [string, options]);
        }
        abortRequest();
        return fetcher(string, processData);
      };
      processData = function(data, query) {
        var formatted, forward, matchCount, name, num, regx, str, this_data, _k, _l, _len2, _len3, _ref2;
        if (!options.matchCase) {
          query = query.toLowerCase();
        }
        query = query.replace('(', '\(', 'g').replace(')', '\)', 'g');
        matchCount = 0;
        resultsContainer.hide().html(resultsList.html(''));
        num = 0;
        for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
          item = data[_k];
          num_count++;
          forward = false;
          if (options.searchObjProps === 'value') {
            str = item.value;
          } else {
            str = '';
            _ref2 = options.searchObjProps.split(',');
            for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
              name = _ref2[_l];
              str += "" + item[$.trim(name)] + " ";
            }
          }
          if (str) {
            if (!options.matchCase) {
              str = str.toLowerCase();
            }
            if (str.indexOf(query) !== -1 && !currentSelection.exist(item[options.selectedValuesProp])) {
              forward = true;
            }
          }
          if (forward) {
            formatted = $("<li class=\"as-result-item\" id=\"as-result-item-" + num + "\"></li>");
            formatted.click(function() {
              var number, raw_data;
              element = $(this);
              raw_data = element.data('data');
              number = raw_data.num;
              if (selectionsContainer.find("#as-selection-" + number).length <= 0 && !lastKeyWasTab) {
                data = raw_data.attributes;
                input.val('').focus();
                prev = '';
                addSelection(data, number);
                if ($.isFunction(options.resultClick)) {
                  options.resultClick.call(this, raw_data);
                }
                resultsContainer.hide();
              }
              lastKeyWasTab = false;
            });
            formatted.mousedown(function() {
              input_focus = false;
            });
            formatted.mouseover(function() {
              element = $(this);
              resultsList.find('li').removeClass('active');
              element.addClass('active');
            });
            formatted.data('data', {
              attributes: data[num],
              num: num_count
            });
            this_data = $.extend({}, data[num]);
            query = query.replace(/"/g, '\\"');
            regx = !options.matchCase ? new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + Utils.escapeHtml(query) + ")(?![^<>]*>)(?![^&;]+;)", "gi") : new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + Utils.escapeHtml(query) + ")(?![^<>]*>)(?![^&;]+;)", "g");
            /* When this is a string, escape the value and process a regular replacement for highlighting.
            */

            if (typeof this_data[options.selectedItemProp] === 'string') {
              this_data[options.selectedItemProp] = Utils.escapeHtml(this_data[options.selectedItemProp]);
              if (options.resultsHighlight && query.length > 0) {
                this_data[options.selectedItemProp] = this_data[options.selectedItemProp].replace(regx, '<em>$1</em>');
              }
            } else {
              this_data[options.selectedItemProp].html(this_data[options.selectedItemProp].html().replace(regx, '<em>$1</em>'));
            }
            if (!options.formatList) {
              formatted = formatted.html(this_data[options.selectedItemProp]);
            } else {
              formatted = options.formatList.call(this, this_data, formatted);
            }
            resultsList.append(formatted);
            this_data = null;
            matchCount++;
            if (options.retrieveLimit && options.retrieveLimit === matchCount) {
              break;
            }
          }
          num += 1;
        }
        selectionsContainer.removeClass('loading');
        if (matchCount <= 0) {
          resultsList.html("<li class=\"as-message\">" + options.emptyText + "</li>");
        }
        resultsList.css({
          width: selectionsContainer.outerWidth()
        });
        if (matchCount > 0 || !options.showResultListWhenNoMatch) {
          resultsContainer.show();
        }
        if ($.isFunction(options.resultsComplete)) {
          options.resultsComplete.call(this);
        }
      };
      moveSelection = function(direction) {
        var active, lis, start;
        if (resultsContainer.find(':visible').length) {
          lis = resultsContainer.find('li');
          switch (direction) {
            case 'down':
              start = lis.eq(0);
              break;
            default:
              start = lis.filter(':last');
          }
          active = resultsContainer.find('li.active:first');
          if (active.length) {
            switch (direction) {
              case 'down':
                start = active.next();
                break;
              default:
                start = active.prev();
            }
          }
          lis.removeClass('active');
          start.addClass('active');
        }
      };
      abortRequest = function() {
        if (!ajaxRequest) {
          return;
        }
        ajaxRequest.abort();
        ajaxRequest = null;
      };
      input.focus(function() {
        element = $(this);
        if (!options.usePlaceholder && element.val() === options.startText && currentSelection.isEmpty()) {
          element.val('');
        } else if (input_focus) {
          selectionsContainer.find('li.as-selections-item').removeClass('blur');
          if (element.val() !== '') {
            resultsList.css({
              width: selectionsContainer.outerWidth()
            });
            resultsContainer.show();
          }
        }
        if (interval) {
          clearInterval(interval);
        }
        interval = setInterval((function() {
          if (options.showResultList) {
            if (options.selectionLimit && selectionsContainer.find('li.as-selection-item').length >= options.selectionLimit) {
              resultsList.html("<li class=\"as-message\">" + options.limitText + "</li>");
              resultsContainer.show();
            } else {
              keyChange();
            }
          }
        }), options.keyDelay);
        input_focus = true;
        if (options.minChars === 0) {
          processRequest(element.val());
        }
        return true;
      });
      input.blur(function() {
        element = $(this);
        if (!options.usePlaceholder && element.val() === '' && currentSelection.isEmpty() && prefilledValue === '' && options.minChars > 0) {
          element.val(options.startText);
        } else if (input_focus) {
          selectionsContainer.find('li.as-selection-item').addClass('blur').removeClass('selected');
          resultsContainer.hide();
        }
        if (interval) {
          clearInterval(interval);
        }
      });
      return input.keydown(function(event) {
        /* track the last key pressed
        */

        var active, first_focus, i_input, n_data, _selection, _selections;
        lastKeyPressCode = event.keyCode;
        first_focus = false;
        switch (event.keyCode) {
          case 38:
            event.preventDefault();
            moveSelection('up');
            break;
          case 40:
            event.preventDefault();
            moveSelection('down');
            break;
          case 8:
            if (input.val() === '') {
              _selections = currentSelection.getAll();
              _selection = null;
              if (_selections.length) {
                _selection = _selections[_selections.length - 1];
              } else {
                _selection = null;
              }
              selectionsContainer.children().not(actualInputWrapper.prev()).removeClass('selected');
              if (actualInputWrapper.prev().hasClass('selected')) {
                currentSelection.remove(_selection);
                Events.onSelectionRemoved(this, actualInputWrapper.prev(), options, null);
              } else {
                Events.onSelectionClicked(this, actualInputWrapper.prev(), options, null);
                actualInputWrapper.prev().addClass('selected');
              }
            }
            if (input.val().length === 1) {
              resultsContainer.hide();
              prev = '';
              abortRequest();
            }
            if (resultsContainer.find(':visible').length) {
              if (timeout) {
                clearTimeout(timeout);
              }
              timeout = setTimeout((function() {
                keyChange();
              }), options.keyDelay);
            }
            break;
          case 9:
          case 188:
            if (options.canGenerateNewSelections) {
              lastKeyWasTab = true;
              i_input = input.val().replace(/(,)/g, '');
              active = resultsContainer.find('li.active:first');
              /* Generate a new bubble with text when no suggestion selected
              */

              if (i_input !== '' && !currentSelection.exist(i_input) && i_input.length >= options.minChars && active.length === 0) {
                event.preventDefault();
                n_data = {};
                n_data["" + options.selectedItemProp] = i_input;
                n_data["" + options.selectedValuesProp] = i_input;
                addSelection(n_data, "00" + (selectionsContainer.find('li').length + 1));
                input.val('');
                /* Cancel previous ajaxRequest when new tag is added
                */

                abortRequest();
              }
            }
            break;
          case 13:
            lastKeyWasTab = false;
            active = resultsContainer.find('li.active:first');
            if (active.length) {
              active.click();
              resultsContainer.hide();
            }
            if (options.neverSubmit || active.length) {
              event.preventDefault();
            }
            break;
          case 27:
            if (options.preventPropagationOnEscape && resultsContainer.find(':visible').length) {
              event.stopPropagation();
            }
            break;
          case 16:
          case 20:
            abortRequest();
            resultsContainer.hide();
        }
      });
    });
  };

}).call(this);
