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
  apply: (
    area,
    suggests,
    options = {
      delimiters: '\n ',
      minChunkSize: 1,
      cycleOnTab: false,
      autoComplete: true,
      endingSymbols: ' ',
      stopSuggestionKeys: [InlineAutocomplete.Keys.RETURN, InlineAutocomplete.Keys.SPACE],
      ignoreCase: false,
    }
  ) => {
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
        }
      },

      setSelection: (textareaElement, startPositionStr, endPositionStr) => {
        const startPosition = parseInt(startPositionStr);
        const endPosition = parseInt(endPositionStr);

        textareaElement.focus();

        if (endPosition < startPosition) {
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
          } else {
          }
        } else if (textareaElement.selectionStart) {
          textareaElement.focus();
          textareaElement.selectionStart = startPosition;
          textareaElement.selectionEnd = endPosition;
        }
      },
      insertAtCaretPos: (textareaElement, inputStr) => {
        const mozScrollFix = textareaElement.scrollTop == undefined ? 0 : textareaElement.scrollTop;
        textareaElement.focus();

        if (
          typeof textareaElement.selectionStart == 'number' &&
          textareaElement.selectionStart == textareaElement.selectionEnd
        ) {
          const position = textareaElement.selectionStart + inputStr.length;
          const start = textareaElement.selectionStart;
          const end = textareaElement.selectionEnd;
          textareaElement.value = textareaElement.value.substr(0, start) + inputStr + textareaElement.value.substr(end);
          textareaElement.setSelectionRange(position, position);
          textareaElement.scrollTop = mozScrollFix;
        }
      },
    };

    const currentArea = area;
    currentArea.suggests = suggests;
    currentArea.options = options;

    /* Internal method: get the chunk of text before the cursor */
    currentArea.getChunk = function () {
      const delimiters = this.options.delimiters.split(''); // array of chars
      const textBeforeCursor = this.value.substr(0, textareaUtil.getSelection(this).start);
      let indexOfDelimiter = -1;
      let i;
      let d;
      let idx;
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
      let text = this.getChunk();
      let selectionText = textareaUtil.getSelection(this).text;
      let suggests = this.suggests;
      let foundAlreadySelectedValue = false;
      let firstMatchedValue = null;
      let i;
      let suggest;
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
        const _selectionStart = textareaUtil.getSelection(currentArea).start;
        const _selectionEnd = _selectionStart + completion.length;
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
          const chunk = currentArea.getChunk();
          if (chunk.length >= currentArea.options.minChunkSize) {
            currentArea.updateSelection(currentArea.getCompletion(true));
          }
        } else {
          const startPosition = currentArea.selectionStart;
          const tabSpaces = '    ';
          currentArea.value =
            currentArea.value.substring(0, currentArea.selectionStart) +
            tabSpaces +
            currentArea.value.substr(currentArea.selectionEnd);
          currentArea.focus();
          currentArea.selectionEnd = startPosition + tabSpaces.length;
        }
        e.preventDefault();
        e.stopPropagation();
        currentArea.focus();
        return false;
      }
      // Check for conditions to stop suggestion
      if (
        textareaUtil.getSelection(currentArea).length &&
        currentArea.options.stopSuggestionKeys.indexOf(e.keyCode) !== -1
      ) {
        // apply suggestion. Clean up selection and insert a space
        const _selectionEnd = textareaUtil.getSelection(currentArea).end + currentArea.options.endingSymbols.length;
        const _text = textareaUtil.getSelection(currentArea).text + currentArea.options.endingSymbols;
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
      const hasSpecialKeys = e.altKey || e.metaKey || e.ctrlKey,
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
            const chunk = currentArea.getChunk();
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
