(function ($) {
  $.inlineAutocompleteKeys = {
    UNKNOWN: 0,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DEL: 46,
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    COMMA: 188,
    PAGEUP: 33,
    PAGEDOWN: 34,
    BACKSPACE: 8,
    SPACE: 32,
  };
  $.inlineAutocompleteFocused = null;

  $.fn.inlineAutocomplete = function (suggests, options) {
    return this.each(function () {
      $.makeSuggest(this, suggests, options);
    });
  };

  $.fn.inlineAutocomplete.defaults = {
    delimiters: '\n ',
    minChunkSize: 1,
    cycleOnTab: true,
    autoComplete: true,
    endingSymbols: ' ',
    stopSuggestionKeys: [$.inlineAutocompleteKeys.RETURN, $.inlineAutocompleteKeys.SPACE],
    ignoreCase: false,
  };

  /* Make suggest:
   *
   * create and return jQuery object on the top of DOM object
   * and store suggests as part of this object
   *
   * @param area: HTML DOM element to add suggests to
   * @param suggests: The array of suggest strings
   * @param options: The options object
   */
  $.makeSuggest = function (area, suggests, options) {
    options = $.extend({}, $.fn.inlineAutocomplete.defaults, options);

    var KEY = $.inlineAutocompleteKeys,
      $area = $(area);
    $area.suggests = suggests;
    $area.options = options;

    /* Internal method: get the chunk of text before the cursor */
    $area.getChunk = function () {
      var delimiters = this.options.delimiters.split(''), // array of chars
        textBeforeCursor = this.val().substr(0, textareaUtil.getSelection(this[0]).start),
        indexOfDelimiter = -1,
        i,
        d,
        idx;
      for (i = 0; i < delimiters.length; i++) {
        d = delimiters[i];
        idx = textBeforeCursor.lastIndexOf(d);
        if (idx > indexOfDelimiter) {
          indexOfDelimiter = idx;
        }
      }
      if (indexOfDelimiter < 0) {
        return textBeforeCursor;
      } else {
        return textBeforeCursor.substr(indexOfDelimiter + 1);
      }
    };

    /* Internal method: get completion.
     * If performCycle is true then analyze getChunk() and and getSelection()
     */
    $area.getCompletion = function (performCycle) {
      var text = this.getChunk(),
        selectionText = textareaUtil.getSelection(this[0]).text,
        suggests = this.suggests,
        foundAlreadySelectedValue = false,
        firstMatchedValue = null,
        i,
        suggest;
      // search the variant
      for (i = 0; i < suggests.length; i++) {
        suggest = suggests[i];
        if ($area.options.ignoreCase) {
          suggest = suggest.toLowerCase();
          text = text.toLowerCase();
        }
        // some variant is found
        if (suggest.indexOf(text) === 0) {
          if (performCycle) {
            if (text + selectionText === suggest) {
              foundAlreadySelectedValue = true;
            } else if (foundAlreadySelectedValue) {
              return suggest.substr(text.length);
            } else if (firstMatchedValue === null) {
              firstMatchedValue = suggest;
            }
          } else {
            return suggest.substr(text.length);
          }
        }
      }
      if (performCycle && firstMatchedValue) {
        return firstMatchedValue.substr(text.length);
      } else {
        return null;
      }
    };

    $area.updateSelection = function (completion) {
      if (completion) {
        var _selectionStart = textareaUtil.getSelection($area[0]).start,
          _selectionEnd = _selectionStart + completion.length;
        if (textareaUtil.getSelection($area[0]).text === '') {
          textareaUtil.insertAtCaretPos($area[0], completion);
        } else {
          textareaUtil.replaceSelection($area[0], completion);
        }
        textareaUtil.setSelection($area[0], _selectionStart, _selectionEnd);
      }
    };

    $area.unbind('keydown.inlineAutocomplete').bind('keydown.inlineAutocomplete', function (e) {
      if (e.keyCode === KEY.TAB) {
        if ($area.options.cycleOnTab) {
          var chunk = $area.getChunk();
          if (chunk.length >= $area.options.minChunkSize) {
            $area.updateSelection($area.getCompletion(true));
          }
          e.preventDefault();
          e.stopPropagation();
          $area.focus();
          $.inlineAutocompleteFocused = this;
          return false;
        }
      }
      // Check for conditions to stop suggestion
      if (textareaUtil.getSelection($area[0]).length && $.inArray(e.keyCode, $area.options.stopSuggestionKeys) !== -1) {
        // apply suggestion. Clean up selection and insert a space
        var _selectionEnd = textareaUtil.getSelection($area[0]).end + $area.options.endingSymbols.length;
        var _text = textareaUtil.getSelection($area[0]).text + $area.options.endingSymbols;
        textareaUtil.replaceSelection($area[0], _text);
        textareaUtil.setSelection($area[0], _selectionEnd, _selectionEnd);
        e.preventDefault();
        e.stopPropagation();
        this.focus();
        $.inlineAutocompleteFocused = this;
        return false;
      }
    });

    $area.unbind('keyup.inlineAutocomplete').bind('keyup.inlineAutocomplete', function (e) {
      var hasSpecialKeys = e.altKey || e.metaKey || e.ctrlKey,
        hasSpecialKeysOrShift = hasSpecialKeys || e.shiftKey;
      switch (e.keyCode) {
        case KEY.UNKNOWN: // Special key released
        case KEY.SHIFT:
        case KEY.CTRL:
        case KEY.ALT:
        case KEY.TAB:
          if (!hasSpecialKeysOrShift && $area.options.cycleOnTab) {
            break;
          }
        case KEY.ESC:
        case KEY.BACKSPACE:
        case KEY.DEL:
        case KEY.UP:
        case KEY.DOWN:
        case KEY.LEFT:
        case KEY.RIGHT:
          if (!hasSpecialKeysOrShift && $area.options.autoComplete) {
            textareaUtil.replaceSelection($area[0], '');
          }
          break;
        default:
          if (!hasSpecialKeys && $area.options.autoComplete) {
            var chunk = $area.getChunk();
            if (chunk.length >= $area.options.minChunkSize) {
              $area.updateSelection($area.getCompletion(false));
            }
          }
          break;
      }
    });
    return $area;
  };
})(jQuery);
