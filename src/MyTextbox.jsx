import React, { useState } from 'react';

const users = [  { id: 1, display: 'Alice' },  { id: 2, display: 'Bob' },  { id: 3, display: 'Charlie' },];

function MyTextbox() {
  const [value, setValue] = useState('');
  const [startIndex, setStartIndex] = useState(0);

  const [visibileText, setVisibleText] = useState([{start: 0, len: 0, textType: 'text'}]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState(users);

  const clearSuggestion = () => {
    setShowSuggestions(false);
    setStartIndex(-1);
    // also empty the suggestion value
  }

  const beginSuggesting = (index) => {
    setShowSuggestions(true);
    setStartIndex(index);
  }

  const flushSuggestion = (selectionStart) => {
    // if there is an existing active suggestion, flush it
    if (filteredSuggestions[activeSuggestion]) {
      const suggestion = filteredSuggestions[activeSuggestion].display;

      // starts at `startIndex`, ends at `selectionStart`
      // both of these should be within a single text item,
      // we just need to find which one, split it up and insert the suggestion inbetween the two halves.
      let found = false;
      let newVisibleText = visibileText.slice();
      for (let i=0; i<newVisibleText.length; ++i) {
        if (newVisibleText[i].start <= startIndex && (newVisibleText[i].start + newVisibleText[i].len) >= selectionStart) {
          // technically we don't need to check both conditions, but they should both be true.

          // update the boxes
          newVisibleText.splice(i, 1, {
            start: newVisibleText[i].start,
            len: (startIndex-newVisibleText[i].start),
            textType: 'text'
          }) // we do want to delete the original text box, so we put 1
          newVisibleText.splice(i+1, 0, {
            start: startIndex,
            len: suggestion.length,
            textType: 'employee'
          });
          newVisibleText.splice(i+2, 0, {
            start: startIndex + suggestion.length,
            len: Math.max(newVisibleText[i].len - suggestion.length - startIndex, 0),
            textType: 'text'
          });

          setVisibleText(newVisibleText)

          // update the actual text
          const leftHalf = value.substring(0, startIndex);
          const rightHalf = value.substring(selectionStart);
          setValue(leftHalf + suggestion + rightHalf);

          found = true;
          break;
        }
      }

      if (!found) {
        setVisibleText([{
          start: 0,
          len: suggestion.length,
          textType: 'employee'
        }]);
        setValue(suggestion);
      }

      clearSuggestion();
    }
  }

  const updateBackgroundBoxes = (event) => {
    const inputValue = event.target.value;
    // subtract one since this is the selection AFTER the character has been typed
    const selectionStart = event.target.selectionStart - 1;
    let newVisibleText = visibileText.slice();
    // find the correct item to update and then update it
    for (let i=0; i<newVisibleText.length; ++i) {
      if (newVisibleText[i].start <= selectionStart && (newVisibleText[i].start + newVisibleText[i].len) >= selectionStart) {
        if (newVisibleText[i].textType === 'text') {
          newVisibleText[i].len++;
          // we don't actually need to track the start index in the objects. Next time don't do that.
          if (i != newVisibleText.length - 1) {
            newVisibleText[i+1].start++;
          }
          break;
        } else {
          let insertIndex;
          if (newVisibleText[i].start == selectionStart) {
            insertIndex = i;
          } else if (newVisibleText[i].start + newVisibleText[i].len == selectionStart) {
            insertIndex = i + 1;
          }
          newVisibleText.splice(insertIndex, 0, {
            start: selectionStart,
            len: 1,
            textType: 'text'
          })
        }
      }
    }

    // newVisibleText should never be empty
    setVisibleText(newVisibleText);
  }

  const handleInputChange = (event) => {
    // TODO: We need special rules for deletion. We need to scan through the items and check if the deletion index lies within a non-text item.
    //       If so, we must delete it in its entireity and merge the adjacent text blocks. Otherwise we just perform a normal delete at the given index by
    //       finding the textbox that contains the index.
    const inputValue = event.target.value;
    setValue(inputValue);
    updateBackgroundBoxes(event);
    console.log(inputValue, visibileText)

    if (showSuggestions) {
      // must use `inputValue`, otherwise race condition. + 1 to move past the "@" symbol
      const suggestionValue = inputValue.substring(startIndex + 1, event.target.selectionStart);
      setFilteredSuggestions(users.filter(user =>
        user.display.toLowerCase().includes(suggestionValue.toLowerCase())
      ));
      setActiveSuggestion(0);
    }
  }

  const handleKeyDown = (event) => {    
    if (event.keyCode === 13) { // enter key
      flushSuggestion(event.target.selectionStart)
    } else if (event.keyCode === 9) { // tab
      event.preventDefault();
      flushSuggestion(event.target.selectionStart);
    } else if (event.keyCode === 38) { // up arrow
      setActiveSuggestion(activeSuggestion > 0 ? activeSuggestion - 1 : filteredSuggestions.length - 1);
      event.preventDefault();
    } else if (event.keyCode === 40) { // down arrow
      setActiveSuggestion(activeSuggestion < filteredSuggestions.length - 1 ? activeSuggestion + 1 : 0);
      event.preventDefault();
    } else if (event.key === '@') { // "@" (enables special behaviour)
      beginSuggesting(event.target.selectionStart);
    } else if (event.keyCode === 32) { // space (disables special behaviour)
      clearSuggestion();
    }
  }

  const handleSuggestionClick = (user) => {
    setValue(user.display);
    setShowSuggestions(false);
  }

  let suggestionsList;
  if (showSuggestions && value) {
    if (filteredSuggestions.length) {
      suggestionsList = (
        <ul>
          {filteredSuggestions.map((user, index) => {
            let className = '';
            if (index === activeSuggestion) {
              className = 'active';
            }
            return (
              <li key={user.id} className={className} onClick={() => handleSuggestionClick(user)}>
                {user.display}
              </li>
            );
          })}
        </ul>
      );
    } else {
      suggestionsList = (
        <div>
          No suggestions found.
        </div>
      );
    }
  }

  return (
    <div className="mentions-parent">
      <>
        <div className="box-text">
          {/* textType: 'customer' | 'employee' | 'text' */}
          {visibileText.map(({start, len, textType}, index) => {
            const text = value.substring(start, start+len);
            if (textType === 'text') {
              return (<span>{text}</span>)
            } else {
              return (<span className={textType}>{text}</span>)
            }
          })}
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </>
      {suggestionsList}
    </div>
  );
}

export default MyTextbox;