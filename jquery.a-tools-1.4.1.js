/*! 
 * a-tools 1.4.1
 * 
 * Copyright (c) 2009 Andrey Kramarev(andrey.kramarev[at]ampparit.com), Ampparit Inc. (www.ampparit.com)
 * Licensed under the MIT license.
 * http://www.ampparit.fi/a-tools/license.txt
 *
 * Basic usage:
 
    <textarea></textarea>
    <input type="text" />

    // Get current selection
    let sel = $("textarea").getSelection()
    
    // Replace current selection
    $("input").replaceSelection("foo");

    // Count characters
    alert($("textarea").countCharacters());

    // Set max length without callback function
    $("textarea").setMaxLength(7);

    // Set max length with callback function which will be called when limit is exceeded
    $("textarea").setMaxLength(10, function() {
        alert("hello")
    });

    // Removing limit:
    $("textarea").setMaxLength(-1);
    
    // Insert text at current caret position
    $("#textarea").insertAtCaretPos("hello");
    
    // Set caret position (1 = beginning, -1 = end)
    $("#textArea").setCaretPos(10);
    
    // Set Selection
    $("#textArea").setSelection(10,15);

 */
let caretPositionAmp;

jQuery.fn.extend({
  getSelection: function () {
    // function for getting selection, and position of the selected text
    const textareaElement = this[0];
    let start;
    let end;
    let part;

    if (typeof textareaElement.selectionStart == 'number') {
      start = textareaElement.selectionStart;
      end = textareaElement.selectionEnd;
      part = textareaElement.value.substring(textareaElement.selectionStart, textareaElement.selectionEnd);
      return { start: start, end: end, text: part, length: end - start };
    } else {
      return { start: undefined, end: undefined, text: undefined, length: undefined };
    }
  },

  // function for the replacement of the selected text
  replaceSelection: function (inputStr) {
    const textareaElement = this[0];
    let start;
    let end;
    let position = 0;
    let mozScrollFix = textareaElement.scrollTop == undefined ? 0 : textareaElement.scrollTop;
    if (
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
      textareaElement.selectionStart != textareaElement.selectionEnd
    ) {
      start = textareaElement.selectionStart;
      end = textareaElement.selectionEnd;
      textareaElement.value = textareaElement.value.substr(0, start) + inputStr + textareaElement.value.substr(end);
      position = start + inputStr.length;
      textareaElement.setSelectionRange(position, position);
      textareaElement.scrollTop = mozScrollFix;
      return this;
    }
    return this;
  },

  //Set Selection in text
  setSelection: function (startPosition, endPosition) {
    startPosition = parseInt(startPosition);
    endPosition = parseInt(endPosition);

    const textareaElement = this[0];
    textareaElement.focus();
    if (typeof textareaElement.selectionStart != 'number') {
      re = textareaElement.createTextRange();
      if (re.text.length < endPosition) {
        endPosition = re.text.length + 1;
      }
    }
    if (endPosition < startPosition) {
      return this;
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
        return this;
      } else {
        return this;
      }
    } else if (textareaElement.selectionStart) {
      // MOZILLA support
      textareaElement.focus();
      textareaElement.selectionStart = startPosition;
      textareaElement.selectionEnd = endPosition;
      return this;
    }
  },

  // insert text at current caret position
  insertAtCaretPos: function (inputStr) {
    const textareaElement = this[0];
    let start;
    let end;
    let position;
    let s;
    let re;
    let rc;
    let point;
    let minus = 0;
    let number = 0;
    let mozScrollFix = textareaElement.scrollTop == undefined ? 0 : textareaElement.scrollTop;
    textareaElement.focus();
    if (document.selection && typeof textareaElement.selectionStart != 'number') {
      if (textareaElement.value.match(/\n/g) != null) {
        number = textareaElement.value.match(/\n/g).length; // number of EOL simbols
      }
      point = parseInt(caretPositionAmp);
      if (number > 0) {
        for (let i = 0; i <= number; i++) {
          let w = textareaElement.value.indexOf('\n', position);
          if (w != -1 && w <= point) {
            position = w + 1;
            point = point - 1;
            minus++;
          }
        }
      }
    }
    caretPositionAmp = parseInt(caretPositionAmp);

    if (document.selection && typeof textareaElement.selectionStart != 'number') {
      s = document.selection.createRange();
      if (s.text.length != 0) {
        return this;
      }
      re = textareaElement.createTextRange();
      textLength = re.text.length;
      rc = re.duplicate();
      re.moveToBookmark(s.getBookmark());
      rc.setEndPoint('EndToStart', re);
      start = rc.text.length;
      if (caretPositionAmp > 0 && start == 0) {
        minus = caretPositionAmp - minus;
        re.move('character', minus);
        re.select();
        s = document.selection.createRange();
        caretPositionAmp += inputStr.length;
      } else if (!(caretPositionAmp >= 0) && textLength == 0) {
        s = document.selection.createRange();
        caretPositionAmp = inputStr.length + textLength;
      } else if (!(caretPositionAmp >= 0) && start == 0) {
        re.move('character', textLength);
        re.select();
        s = document.selection.createRange();
        caretPositionAmp = inputStr.length + textLength;
      } else if (!(caretPositionAmp >= 0) && start > 0) {
        re.move('character', 0);
        document.selection.empty();
        re.select();
        s = document.selection.createRange();
        caretPositionAmp = start + inputStr.length;
      } else if (caretPositionAmp >= 0 && caretPositionAmp == textLength) {
        if (textLength != 0) {
          re.move('character', textLength);
          re.select();
        } else {
          re.move('character', 0);
        }
        s = document.selection.createRange();
        caretPositionAmp = inputStr.length + textLength;
      } else if (caretPositionAmp >= 0 && start != 0 && caretPositionAmp >= start) {
        minus = caretPositionAmp - start;
        re.move('character', minus);
        document.selection.empty();
        re.select();
        s = document.selection.createRange();
        caretPositionAmp = caretPositionAmp + inputStr.length;
      } else if (caretPositionAmp >= 0 && start != 0 && caretPositionAmp < start) {
        re.move('character', 0);
        document.selection.empty();
        re.select();
        s = document.selection.createRange();
        caretPositionAmp = caretPositionAmp + inputStr.length;
      } else {
        document.selection.empty();
        re.select();
        s = document.selection.createRange();
        caretPositionAmp = caretPositionAmp + inputStr.length;
      }
      s.text = inputStr;
      textareaElement.focus();

      return this;
    } else if (
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
      textareaElement.selectionStart == textareaElement.selectionEnd
    ) {
      position = textareaElement.selectionStart + inputStr.length;
      start = textareaElement.selectionStart;
      end = textareaElement.selectionEnd;
      textareaElement.value = textareaElement.value.substr(0, start) + inputStr + textareaElement.value.substr(end);
      textareaElement.setSelectionRange(position, position);
      textareaElement.scrollTop = mozScrollFix;
      return this;
    }
    return this;
  },

  // Set caret position
  setCaretPos: function (inputStr) {
    const textareaElement = this[0];
    let s;
    let re;
    let position;
    let number = 0;
    let minus = 0;
    let w;
    textareaElement.focus();
    if (parseInt(inputStr) == 0) {
      return this;
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
          number = textareaElement.value.match(/\n/g).length; // number of EOL simbols
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
      if (document.selection && typeof textareaElement.selectionStart != 'number') {
        inputStr = textareaElement.value.length + parseInt(inputStr);
        if (textareaElement.value.match(/\n/g) != null) {
          number = textareaElement.value.match(/\n/g).length; // number of EOL simbols
        }
        if (number > 0) {
          for (let i = 0; i <= number; i++) {
            w = textareaElement.value.indexOf('\n', position);
            if (w != -1 && w <= inputStr) {
              position = w + 1;
              inputStr = parseInt(inputStr) - 1;
              minus += 1;
            }
          }
          inputStr = inputStr + minus - number;
        }
      } else if (document.selection && typeof textareaElement.selectionStart == 'number') {
        inputStr = textareaElement.value.length + parseInt(inputStr);
        if (textareaElement.value.match(/\n/g) != null) {
          number = textareaElement.value.match(/\n/g).length; // number of EOL simbols
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
      return this;
    }
    if (
      typeof textareaElement.selectionStart == 'number' && // MOZILLA support
      textareaElement.selectionStart == textareaElement.selectionEnd
    ) {
      textareaElement.setSelectionRange(inputStr, inputStr);
      return this;
    }
    return this;
  },

  countCharacters: function (str) {
    const textareaElement = this[0];
    if (textareaElement.value.match(/\r/g) != null) {
      return textareaElement.value.length - textareaElement.value.match(/\r/g).length;
    }
    return textareaElement.value.length;
  },
});
