const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = (DAY * 365) / 12;
const YEAR = DAY * 365;

const areDatesSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

export const toDateline = (timestamp) => {
  let date = new Date(timestamp);
  if (areDatesSameDay(new Date(), date)) {
    return 'Today';
  } else {
    let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    if (areDatesSameDay(yesterday, date)) {
      return 'Yesterday';
    } else {
      return toDate(date);
    }
  }
};

export const toTime = (timestamp) => {
  let date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

export const toFriendlyDate = (timestamp) => {
  let date = new Date(timestamp);
  let timeString = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  if (areDatesSameDay(new Date(), date)) {
    return toRecentDate(timestamp);
  } else {
    let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    if (areDatesSameDay(yesterday, date)) {
      timeString = `Yesterday ${timeString}`;
    } else {
      timeString = `${toDate(date)} ${timeString}`;
    }
  }

  return timeString;
};

export const toDate = (dateString) => {
  let date = dateString;
  if (typeof dateString !== 'object') {
    date = new Date(dateString);
  }

  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
};

export const toRecentDate = (date) => {
  const publishTimeSeconds = new Date(date).getTime();
  const currentTimeSeconds = new Date().getTime();

  let seconds = (currentTimeSeconds - publishTimeSeconds) / 1000;
  seconds = seconds > 0 ? seconds : 1;

  let [value, unit] =
    seconds < MINUTE
      ? [Math.round(seconds), 's']
      : seconds < HOUR
      ? [Math.round(seconds / MINUTE), 'm']
      : seconds < DAY
      ? [Math.round(seconds / HOUR), 'h']
      : seconds < WEEK
      ? [Math.round(seconds / DAY), 'd']
      : seconds < MONTH
      ? [Math.round(seconds / WEEK), 'w']
      : seconds < YEAR
      ? [Math.round(seconds / MONTH), ' month']
      : [Math.round(seconds / YEAR), ' year'];

  unit = pluralizeDateUnit(unit, value);

  return `${value}${unit}`;
};

export const pluralizeDateUnit = (text, count) => {
  return text.length > 1 && count !== 1 ? `${text}s` : text;
};
