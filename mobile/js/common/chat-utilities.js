const isValidMentionCharacter = (c) => {
  return /[\w\-]/.test(c);
};

const isTerminalMentionCharacter = (c) => {
  return /[\s.,?!:;~()\*]/.test(c);
};

const isInitialMentionIndex = (message, index) => {
  return (
    // must start with @
    message.charAt(index) === '@' &&
    // must be preceded by a mention terminal
    (index == 0 || isTerminalMentionCharacter(message.charAt(index - 1)))
  );
};

export const formatMessage = (message, cache) => {
  let items = [];
  let start = 0;
  let i = 0;

  while (i < message.length) {
    if (isInitialMentionIndex(message, i)) {
      // Try converting all @... words into {userId: 1} items

      // find the end index of the mention
      let j;
      for (j = i + 1; j < message.length; j++) {
        let c = message.charAt(j);
        if (isTerminalMentionCharacter(c)) {
          break;
        }
        if (!isValidMentionCharacter(c)) {
          i = j + 1;
          break;
        }
      }

      if (i < j && (j >= message.length || isTerminalMentionCharacter(message.charAt(j)))) {
        let tag = message.substr(i + 1, j - i - 1);
        let user = cache[tag];

        if (!user) {
          // TODO: we could attempt to re-fetch here if the user isn't in the cache
          console.warn(`No autocomplete user in message body cache: ${tag}`);
        }

        if (i > start) {
          items.push({
            text: message.substr(start, i - start),
          });
        }

        if (!user) {
          items.push({
            text: tag,
          });
        } else {
          items.push({
            userId: user.userId,
            username: user.username,
          });
        }

        i = j;
        start = i;
        continue;
      }

      i = j + 1;
    } else {
      i++;
    }
  }

  if (i > start) {
    items.push({ text: message.substr(start, i - start) });
  }

  if (items.length === 0) {
    return '';
  } else if (items.length === 1 && items[0].text) {
    return items[0].text;
  } else {
    return JSON.stringify({
      message: items,
    });
  }
};

export const flattenMessageBody = (body) => {
  if (body?.message) {
    return body.message.reduce((accum, token) => {
      if (token.text) {
        return accum + token.text;
      }
      if (token.username) {
        return accum + `@${token.username}`;
      }
    }, '');
  }
  return '';
};

const isValidTagCharacter = (c) => {
  return /[\w\-]/.test(c);
};

const isTerminalTagCharacter = (c) => {
  return /[\s.,?!:;~()\*]/.test(c);
};

const isInitialTagIndex = (message, index) => {
  return (
    // must start with #
    message.charAt(index) === '#' &&
    // must be preceded by a tag terminal
    (index == 0 || isTerminalTagCharacter(message.charAt(index - 1)))
  );
};

// format a deck caption like "this is a #caption" into
// [ { text: 'this is a ' }, { tag: 'caption' } ]
export const formatCaption = (caption) => {
  let items = [];
  let start = 0;
  let i = 0;

  while (i < caption.length) {
    if (isInitialTagIndex(caption, i)) {
      // Try converting all #... words into { tag: 'blah' } items

      // find the end index of the tag
      let j;
      for (j = i + 1; j < caption.length; j++) {
        let c = caption.charAt(j);
        if (isTerminalTagCharacter(c)) {
          break;
        }
        if (!isValidTagCharacter(c)) {
          i = j + 1;
          break;
        }
      }

      if (i < j && (j >= caption.length || isTerminalTagCharacter(caption.charAt(j)))) {
        let tag = caption.substr(i + 1, j - i - 1);

        if (i > start) {
          items.push({
            text: caption.substr(start, i - start),
          });
        }

        items.push({
          tag,
        });

        i = j;
        start = i;
        continue;
      }

      i = j + 1;
    } else {
      i++;
    }
  }

  if (i > start) {
    items.push({ text: caption.substr(start, i - start) });
  }
  return items;
};
