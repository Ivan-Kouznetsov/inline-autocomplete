let caretPositionAmp;

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
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
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

  setSelection: (textareaElement, startPosition, endPosition) => {
    startPosition = parseInt(startPosition);
    endPosition = parseInt(endPosition);

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
      // MOZILLA support
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

    caretPositionAmp = parseInt(caretPositionAmp);

    if (
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
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

jQuery.fn.extend({
  // Set caret position
  setCaretPos: function (inputStr) {
    const textareaElement = this[0];
    let position;
    let number = 0;
    let minus = 0;
    let w;
    textareaElement.focus();
    if (parseInt(inputStr) == 0) {
      return [textareaElement];
    }
    //if (document.selection && typeof(input.selectionStart) == "number") {
    if (parseInt(inputStr) > 0) {
      inputStr = parseInt(inputStr) - 1;
      if (
        document.selection &&
        typeof textareaElement.selectionStart == 'number' &&
        textareaElement.selectionStart == textareaElement.selectionEnd
      ) {
        if (textareaElement.value.match(/\n/g) != null) {
          number = textareaElement.value.match(/\n/g).length; // number of EOL symbols
        }
        if (number > 0) {
          for (let i = 0; i <= number; i++) {
            w = textareaElement.value.indexOf('\n', position);
            if (w != -1 && w <= inputStr) {
              position = w + 1;
              inputStr = parseInt(inputStr) + 1;
            }
          }
        }
      }
    } else if (parseInt(inputStr) < 0) {
      inputStr = parseInt(inputStr) + 1;
      if (document.selection && typeof textareaElement.selectionStart == 'number') {
        inputStr = textareaElement.value.length + parseInt(inputStr);
        if (textareaElement.value.match(/\n/g) != null) {
          number = textareaElement.value.match(/\n/g).length; // number of EOL symbols
        }
        if (number > 0) {
          inputStr = parseInt(inputStr) - number;
          for (let i = 0; i <= number; i++) {
            w = textareaElement.value.indexOf('\n', position);
            if (w != -1 && w <= inputStr) {
              position = w + 1;
              inputStr = parseInt(inputStr) + 1;
              minus += 1;
            }
          }
        }
      } else {
        inputStr = textareaElement.value.length + parseInt(inputStr);
      }
    } else {
      return [textareaElement];
    }
    if (
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
      textareaElement.selectionStart == textareaElement.selectionEnd
    ) {
      textareaElement.setSelectionRange(inputStr, inputStr);
      return [textareaElement];
    }
    return [textareaElement];
  },

  countCharacters: function () {
    const textareaElement = this[0];
    if (textareaElement.value.match(/\r/g) != null) {
      return textareaElement.value.length - textareaElement.value.match(/\r/g).length;
    }
    return textareaElement.value.length;
  },
});
