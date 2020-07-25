const inlineAutocompleteState = {};

inlineAutocompleteState.Keys = {
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
inlineAutocompleteState.Focused = null;

applyInlineAutocomplete = function (
  area,
  suggests,
  options = {
    delimiters: '\n ',
    minChunkSize: 1,
    cycleOnTab: true,
    autoComplete: true,
    endingSymbols: ' ',
    stopSuggestionKeys: [inlineAutocompleteState.Keys.RETURN, inlineAutocompleteState.Keys.SPACE],
    ignoreCase: false,
  }
) {
  const KEY = inlineAutocompleteState.Keys;
  const currentArea = area;
  currentArea.suggests = suggests;
  currentArea.options = options;

  /* Internal method: get the chunk of text before the cursor */
  currentArea.getChunk = function () {
    var delimiters = this.options.delimiters.split(''), // array of chars
      textBeforeCursor = this.value.substr(0, textareaUtil.getSelection(this).start),
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
  currentArea.getCompletion = function (performCycle) {
    var text = this.getChunk(),
      selectionText = textareaUtil.getSelection(this).text,
      suggests = this.suggests,
      foundAlreadySelectedValue = false,
      firstMatchedValue = null,
      i,
      suggest;
    // search the variant
    for (i = 0; i < suggests.length; i++) {
      suggest = suggests[i];
      if (currentArea.options.ignoreCase) {
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

  currentArea.updateSelection = function (completion) {
    if (completion) {
      var _selectionStart = textareaUtil.getSelection(currentArea).start,
        _selectionEnd = _selectionStart + completion.length;
      if (textareaUtil.getSelection(currentArea).text === '') {
        textareaUtil.insertAtCaretPos(currentArea, completion);
      } else {
        textareaUtil.replaceSelection(currentArea, completion);
      }
      textareaUtil.setSelection(currentArea, _selectionStart, _selectionEnd);
    }
  };

  const onKeydown = function (e) {
    if (e.keyCode === KEY.TAB) {
      if (currentArea.options.cycleOnTab) {
        var chunk = currentArea.getChunk();
        if (chunk.length >= currentArea.options.minChunkSize) {
          currentArea.updateSelection(currentArea.getCompletion(true));
        }
        e.preventDefault();
        e.stopPropagation();
        currentArea.focus();
        inlineAutocompleteState.Focused = this;
        return false;
      }
    }
    // Check for conditions to stop suggestion
    if (
      textareaUtil.getSelection(currentArea).length &&
      currentArea.options.stopSuggestionKeys.indexOf(e.keyCode) !== -1
    ) {
      // apply suggestion. Clean up selection and insert a space
      var _selectionEnd = textareaUtil.getSelection(currentArea).end + currentArea.options.endingSymbols.length;
      var _text = textareaUtil.getSelection(currentArea).text + currentArea.options.endingSymbols;
      textareaUtil.replaceSelection(currentArea, _text);
      textareaUtil.setSelection(currentArea, _selectionEnd, _selectionEnd);
      e.preventDefault();
      e.stopPropagation();
      this.focus();
      inlineAutocompleteState.Focused = this;
      return false;
    }
  };

  currentArea.removeEventListener('keydown', onKeydown);
  currentArea.addEventListener('keydown', onKeydown);
  const onKeyup = function (e) {
    var hasSpecialKeys = e.altKey || e.metaKey || e.ctrlKey,
      hasSpecialKeysOrShift = hasSpecialKeys || e.shiftKey;
    switch (e.keyCode) {
      case KEY.UNKNOWN: // Special key released
      case KEY.SHIFT:
      case KEY.CTRL:
      case KEY.ALT:
      case KEY.TAB:
        if (!hasSpecialKeysOrShift && currentArea.options.cycleOnTab) {
          break;
        }
      case KEY.ESC:
      case KEY.BACKSPACE:
      case KEY.DEL:
      case KEY.UP:
      case KEY.DOWN:
      case KEY.LEFT:
      case KEY.RIGHT:
        if (!hasSpecialKeysOrShift && currentArea.options.autoComplete) {
          textareaUtil.replaceSelection(currentArea, '');
        }
        break;
      default:
        if (!hasSpecialKeys && currentArea.options.autoComplete) {
          var chunk = currentArea.getChunk();
          if (chunk.length >= currentArea.options.minChunkSize) {
            currentArea.updateSelection(currentArea.getCompletion(false));
          }
        }
        break;
    }
  };

  currentArea.removeEventListener('keyup', onKeyup);
  currentArea.addEventListener('keyup', onKeyup);
  return currentArea;
};
