const InlineAutocomplete = {
  Keys: {
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
  },
  apply: function (
    area,
    suggests,
    options = {
      delimiters: '\n ',
      minChunkSize: 1,
      cycleOnTab: true,
      autoComplete: true,
      endingSymbols: ' ',
      stopSuggestionKeys: [InlineAutocomplete.Keys.RETURN, InlineAutocomplete.Keys.SPACE],
      ignoreCase: false,
    }
  ) {
    const textareaUtil = {
      getSelection: (textareaElement) => ({
        start: textareaElement.selectionStart,
        end: textareaElement.selectionEnd,
        text: textareaElement.value.substring(textareaElement.selectionStart, textareaElement.selectionEnd),
        length: textareaElement.selectionEnd - textareaElement.selectionStart,
      }),

      replaceSelection: (textareaElement, inputStr) => {
        const mozScrollFix = textareaElement.scrollTop == undefined ? 0 : textareaElement.scrollTop;
        if (
          typeof textareaElement.selectionStart == 'number' &&
          textareaElement.selectionStart != textareaElement.selectionEnd
        ) {
          const start = textareaElement.selectionStart;
          const end = textareaElement.selectionEnd;
          textareaElement.value = textareaElement.value.substr(0, start) + inputStr + textareaElement.value.substr(end);
          const position = start + inputStr.length;
          textareaElement.setSelectionRange(position, position);
          textareaElement.scrollTop = mozScrollFix;
          return [textareaElement];
        }
        return [textareaElement];
      },

      setSelection: (textareaElement, startPositionStr, endPositionStr) => {
        const startPosition = parseInt(startPositionStr);
        const endPosition = parseInt(endPositionStr);

        textareaElement.focus();

        if (endPosition < startPosition) {
          return [textareaElement];
        }
        if (document.selection) {
          let number = 0;
          let plus = 0;
          let position = 0;
          let plusEnd = 0;

          if (typeof textareaElement.selectionStart == 'number') {
            if (number > 0) {
              for (let i = 0; i <= number; i++) {
                let w = textareaElement.value.indexOf('\n', position);
                if (w != -1 && w < startPosition) {
                  position = w + 1;
                  plus++;
                  plusEnd = plus;
                } else if (w != -1 && w >= startPosition && w <= endPosition) {
                  if (w == startPosition + 1) {
                    plus--;
                    plusEnd--;
                    position = w + 1;
                    continue;
                  }
                  position = w + 1;
                  plusEnd++;
                } else {
                  i = number;
                }
              }
            }
            startPosition = startPosition + plus;
            endPosition = endPosition + plusEnd;
            textareaElement.selectionStart = startPosition;
            textareaElement.selectionEnd = endPosition;
            return [textareaElement];
          } else {
            return [textareaElement];
          }
        } else if (textareaElement.selectionStart) {
          textareaElement.focus();
          textareaElement.selectionStart = startPosition;
          textareaElement.selectionEnd = endPosition;
          return [textareaElement];
        }
      },
      insertAtCaretPos: (textareaElement, inputStr) => {
        let start;
        let end;
        let position;
        let mozScrollFix = textareaElement.scrollTop == undefined ? 0 : textareaElement.scrollTop;
        textareaElement.focus();

        if (
          typeof textareaElement.selectionStart == 'number' &&
          textareaElement.selectionStart == textareaElement.selectionEnd
        ) {
          position = textareaElement.selectionStart + inputStr.length;
          start = textareaElement.selectionStart;
          end = textareaElement.selectionEnd;
          textareaElement.value = textareaElement.value.substr(0, start) + inputStr + textareaElement.value.substr(end);
          textareaElement.setSelectionRange(position, position);
          textareaElement.scrollTop = mozScrollFix;
          return [textareaElement];
        }
        return [textareaElement];
      },
    };

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
      if (e.keyCode === InlineAutocomplete.Keys.TAB) {
        if (currentArea.options.cycleOnTab) {
          var chunk = currentArea.getChunk();
          if (chunk.length >= currentArea.options.minChunkSize) {
            currentArea.updateSelection(currentArea.getCompletion(true));
          }
          e.preventDefault();
          e.stopPropagation();
          currentArea.focus();
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
        return false;
      }
    };

    currentArea.removeEventListener('keydown', onKeydown);
    currentArea.addEventListener('keydown', onKeydown);
    const onKeyup = function (e) {
      var hasSpecialKeys = e.altKey || e.metaKey || e.ctrlKey,
        hasSpecialKeysOrShift = hasSpecialKeys || e.shiftKey;
      switch (e.keyCode) {
        case InlineAutocomplete.Keys.UNKNOWN: // Special key released
        case InlineAutocomplete.Keys.SHIFT:
        case InlineAutocomplete.Keys.CTRL:
        case InlineAutocomplete.Keys.ALT:
        case InlineAutocomplete.Keys.TAB:
          if (!hasSpecialKeysOrShift && currentArea.options.cycleOnTab) {
            break;
          }
        case InlineAutocomplete.Keys.ESC:
        case InlineAutocomplete.Keys.BACKSPACE:
        case InlineAutocomplete.Keys.DEL:
        case InlineAutocomplete.Keys.UP:
        case InlineAutocomplete.Keys.DOWN:
        case InlineAutocomplete.Keys.LEFT:
        case InlineAutocomplete.Keys.RIGHT:
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
  },
};
