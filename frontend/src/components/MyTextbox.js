import React, { useState } from 'react';

function MyTextbox() {
  const [value, setValue] = useState('');
  const [startIndex, setStartIndex] = useState(0);

  const [visibileText, setVisibleText] = useState([{len: 0, textType: 'text'}]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const clearSuggestion = () => {
    setShowSuggestions(false);
    setStartIndex(-1);
    setFilteredSuggestions([])
    // also empty the suggestion value
  }

  const beginSuggesting = (index) => {
    setShowSuggestions(true);
    setStartIndex(index);
    // query for "_" to query for an empty string.
    let url = 'http://' + window.location.hostname + ':5000';
    fetch(url + '/query/_')
    .then(response => response.json())
    .then(newData => {
      setFilteredSuggestions(newData)
    });
  }

  const flushSuggestion = (selectionStart) => {
    // if there is an existing active suggestion, flush it
    if (filteredSuggestions[activeSuggestion]) {
      const suggestion = filteredSuggestions[activeSuggestion].name;

      // starts at `startIndex`, ends at `selectionStart`
      // both of these should be within a single text item,
      // we just need to find which one, split it up and insert the suggestion inbetween the two halves.
      let found = false;
      let newVisibleText = JSON.parse(JSON.stringify(visibileText));
      let start = 0;
      for (let i=0; i<newVisibleText.length; ++i) {
        if (start <= startIndex && (start + newVisibleText[i].len) >= selectionStart) {
          // technically we don't need to check both conditions, but they should both be true.

          let oldLength = newVisibleText[i].len;
          // update the boxes
          newVisibleText.splice(i, 1, {
            len: startIndex-start,
            textType: 'text'
          }) // we do want to delete the original text box, so we put 1
          newVisibleText.splice(i+1, 0, {
            len: suggestion.length,
            textType: filteredSuggestions[activeSuggestion].tag
          });
          newVisibleText.splice(i+2, 0, {
            len: Math.max(oldLength - (startIndex - start) - (selectionStart - startIndex), 0),
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
        start += newVisibleText[i].len;
      }

      if (!found) {
        setVisibleText([{
          len: suggestion.length,
          textType: 'employee'
        }]);
        setValue(suggestion);
      }

      clearSuggestion();
    }
  }

  const updateBackgroundBoxes = (event) => {
    // subtract one since this is the selection AFTER the character has been typed
    const selectionStart = event.target.selectionStart - 1;
    let newVisibleText = JSON.parse(JSON.stringify(visibileText));
    // find the correct item to update and then update it
    let start = 0;
    for (let i=0; i<newVisibleText.length; ++i) {
      if (start <= selectionStart && (start + newVisibleText[i].len) >= selectionStart) {
        if (newVisibleText[i].textType === 'text') {
          newVisibleText[i].len++;
          // we don't actually need to track the start index in the objects. Next time don't do that.
          // if (i != newVisibleText.length - 1) {
          //   newVisibleText[i+1].start++;
          // }
          break;
        } else {
          let insertIndex;
          if (start === selectionStart) {
            insertIndex = i;
          } else if (start + newVisibleText[i].len === selectionStart) {
            insertIndex = i + 1;
          }
          newVisibleText.splice(insertIndex, 0, {
            // start: selectionStart,
            len: 1,
            textType: 'text'
          })
        }
      }
      start += newVisibleText[i].len;
    }

    // newVisibleText should never be empty
    setVisibleText(newVisibleText);
  }

  const handleDelete = (event) => {
    // subtract one since this is the selection AFTER the character has been typed
    const selectionStart = event.target.selectionStart;
    if (selectionStart === 0) {
      return
    }
    let newVisibleText = JSON.parse(JSON.stringify(visibileText));
    let start = 0;
    for (let i=0; i<newVisibleText.length; ++i) {
      if (start <= selectionStart && (start + newVisibleText[i].len) >= selectionStart) {
        if (newVisibleText[i].len > 0) {
          if (newVisibleText[i].textType === 'text') {
            newVisibleText.splice(i, 1, {
              len: newVisibleText[i].len - 1,
              textType: 'text'
            })
            break;
          } else {
            const left = value.substring(0, start);
            const right = value.substring(start + newVisibleText[i].len)
            setValue(left + right);
            newVisibleText.splice(i, 1);
            break;
          }
        }
      }
      start += newVisibleText[i].len;
    }
    setVisibleText(newVisibleText)
  }

  const handleInputChange = (event) => {
    // TODO: We need special rules for deletion. We need to scan through the items and check if the deletion index lies within a non-text item.
    //       If so, we must delete it in its entireity and merge the adjacent text blocks. Otherwise we just perform a normal delete at the given index by
    //       finding the textbox that contains the index.
    const inputValue = event.target.value;
    setValue(inputValue);
    // if we are inserting
    if (inputValue.length > value.length) {
      updateBackgroundBoxes(event);
    }

    if (showSuggestions) {
      // must use `inputValue`, otherwise race condition. + 1 to move past the "@" symbol
      const suggestionValue = inputValue.substring(startIndex + 1, event.target.selectionStart);

      let url = 'http://' + window.location.hostname + ':5000';
      // if (url.search(".run.app") > -1) {
      //     url = 'https://network-search-demo-gttbsqlgba-uc.a.run.app';
      // }
      fetch(url + '/query/' + encodeURI(suggestionValue.toLowerCase()))
        .then(response => response.json())
        .then(newData => {
          setFilteredSuggestions(newData)
        });

      // setFilteredSuggestions(users.filter(user =>
      //   user.name.toLowerCase().includes(suggestionValue.toLowerCase())
      // ));
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
    } else if (event.keyCode === 8) {// delete
      handleDelete(event);
    }
  }

  const handleSuggestionClick = (user) => {
    setValue(user.name);
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
                {user.name} ({user.tag})
              </li>
            );
          })}
        </ul>
      );
    } else {
      suggestionsList = (
        <>
        </>
      );
    }
  }

  const getVisibleTextWithStart = () => {
    let visibleTextCopy = JSON.parse(JSON.stringify(visibileText));
    let start = 0;
    for (let i=0; i<visibleTextCopy.length; ++i) {
      visibleTextCopy[i].start = start;
      start += visibleTextCopy[i].len;
    }
    return visibleTextCopy;
  }

  return (
    <div className="mentions-parent">
      <>
        <div className="box-text">
          {/* textType: 'customer' | 'employee' | 'text' */}
          {getVisibleTextWithStart().map(({start, len, textType}, index) => {
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