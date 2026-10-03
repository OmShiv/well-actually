// The deck. Each card is something programmers tend to believe. `answer` is
// whether the claim is actually true. `proof` is JavaScript that runs in the
// player's browser (and in the test suite), and `expect` is what it prints.

const raw = String.raw;
const mdn = (path) => `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/${path}`;
const wiki = (page) => `https://en.wikipedia.org/wiki/${page}`;
const falsehoods = (section) => `https://github.com/kdeldycke/awesome-falsehood#${section}`;

export const CATEGORIES = {
  time: { label: 'Time', color: 'time' },
  text: { label: 'Text', color: 'text' },
  numbers: { label: 'Numbers', color: 'numbers' },
  names: { label: 'Names', color: 'names' },
  places: { label: 'Places', color: 'places' },
  money: { label: 'Money', color: 'money' },
  web: { label: 'The web', color: 'web' },
};

export const CARDS = [
  // ---- Time ------------------------------------------------------------------
  {
    id: 'every-day-has-24-hours',
    category: 'time',
    claim: 'Every day has 24 hours.',
    answer: false,
    truth: 'Days with a daylight saving change have 23 or 25 hours.',
    explain:
      'When clocks spring forward, the local day loses an hour. When they fall back, it gains one. Code that adds 24 hours to get "tomorrow, same time" is an hour off twice a year.',
    proof: raw`const ny = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'long',
});
const day = 24 * 60 * 60 * 1000;

const march8 = Date.UTC(2026, 2, 8, 5);   // midnight in New York
console.log(ny.format(march8));
console.log(ny.format(march8 + day));     // 24 hours later

const nov1 = Date.UTC(2026, 10, 1, 4);    // midnight in New York
console.log(ny.format(nov1));
console.log(ny.format(nov1 + day));       // 24 hours later`,
    source: { label: 'Falsehoods about time', url: falsehoods('dates-and-time') },
  },
  {
    id: 'every-minute-has-60-seconds',
    category: 'time',
    claim: 'Every minute has 60 seconds.',
    answer: false,
    truth: 'Minutes with a leap second have 61. The last one ended 2016.',
    explain:
      'To keep clocks in step with the Earth\'s rotation, 27 leap seconds have been added since 1972, most recently as 23:59:60 UTC on December 31, 2016. Unix time, and JavaScript, pretend that second never happened. In 2022, the world\'s timekeepers voted to stop adding leap seconds by 2035.',
    proof: raw`const leap = new Date('2016-12-31T23:59:60Z');
console.log(leap.getTime());   // JavaScript can't represent it

// One "second" apart in Unix time:
console.log(Date.parse('2016-12-31T23:59:59Z') / 1000);
console.log(Date.parse('2017-01-01T00:00:00Z') / 1000);`,
    source: { label: 'Leap second', url: wiki('Leap_second') },
  },
  {
    id: 'time-zones-are-whole-hours',
    category: 'time',
    claim: 'Time zones are a whole number of hours from UTC.',
    answer: false,
    truth: 'India is +5:30, Nepal is +5:45, and Eucla, Australia is +8:45.',
    explain:
      'Hundreds of millions of people live in time zones that are 30 or 45 minutes off the hour. Code that stores offsets as whole hours, or rounds them, gets their time wrong every day.',
    proof: raw`const offset = (timeZone, month = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone, timeZoneName: 'longOffset',
  }).formatToParts(Date.UTC(2026, month, 15))
    .find((part) => part.type === 'timeZoneName').value;

const zones = ['Asia/Kolkata', 'Asia/Kathmandu',
  'Australia/Eucla', 'Pacific/Chatham'];
for (const zone of zones) console.log(zone, offset(zone));`,
    source: { label: 'Falsehoods about time', url: falsehoods('dates-and-time') },
  },
  {
    id: 'offsets-stop-at-12',
    category: 'time',
    claim: 'UTC offsets range from -12 to +12 hours.',
    answer: false,
    truth: 'Kiritimati is UTC+14, so the earliest and latest places are 26 hours apart.',
    explain:
      'Kiribati moved its eastern islands across the date line in 1995 so the whole country would share a date. Kiritimati now starts each day 14 hours before UTC, and Baker Island ends it 12 hours after.',
    proof: raw`const offset = (timeZone, month = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone, timeZoneName: 'longOffset',
  }).formatToParts(Date.UTC(2026, month, 15))
    .find((part) => part.type === 'timeZoneName').value;

const zones = ['Etc/GMT+12', 'Pacific/Tongatapu',
  'Pacific/Kiritimati'];
for (const zone of zones) console.log(zone, offset(zone, 6));`,
    source: { label: 'UTC+14:00', url: wiki('UTC%2B14:00') },
  },
  {
    id: 'dst-is-one-hour',
    category: 'time',
    claim: 'Daylight saving time moves the clock by one hour.',
    answer: false,
    truth: 'Lord Howe Island moves it by 30 minutes. Antarctica\'s Troll station moves it by two hours.',
    explain:
      'Most places shift by an hour, but not all. Code that adds or subtracts exactly 60 minutes for "summer time" is wrong in these places, and in any place that changes its rules.',
    proof: raw`const offset = (timeZone, month = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone, timeZoneName: 'longOffset',
  }).formatToParts(Date.UTC(2026, month, 15))
    .find((part) => part.type === 'timeZoneName').value;

// January, then July:
for (const zone of ['Australia/Lord_Howe', 'Antarctica/Troll']) {
  console.log(zone, offset(zone, 0), offset(zone, 6));
}`,
    source: { label: 'Lord Howe Island', url: wiki('Lord_Howe_Island') },
  },
  {
    id: 'divisible-by-4-is-leap',
    category: 'time',
    claim: 'Every year divisible by 4 is a leap year.',
    answer: false,
    truth: 'Years divisible by 100 skip it, unless they\'re divisible by 400. 2100 is not a leap year.',
    explain:
      'The Gregorian calendar drops three leap days every 400 years to stay in line with the seasons. 2000 was a leap year because it\'s divisible by 400; 1900 and 2100 are not.',
    proof: raw`const isLeap = (year) => new Date(year, 1, 29).getDate() === 29;

for (const year of [2024, 2100, 2000]) {
  console.log(year, isLeap(year));
}`,
    source: { label: 'Leap year', url: wiki('Leap_year') },
  },
  {
    id: 'year-2000-was-a-leap-year',
    category: 'time',
    claim: '2000 was a leap year.',
    answer: true,
    truth: 'It was: divisible by 100, but also by 400.',
    explain:
      'Century years are leap years only when they\'re divisible by 400. Some software in 1999 got this wrong in the other direction and skipped February 29, 2000.',
    proof: raw`console.log(new Date(2000, 1, 29).toDateString());

// 1900 wasn't, so February 29 rolls over to March 1:
console.log(new Date(1900, 1, 29).toDateString());`,
    source: { label: 'Leap year', url: wiki('Leap_year') },
  },
  {
    id: 'january-is-month-zero',
    category: 'time',
    claim: 'In JavaScript, `new Date(2026, 0, 1)` is January 1.',
    answer: true,
    truth: 'True: JavaScript counts months from 0, so 0 is January and 11 is December.',
    explain:
      'Days of the month start at 1, but months start at 0, a design JavaScript copied from Java in 1995. It\'s a classic source of off-by-one-month bugs.',
    proof: raw`console.log(new Date(2026, 0, 1).toDateString());
console.log(new Date(2026, 1, 1).toDateString());

// Month 12 is January of the next year:
console.log(new Date(2026, 12, 1).toDateString());`,
    source: { label: 'Date() constructor on MDN', url: mdn('Global_Objects/Date/Date') },
  },
  {
    id: 'adding-a-month',
    category: 'time',
    claim: 'Adding one month to a date lands on the same day next month.',
    answer: false,
    truth: 'January 31 plus a month is March 3 in JavaScript.',
    explain:
      'February 31 doesn\'t exist, so `setMonth()` rolls the extra days into March. Billing systems that add a month this way drift a few days every time a long month meets a short one.',
    proof: raw`const date = new Date(2026, 0, 31);   // January 31
date.setMonth(date.getMonth() + 1);
console.log(date.toDateString());`,
    source: { label: 'setMonth() on MDN', url: mdn('Global_Objects/Date/setMonth') },
  },
  {
    id: 'local-times-happen-once',
    category: 'time',
    claim: 'Every local time happens exactly once a day.',
    answer: false,
    truth: 'When clocks fall back, 1:30 AM happens twice. When they spring forward, 2:30 AM never happens.',
    explain:
      'A local time without its offset can be ambiguous, or impossible. Scheduling a job at 2:30 AM local time means it runs twice a year on the wrong schedule, or not at all.',
    proof: raw`const ny = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', timeStyle: 'long',
});
const at = (iso) => ny.format(new Date(iso));

console.log(at('2026-11-01T05:30:00Z'));
console.log(at('2026-11-01T06:30:00Z'));   // an hour later
console.log(at('2026-03-08T06:59:59Z'));
console.log(at('2026-03-08T07:00:00Z'));   // a second later`,
    source: { label: 'Falsehoods about time', url: falsehoods('dates-and-time') },
  },
  {
    id: 'same-date-everywhere',
    category: 'time',
    claim: 'At any moment, it\'s the same date everywhere on Earth.',
    answer: false,
    truth: 'For two hours every day, three different dates are in use at once.',
    explain:
      'With offsets from UTC-12 to UTC+14, the Earth spans 26 hours. Between 10:00 and 12:00 UTC, it\'s yesterday in some places, today in UTC, and tomorrow in Kiritimati.',
    proof: raw`// 11:30 UTC on March 2
const moment = Date.UTC(2026, 2, 2, 11, 30);

const zones = ['Etc/GMT+12', 'UTC', 'Pacific/Kiritimati'];
for (const timeZone of zones) {
  const local = new Intl.DateTimeFormat('en-US', {
    timeZone, dateStyle: 'medium', timeStyle: 'short',
  });
  console.log(timeZone, local.format(moment));
}`,
    source: { label: 'Falsehoods about time', url: falsehoods('dates-and-time') },
  },
  {
    id: 'toisostring-is-today',
    category: 'time',
    claim: '`new Date().toISOString()` starts with today\'s date.',
    answer: false,
    truth: 'It starts with today\'s date in UTC, which is tomorrow (or yesterday) for much of the world.',
    explain:
      '`toISOString()` always uses UTC. At 9:30 PM in Los Angeles it already says tomorrow. Slicing the first 10 characters to get "today" is one of the most common date bugs in JavaScript.',
    proof: raw`// 9:30 PM in Los Angeles
const evening = new Date('2026-03-10T21:30:00-07:00');

console.log(evening.toLocaleString('en-US', {
  timeZone: 'America/Los_Angeles',
}));
console.log(evening.toISOString().slice(0, 10));`,
    source: { label: 'toISOString() on MDN', url: mdn('Global_Objects/Date/toISOString') },
  },
  {
    id: 'timestamps-fit-in-32-bits',
    category: 'time',
    claim: 'A Unix timestamp fits in a 32-bit integer.',
    answer: false,
    truth: 'Not after 03:14:07 UTC on January 19, 2038.',
    explain:
      'Signed 32-bit integers top out at 2,147,483,647 seconds after 1970. One second later they wrap around to 1901. Embedded systems, file formats, and databases still store time this way.',
    proof: raw`const seconds = (iso) => Date.parse(iso) / 1000;

console.log(seconds('2038-01-19T03:14:07Z') | 0);

// One second later:
console.log(seconds('2038-01-19T03:14:08Z') | 0);`,
    source: { label: 'Year 2038 problem', url: wiki('Year_2038_problem') },
  },
  {
    id: 'time-zones-never-change',
    category: 'time',
    claim: 'A place\'s time zone never changes.',
    answer: false,
    truth: 'Samoa jumped across the date line in 2011 and skipped December 30 entirely.',
    explain:
      'Countries change their offsets and daylight saving rules all the time, sometimes with weeks of notice. Samoa moved from UTC-10 to UTC+14 to line up with its trading partners, so Thursday was followed by Saturday.',
    proof: raw`const apia = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Pacific/Apia', dateStyle: 'full', timeStyle: 'short',
});
const thursday = Date.UTC(2011, 11, 29, 21);
const day = 24 * 60 * 60 * 1000;

console.log(apia.format(thursday));
console.log(apia.format(thursday + day));   // a day later`,
    source: { label: 'Time in Samoa', url: wiki('Time_in_Samoa') },
  },
  {
    id: 'utc-has-no-dst',
    category: 'time',
    claim: 'UTC never observes daylight saving time.',
    answer: true,
    truth: 'True. UTC is the same all year, which is why servers and logs should use it.',
    explain:
      'Daylight saving belongs to local time zones, never to UTC itself. London matches UTC only in winter, so "London time" and "UTC" are not interchangeable.',
    proof: raw`const offset = (timeZone, month = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone, timeZoneName: 'longOffset',
  }).formatToParts(Date.UTC(2026, month, 15))
    .find((part) => part.type === 'timeZoneName').value;

console.log('UTC', offset('UTC', 0), offset('UTC', 6));
console.log('London', offset('Europe/London', 0),
  offset('Europe/London', 6));`,
    source: { label: 'Coordinated Universal Time', url: wiki('Coordinated_Universal_Time') },
  },
  {
    id: 'january-1-is-week-1',
    category: 'time',
    claim: 'January 1 is always in week 1.',
    answer: false,
    truth: 'In ISO week numbering, January 1, 2027 is in week 53 of 2026.',
    explain:
      'ISO weeks start on Monday, and a week belongs to the year that contains its Thursday. So the first days of January can belong to the previous year\'s last week, and late December can belong to next year\'s first.',
    proof: raw`// An ISO week belongs to the year of its Thursday.
const date = new Date(Date.UTC(2027, 0, 1));
const sinceMonday = (date.getUTCDay() + 6) % 7;
const thursday = new Date(date);
thursday.setUTCDate(date.getUTCDate() - sinceMonday + 3);

console.log(date.toUTCString().slice(0, 16));
console.log('Its week belongs to', thursday.getUTCFullYear());`,
    source: { label: 'ISO week date', url: wiki('ISO_week_date') },
  },

  // ---- Numbers ---------------------------------------------------------------
  {
    id: 'point-one-plus-point-two',
    category: 'numbers',
    claim: '`0.1 + 0.2 === 0.3`',
    answer: false,
    truth: '`0.1 + 0.2` is `0.30000000000000004`.',
    explain:
      'Binary floating point can\'t store 0.1 or 0.2 exactly, so their sum is off by a tiny amount. Compare floats with a tolerance, and keep money in whole cents.',
    proof: raw`console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);`,
    source: { label: 'What Every Computer Scientist Should Know About Floating-Point Arithmetic', url: 'https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html' },
  },
  {
    id: 'every-integer-fits',
    category: 'numbers',
    claim: 'Any whole number can be stored exactly in a JavaScript number.',
    answer: false,
    truth: 'Above 2^53, numbers start skipping: 2^53 + 1 equals 2^53.',
    explain:
      'JavaScript numbers are 64-bit floats with 53 bits of precision. IDs from databases and APIs (like 64-bit tweet IDs) get silently rounded unless you keep them as strings or BigInt.',
    proof: raw`console.log(2 ** 53);
console.log(2 ** 53 + 1);
console.log(2 ** 53 === 2 ** 53 + 1);
console.log(2n ** 53n + 1n);`,
    source: { label: 'Number.MAX_SAFE_INTEGER on MDN', url: mdn('Global_Objects/Number/MAX_SAFE_INTEGER') },
  },
  {
    id: 'round-half-away',
    category: 'numbers',
    claim: '`Math.round(-2.5)` is -3.',
    answer: false,
    truth: '`Math.round(-2.5)` is -2: halves always round up, toward positive infinity.',
    explain:
      'There are several ways to round a half. JavaScript rounds toward positive infinity, many people expect "away from zero", and Python\'s round() uses banker\'s rounding, so `round(2.5)` is 2 there.',
    proof: raw`console.log(Math.round(2.5));
console.log(Math.round(-2.5));
console.log(Math.round(-2.51));`,
    source: { label: 'Math.round() on MDN', url: mdn('Global_Objects/Math/round') },
  },
  {
    id: 'equal-to-itself',
    category: 'numbers',
    claim: 'Every value is equal to itself.',
    answer: false,
    truth: 'NaN is not equal to anything, including NaN.',
    explain:
      'The floating point standard says NaN compares unequal to everything. That breaks naive deduplication, `indexOf()`, and equality checks. Use `Number.isNaN()` or `Object.is()`.',
    proof: raw`const x = NaN;
console.log(x === x);
console.log([NaN].indexOf(NaN), [NaN].includes(NaN));
console.log(Number.isNaN(x), Object.is(x, x));`,
    source: { label: 'NaN on MDN', url: mdn('Global_Objects/NaN') },
  },
  {
    id: 'zero-and-negative-zero',
    category: 'numbers',
    claim: '0 and -0 are the same number.',
    answer: false,
    truth: 'They compare equal with `===`, but they\'re different values.',
    explain:
      'Floating point has a signed zero. `0 === -0` is true, but dividing by them gives opposite infinities, and `Object.is()` tells them apart. Round -0.4 for a weather app and `Intl.NumberFormat` shows "-0" degrees.',
    proof: raw`console.log(0 === -0);
console.log(Object.is(0, -0));
console.log(1 / 0, 1 / -0);

const rounded = Math.round(-0.4);
console.log(String(rounded), rounded.toLocaleString('en-US'));`,
    source: { label: 'Equality comparisons on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness' },
  },
  {
    id: 'tofixed-rounds',
    category: 'numbers',
    claim: '`(1.005).toFixed(2)` is `"1.01"`.',
    answer: false,
    truth: 'It\'s `"1.00"`, because 1.005 is really 1.00499999999999989...',
    explain:
      'The literal 1.005 can\'t be stored exactly; the nearest float is slightly below it. `toFixed()` rounds the stored value correctly, which isn\'t the value you typed.',
    proof: raw`console.log((1.005).toFixed(2));
console.log((1.005).toPrecision(20));`,
    source: { label: 'toFixed() on MDN', url: mdn('Global_Objects/Number/toFixed') },
  },
  {
    id: 'number-reads-commas',
    category: 'numbers',
    claim: '`Number("12,5")` is 12.5.',
    answer: false,
    truth: 'It\'s NaN. And `parseFloat("12,5")` quietly returns 12.',
    explain:
      'Much of the world writes decimals with a comma. JavaScript\'s parsers only understand a dot, and `parseFloat()` stops at the first character it doesn\'t like, which hides the problem.',
    proof: raw`console.log(Number('12,5'));
console.log(parseFloat('12,5'));
console.log((12.5).toLocaleString('de-DE'));`,
    source: { label: 'Falsehoods about internationalization', url: falsehoods('internationalization') },
  },
  {
    id: 'germany-writes-1-5',
    category: 'numbers',
    claim: 'Germany writes one and a half as 1,5.',
    answer: true,
    truth: 'True. Germany uses a comma for decimals and a dot for thousands.',
    explain:
      'So does much of Europe and South America. Switzerland uses an apostrophe for thousands, and India groups digits in twos after the first three.',
    proof: raw`for (const locale of ['en-US', 'de-DE', 'de-CH', 'en-IN']) {
  console.log(locale, (1234567.5).toLocaleString(locale));
}`,
    source: { label: 'Decimal separator', url: wiki('Decimal_separator') },
  },
  {
    id: 'sort-sorts-numbers',
    category: 'numbers',
    claim: '`[10, 9, 1].sort()` sorts the numbers.',
    answer: false,
    truth: 'It returns `[1, 10, 9]`: `sort()` compares values as strings by default.',
    explain:
      'Without a compare function, `sort()` converts everything to strings and compares them character by character. Pass `(a, b) => a - b` for numbers.',
    proof: raw`console.log([10, 9, 1].sort());
console.log([10, 9, 1].sort((a, b) => a - b));`,
    source: { label: 'Array.prototype.sort() on MDN', url: mdn('Global_Objects/Array/sort') },
  },
  {
    id: 'parseint-tiny',
    category: 'numbers',
    claim: '`parseInt(0.0000005)` is 0.',
    answer: false,
    truth: 'It\'s 5, because 0.0000005 turns into the string `"5e-7"` first.',
    explain:
      '`parseInt()` expects a string. It converts the number, gets `"5e-7"`, reads the 5, and stops at the "e". Use `Math.trunc()` to drop decimals from a number.',
    proof: raw`console.log(String(0.0000005));
console.log(parseInt(0.0000005));
console.log(Math.trunc(0.0000005));`,
    source: { label: 'parseInt() on MDN', url: mdn('Global_Objects/parseInt') },
  },
  {
    id: 'math-max-empty',
    category: 'numbers',
    claim: '`Math.max()` with no arguments returns -Infinity.',
    answer: true,
    truth: 'True. -Infinity is the starting point that any number beats.',
    explain:
      '`Math.max()` starts from -Infinity and `Math.min()` from Infinity, so an empty list gives a "smaller than everything" maximum. Spreading an empty array into `Math.max()` returns -Infinity, not an error.',
    proof: raw`console.log(Math.max());
console.log(Math.min());
console.log(Math.max(...[]));`,
    source: { label: 'Math.max() on MDN', url: mdn('Global_Objects/Math/max') },
  },
  {
    id: 'typeof-nan',
    category: 'numbers',
    claim: '`typeof NaN` is `"number"`.',
    answer: true,
    truth: 'True. "Not a Number" is a number.',
    explain:
      'NaN is a special floating point value, so its type is number. That\'s why `typeof x === "number"` isn\'t enough to know you have a usable number; check `Number.isFinite(x)` too.',
    proof: raw`console.log(typeof NaN);
console.log(Number.isFinite(NaN), Number.isFinite(42));`,
    source: { label: 'NaN on MDN', url: mdn('Global_Objects/NaN') },
  },
  {
    id: 'ten-less-than-nine',
    category: 'numbers',
    claim: '`"10" < "9"` is true in JavaScript.',
    answer: true,
    truth: 'True. Strings compare character by character, and "1" comes before "9".',
    explain:
      'When both sides are strings, `<` compares them like words in a dictionary. Version numbers and IDs read from inputs or URLs are strings until you convert them.',
    proof: raw`console.log('10' < '9');
console.log(10 < 9);
console.log('10' < 9);   // a number converts the other side`,
    source: { label: 'Less than (<) on MDN', url: mdn('Operators/Less_than') },
  },

  // ---- Text ------------------------------------------------------------------
  {
    id: 'same-looking-strings-are-equal',
    category: 'text',
    claim: 'Two strings that look the same are equal.',
    answer: false,
    truth: '"é" can be one code point or two, and the two versions aren\'t equal.',
    explain:
      'Unicode lets you write é as a single character or as e plus a combining accent. They look identical and compare unequal. Normalize text (usually to NFC) before comparing or storing it.',
    proof: raw`const precomposed = 'café';
const combining = 'café';

console.log(precomposed, combining);
console.log(precomposed === combining);
console.log(precomposed === combining.normalize('NFC'));`,
    source: { label: 'Unicode equivalence', url: wiki('Unicode_equivalence') },
  },
  {
    id: 'length-counts-characters',
    category: 'text',
    claim: 'A string\'s length is the number of characters you see.',
    answer: false,
    truth: 'The single emoji 👩‍💻 has a length of 5.',
    explain:
      'The `length` property counts UTF-16 code units. Many emoji take two, and some are several emoji joined together. To count what people see, use `Intl.Segmenter`.',
    proof: raw`const coder = '👩‍💻';
const segments = new Intl.Segmenter().segment(coder);

console.log(coder.length);          // UTF-16 code units
console.log([...coder].length);     // code points
console.log([...segments].length);  // what you see`,
    source: { label: 'Intl.Segmenter on MDN', url: mdn('Global_Objects/Intl/Segmenter') },
  },
  {
    id: 'reverse-a-string',
    category: 'text',
    claim: 'You can reverse a string with `split(\'\').reverse().join(\'\')`.',
    answer: false,
    truth: 'It moves combining accents onto the wrong letters and breaks emoji.',
    explain:
      'Splitting into code units tears apart characters that are made of more than one. "noël" written with a combining diaeresis reverses into "l̈eon".',
    proof: raw`const word = 'noël';   // noël, with a combining diaeresis

console.log(word);
console.log(word.split('').reverse().join(''));`,
    source: { label: 'Falsehoods about internationalization', url: falsehoods('internationalization') },
  },
  {
    id: 'uppercase-keeps-length',
    category: 'text',
    claim: 'Uppercasing a string doesn\'t change its length.',
    answer: false,
    truth: '"straße" becomes "STRASSE", one letter longer.',
    explain:
      'Some letters have no single uppercase form. German ß traditionally uppercases to SS. Code that uppercases text and then indexes into the original by position gets out of step.',
    proof: raw`const street = 'straße';

console.log(street.toUpperCase());
console.log(street.length, street.toUpperCase().length);`,
    source: { label: 'ß on Wikipedia', url: wiki('%C3%9F') },
  },
  {
    id: 'lowercase-is-one-letter',
    category: 'text',
    claim: 'Lowercasing one letter gives you one letter.',
    answer: false,
    truth: 'Turkish İ lowercases to i plus a combining dot: two code units.',
    explain:
      'Turkish has a dotted and a dotless i in both cases (İ/i and I/ı). Outside a Turkish locale, İ lowercases to "i̇", and uppercasing that again doesn\'t give you İ back.',
    proof: raw`const lower = 'İ'.toLowerCase();

console.log(lower, lower.length);
console.log(lower.toUpperCase() === 'İ');
console.log('İ'.toLocaleLowerCase('tr'));`,
    source: { label: 'Dotted and dotless I in computing', url: wiki('Dotted_and_dotless_I_in_computing') },
  },
  {
    id: 'sort-is-alphabetical',
    category: 'text',
    claim: '`Array.prototype.sort()` puts words in alphabetical order.',
    answer: false,
    truth: 'It sorts by code unit, so capitals and accented letters end up in odd places.',
    explain:
      'Default `sort()` compares UTF-16 code units: every capital letter comes before every lowercase one, and É lands after z. Use `Intl.Collator`, or `localeCompare()`, to sort for people.',
    proof: raw`const names = ['Zoë', 'zebra', 'Émile', 'apple'];

console.log([...names].sort());
console.log([...names].sort(new Intl.Collator('en').compare));`,
    source: { label: 'Intl.Collator on MDN', url: mdn('Global_Objects/Intl/Collator') },
  },
  {
    id: 'alphabet-is-universal',
    category: 'text',
    claim: 'Alphabetical order is the same in every language.',
    answer: false,
    truth: 'In Swedish, ö comes after z. In German, it sorts with o.',
    explain:
      'Collation rules differ by language. Swedish treats å, ä, and ö as separate letters at the end of the alphabet; German treats ö as a kind of o. Sort with the user\'s locale.',
    proof: raw`const words = ['zebra', 'ödla'];

console.log([...words].sort(new Intl.Collator('de').compare));
console.log([...words].sort(new Intl.Collator('sv').compare));`,
    source: { label: 'Swedish alphabet', url: wiki('Swedish_alphabet') },
  },
  {
    id: 'one-character-one-byte',
    category: 'text',
    claim: 'One character takes one byte.',
    answer: false,
    truth: 'In UTF-8, a character takes 1 to 4 bytes.',
    explain:
      'ASCII letters take one byte in UTF-8, accented letters two, € three, and emoji four. Database columns and APIs that limit "characters" often really limit bytes.',
    proof: raw`const bytes = (text) => new TextEncoder().encode(text).length;

console.log(bytes('a'), bytes('é'), bytes('€'), bytes('😀'));`,
    source: { label: 'UTF-8', url: wiki('UTF-8') },
  },
  {
    id: 'invisible-characters',
    category: 'text',
    claim: 'If two strings look identical, they\'re the same length.',
    answer: false,
    truth: 'A zero-width space is invisible and still counts.',
    explain:
      'Unicode has characters that take up no space at all, like U+200B. Pasted text often carries them along, so a username or search term that looks right still doesn\'t match.',
    proof: raw`const plain = 'hello';
const pasted = 'hel​lo';   // with a zero-width space

console.log(plain, pasted);
console.log(plain.length, pasted.length, plain === pasted);`,
    source: { label: 'Zero-width space', url: wiki('Zero-width_space') },
  },
  {
    id: 'case-insensitive-compare',
    category: 'text',
    claim: 'To compare text without case, lowercase both sides.',
    answer: false,
    truth: '"STRASSE" and "straße" are the same word, but their lowercase forms differ.',
    explain:
      'Case folding isn\'t one-to-one. Comparing with `Intl.Collator` or `localeCompare()` and `sensitivity: "base"` treats them as equal, along with accents if you want that.',
    proof: raw`const a = 'STRASSE';
const b = 'straße';

console.log(a.toLowerCase() === b.toLowerCase());

const order = a.localeCompare(b, 'de', { sensitivity: 'base' });
console.log(order === 0);`,
    source: { label: 'localeCompare() on MDN', url: mdn('Global_Objects/String/localeCompare') },
  },

  // ---- Names -----------------------------------------------------------------
  {
    id: 'first-and-last-name',
    category: 'names',
    claim: 'Everyone has a first name and a last name.',
    answer: false,
    truth: 'Many people have a single name. Indonesia\'s first president was just Sukarno.',
    explain:
      'Single names are common in Indonesia, and they turn up everywhere else too. A form with two required fields makes these people invent a name, usually by repeating the one they have.',
    examples: ['Sukarno', 'Suharto', 'Teller (of Penn & Teller, legally)'],
    source: { label: 'Falsehoods Programmers Believe About Names', url: 'https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/' },
  },
  {
    id: 'family-name-last',
    category: 'names',
    claim: 'The family name comes last.',
    answer: false,
    truth: 'In Chinese, Japanese, Korean, Vietnamese, and Hungarian names, it usually comes first.',
    explain:
      'Xi Jinping\'s family name is Xi. In Hungarian, the composer is Bartók Béla. "First name" and "last name" fields get these backwards; "given name" and "family name" don\'t.',
    examples: ['Xi Jinping (family name Xi)', 'Bartók Béla (Béla Bartók in English order)', 'Nguyễn Thị Minh Khai (family name Nguyễn)'],
    source: { label: 'Personal name order', url: wiki('Personal_name#Name_order') },
  },
  {
    id: 'everyone-has-a-family-name',
    category: 'names',
    claim: 'Everyone has a family name.',
    answer: false,
    truth: 'Most Icelanders use a patronymic instead, and most Burmese people have no family name at all.',
    explain:
      'Björk Guðmundsdóttir\'s last name means "daughter of Guðmundur"; her children\'s last names come from her or their father, not from a shared family name. Matching family members by last name doesn\'t work here.',
    examples: ['Björk Guðmundsdóttir', 'Aung San Suu Kyi'],
    source: { label: 'Icelandic name', url: wiki('Icelandic_name') },
  },
  {
    id: 'names-are-ascii',
    category: 'names',
    claim: 'People\'s names fit in ASCII.',
    answer: false,
    truth: 'Most of the world\'s names don\'t.',
    explain:
      'Accents, other scripts, and letters like Ø and Đ are part of people\'s names. Stripping them changes the name, and rejecting them tells people their name is invalid.',
    proof: raw`const names = ['Zoë Saldaña', 'Nguyễn Thị Minh Khai',
  'Øyvind', 'Đorđe', '王菲'];
const isAscii = (text) => /^[\x00-\x7F]*$/.test(text);

for (const name of names) console.log(name, isAscii(name));`,
    source: { label: 'Falsehoods Programmers Believe About Names', url: 'https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/' },
  },
  {
    id: 'names-never-change',
    category: 'names',
    claim: 'People keep the same name their whole life.',
    answer: false,
    truth: 'People change names when they marry, divorce, transition, naturalize, or simply decide to.',
    explain:
      'Using a name as an identifier, or making it hard to change, breaks accounts and records. Store a stable ID and let the name be edited.',
    examples: ['A married name, then a maiden name again', 'A name changed at naturalization', 'A chosen name that matches who someone is'],
    source: { label: 'Falsehoods about human identity', url: falsehoods('human-identity') },
  },
  {
    id: 'names-are-letters',
    category: 'names',
    claim: 'Names contain only letters.',
    answer: false,
    truth: 'Apostrophes, hyphens, spaces, and particles are all common.',
    explain:
      'Validation like `/^[A-Za-z]+$/` rejects O\'Brien, Jean-Luc, and anyone with two family names. Accept what people type, and escape it properly when you use it.',
    examples: ["Siobhán O'Brien", 'Jean-Luc Picard', 'Gabriel García Márquez', 'Ludwig van Beethoven'],
    source: { label: 'Falsehoods Programmers Believe About Names', url: 'https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/' },
  },

  // ---- Places ----------------------------------------------------------------
  {
    id: 'every-address-has-a-postcode',
    category: 'places',
    claim: 'Every address has a postal code.',
    answer: false,
    truth: 'Hong Kong doesn\'t use them, and Ireland had none until 2015.',
    explain:
      'A required postal code field blocks real addresses. Ireland introduced Eircodes in 2015; Hong Kong still delivers without postal codes.',
    examples: ['Hong Kong: no postal codes', 'Ireland: Eircode since 2015'],
    source: { label: 'Falsehoods about postal addresses', url: falsehoods('postal-addresses') },
  },
  {
    id: 'postcodes-are-numbers',
    category: 'places',
    claim: 'Postal codes are numbers.',
    answer: false,
    truth: 'British and Canadian postcodes have letters, and US ZIP codes can start with 0.',
    explain:
      'Storing a postal code as a number either fails or drops leading zeros: Agawam, Massachusetts is 01001, not 1001. Keep postal codes as text.',
    proof: raw`for (const code of ['SW1A 1AA', 'K1A 0B1', '01001', '110001']) {
  console.log(code, Number(code));
}`,
    source: { label: 'Falsehoods about postal addresses', url: falsehoods('postal-addresses') },
  },
  {
    id: 'one-time-zone-per-country',
    category: 'places',
    claim: 'Each country has one time zone.',
    answer: false,
    truth: 'France spans 12, more than any other country. China, about 5,000 km wide, uses just one.',
    explain:
      'France\'s overseas territories stretch from the Pacific to the Indian Ocean. Inferring a time zone from a country code only works for some countries, and then only most of the time.',
    examples: ['France: 12 time zones', 'Russia: 11', 'United States: 11 including territories', 'China: 1'],
    source: { label: 'Time in France', url: wiki('Time_in_France') },
  },
  {
    id: 'addresses-have-streets',
    category: 'places',
    claim: 'Every address has a street name.',
    answer: false,
    truth: 'Most Japanese addresses name a district, block, and building number instead.',
    explain:
      'In Japan, streets usually don\'t have names; blocks do. Address forms built around "street and number" force people to squeeze their address into the wrong fields.',
    examples: ['1 Chome-1-2 Oshiage, Sumida City, Tokyo'],
    source: { label: 'Japanese addressing system', url: wiki('Japanese_addressing_system') },
  },
  {
    id: 'country-names-are-fixed',
    category: 'places',
    claim: 'Country names don\'t change.',
    answer: false,
    truth: 'Swaziland became Eswatini in 2018, and Macedonia became North Macedonia in 2019.',
    explain:
      'Countries rename themselves, split, and merge. Keep country codes, not names, in your data, and get display names from a source that\'s kept up to date, like `Intl.DisplayNames`.',
    proof: raw`const regions = new Intl.DisplayNames(['en'], { type: 'region' });

for (const code of ['SZ', 'MK', 'CZ']) {
  console.log(code, regions.of(code));
}`,
    source: { label: 'Falsehoods about geography', url: falsehoods('geography') },
  },

  // ---- Money -----------------------------------------------------------------
  {
    id: 'two-decimal-places',
    category: 'money',
    claim: 'Every currency has two decimal places.',
    answer: false,
    truth: 'The yen has none, and the Kuwaiti dinar has three.',
    explain:
      'ISO 4217 gives each currency its own number of minor units. Hard-coding two decimals shows ¥1,234.57 for a price that has no cents, and drops the third digit of a dinar price.',
    proof: raw`for (const currency of ['USD', 'JPY', 'KWD']) {
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
  });
  const digits = price.resolvedOptions().maximumFractionDigits;
  console.log(currency, digits, price.format(1234.5678));
}`,
    source: { label: 'ISO 4217', url: wiki('ISO_4217') },
  },
  {
    id: 'symbol-goes-first',
    category: 'money',
    claim: 'The currency symbol goes before the amount.',
    answer: false,
    truth: 'In Germany and France, it goes after: 123.456,78 €.',
    explain:
      'Where the symbol goes, which separators to use, and how digits group all depend on the locale. Format prices with `Intl.NumberFormat` instead of gluing a symbol onto a number.',
    proof: raw`for (const locale of ['en-US', 'de-DE', 'fr-FR', 'en-IN']) {
  const price = new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'EUR',
  });
  console.log(locale, price.format(123456.78));
}`,
    source: { label: 'Falsehoods about prices', url: falsehoods('business') },
  },
  {
    id: 'money-as-floats',
    category: 'money',
    claim: 'It\'s fine to store money as a floating-point number.',
    answer: false,
    truth: 'Ten dimes add up to 0.9999999999999999 dollars.',
    explain:
      'Most decimal amounts can\'t be stored exactly in binary floating point, and the errors add up. Store money as an integer number of minor units (cents), or use a decimal type.',
    proof: raw`let dollars = 0;
let cents = 0;
for (let i = 0; i < 10; i++) {
  dollars += 0.10;
  cents += 10;
}

console.log(dollars, dollars === 1);
console.log(cents / 100);`,
    source: { label: 'Falsehoods about prices', url: falsehoods('business') },
  },
  {
    id: 'currency-codes-are-forever',
    category: 'money',
    claim: 'Currency codes never change.',
    answer: false,
    truth: 'Croatia swapped the kuna (HRK) for the euro on January 1, 2023.',
    explain:
      'Currencies are replaced and redenominated. Venezuela\'s bolívar soberano (VES) replaced VEF in 2018 with five zeros removed. Old prices and records need the currency they were made in.',
    examples: ['HRK to EUR: Croatia, 2023', 'VEF to VES: Venezuela, 2018', 'LTL to EUR: Lithuania, 2015'],
    source: { label: 'Croatia and the euro', url: wiki('Croatia_and_the_euro') },
  },

  // ---- The web ---------------------------------------------------------------
  {
    id: 'email-local-part-case',
    category: 'web',
    claim: 'The part of an email address before the @ is case-insensitive.',
    answer: false,
    truth: 'The standard lets mail servers treat it as case-sensitive. Only the domain is guaranteed not to be.',
    explain:
      'RFC 5321 says the local part may be case-sensitive, and it\'s up to the receiving server. Most big providers ignore case, so lowercasing usually works, but storing what the user typed is safer.',
    examples: ['Bob@example.com and bob@example.com can be different mailboxes', 'bob@EXAMPLE.com and bob@example.com are always the same'],
    source: { label: 'RFC 5321, section 2.4', url: 'https://www.rfc-editor.org/rfc/rfc5321#section-2.4' },
  },
  {
    id: 'email-has-no-spaces',
    category: 'web',
    claim: 'An email address can\'t contain spaces.',
    answer: false,
    truth: '`"john doe"@example.com` is valid, thanks to quoted local parts.',
    explain:
      'The email standard allows quoted local parts with spaces and other characters. The HTML spec\'s email input deliberately rejects them, calling its rule a "willful violation" of RFC 5322.',
    proof: raw`const input = document.createElement('input');
input.type = 'email';

input.value = 'john.doe@example.com';
console.log(input.value, input.checkValidity());
input.value = '"john doe"@example.com';
console.log(input.value, input.checkValidity());`,
    browserOnly: true,
    source: { label: 'Valid email address in the HTML spec', url: 'https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address' },
  },
  {
    id: 'phone-numbers-are-numbers',
    category: 'web',
    claim: 'A phone number can be stored as an integer.',
    answer: false,
    truth: 'Leading zeros and the + sign matter, and an integer drops both.',
    explain:
      'Phone numbers are identifiers made of digits, not quantities. Store them as text, ideally in E.164 format (`+442079460018`).',
    proof: raw`// A London number set aside for TV and film:
const london = '020 7946 0018';
console.log(Number(london.replaceAll(' ', '')));

const digits = '+44 20 7946 0018'.replace(/\D/g, '');
console.log(digits.length, 'digits');`,
    source: { label: 'Fictitious telephone numbers', url: wiki('Fictitious_telephone_number') },
  },
  {
    id: 'phone-numbers-have-10-digits',
    category: 'web',
    claim: 'Phone numbers have 10 digits.',
    answer: false,
    truth: 'International numbers can have up to 15 digits, and lengths vary within countries.',
    explain:
      'The E.164 standard allows up to 15 digits including the country code. Germany and Austria use numbers of different lengths. Don\'t validate phone numbers by counting digits.',
    examples: ['+1 202 555 0143: 11 digits', '+44 20 7946 0018: 12 digits', 'German numbers: different lengths, even within one city'],
    source: { label: 'E.164', url: wiki('E.164') },
  },
  {
    id: 'urls-are-case-insensitive',
    category: 'web',
    claim: 'URLs are case-insensitive.',
    answer: false,
    truth: 'Only the scheme and host are. The path and query are case-sensitive.',
    explain:
      'The URL parser lowercases https and example.com, but leaves /Docs alone, and many servers treat /Docs and /docs as different pages. Don\'t lowercase whole URLs to compare them.',
    proof: raw`const url = new URL('HTTPS://Example.COM/Docs/Readme?Q=1');

console.log(url.href);`,
    source: { label: 'URL Standard', url: 'https://url.spec.whatwg.org/' },
  },
  {
    id: 'default-port-is-same-url',
    category: 'web',
    claim: '`http://example.com:80/` and `http://example.com/` are the same URL.',
    answer: true,
    truth: 'True. Port 80 is the default for http, so the parser drops it.',
    explain:
      'Browsers normalize default ports away: 80 for http and 443 for https. A non-default port, like `https://example.com:80/`, is a different URL.',
    proof: raw`console.log(new URL('http://example.com:80/').href);
console.log(new URL('https://example.com:443/').href);
console.log(new URL('https://example.com:80/').href);`,
    source: { label: 'URL Standard', url: 'https://url.spec.whatwg.org/' },
  },
  {
    id: 'ip-addresses-have-four-numbers',
    category: 'web',
    claim: 'An IP address is four numbers separated by dots.',
    answer: false,
    truth: 'IPv6 addresses are eight groups of hex digits, usually shortened with ::.',
    explain:
      'A validator built for `203.0.113.7` rejects `2001:db8::1`. In URLs, IPv6 addresses go in square brackets so their colons don\'t look like a port.',
    proof: raw`const url = new URL('http://[2001:db8:0:0:0:0:0:1]:8080/');

console.log(url.hostname);
console.log(url.port);`,
    source: { label: 'IPv6 address', url: wiki('IPv6_address') },
  },
];
