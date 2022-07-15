import React from "react";
import { DateTime } from "luxon";

const timeMinute = 60 * 1000;
const timeHour = timeMinute * 60;

//Used in the sidebar
export function getLastUpdateStatusTime(date: Date): React.ReactElement {
  const dateNow = new Date();
  const timeDiff = dateNow.getTime() - date.getTime();

  //Just now (1 minute)
  if (timeDiff < timeMinute) {
    return (
      <span
        style={{
          fontSize: 10,
        }}
      >
        Just now
      </span>
    );
  }

  //Within the hour
  if (timeDiff < timeHour) {
    const minutes = Math.floor(timeDiff / timeMinute);
    return (
      <span
        style={{
          fontSize: 10,
        }}
      >
        {`${minutes} min`}
      </span>
    );
  }

  //Within the day (14:11)
  if (checkSameDay(date, dateNow)) {
    return (
      <span
        style={{
          fontSize: 10,
        }}
      >
        {DateTime.fromJSDate(date).toLocaleString(DateTime.TIME_SIMPLE)!}
      </span>
    );
  }

  //Within the week (Sun)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return (
        <span
          style={{
            fontSize: 10,
          }}
        >
          {DateTime.fromJSDate(date).toFormat("ccc")}
        </span>
      );
    }
  }

  //Within the year (Dec 9)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return (
        <span
          style={{
            fontSize: 10,
          }}
        >
          {DateTime.fromJSDate(date).toFormat("LLL d")}
        </span>
      );
    }
  }

  //Anytime (Dec 2018)

  return (
    <span
      style={{
        fontSize: 10,
      }}
    >
      {DateTime.fromJSDate(date).toFormat("LLL yyyy")}
    </span>
  );
}

//Used in time separators between messages
export function getTimeDivider(date: Date): React.ReactElement {
  const dateNow = new Date();
  const luxon = DateTime.fromJSDate(date);
  const formattedTime = luxon.toLocaleString(DateTime.TIME_SIMPLE)!;
  //const formattedTime = dayjs(date).format('LT');

  //Same day (12:30)
  if (checkSameDay(date, dateNow)) {
    return (
      <span
        style={{
          fontSize: 10,
        }}
      >
        {formattedTime}
      </span>
    );
  }

  //Yesterday (Yesterday 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 1
    ); //Today (now) -> Yesterday
    if (checkSameDay(date, compareDate)) {
      return (
        <span
          style={{
            fontSize: 10,
          }}
        >
          <span style={{ fontWeight: 500 }}>Yesterday</span> {formattedTime}
        </span>
      );
    }
  }

  //Same 7-day period (Sunday • 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return (
        <span
          style={{
            fontSize: 10,
          }}
        >
          <span style={{ fontWeight: 500 }}>{luxon.toFormat("cccc")}</span>{" "}
          {formattedTime}
        </span>
      );
      //return dayjs(date).format("dddd") + bulletSeparator + formattedTime;
    }
  }

  //Same year (Sunday, December 9 • 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return (
        <span
          style={{
            fontSize: 10,
          }}
        >
          <span style={{ fontWeight: 500 }}>
            {luxon.toFormat("cccc, LLLL d")}
          </span>{" "}
          {formattedTime}
        </span>
      );
      //return dayjs(date).format("dddd, MMMM D") + bulletSeparator + formattedTime;
    }
  }

  //Different years (December 9, 2018 • 12:30)
  return (
    <span
      style={{
        fontSize: 10,
      }}
    >
      <span style={{ fontWeight: 500 }}>{luxon.toFormat("LLLL d, yyyy")}</span>{" "}
      {formattedTime}
    </span>
  );
  //return dayjs(date).format("ll") + bulletSeparator + formattedTime;
}

//Used in read receipts
export function getDeliveryStatusTime(date: Date): React.ReactElement {
  const dateNow = new Date();
  const luxon = DateTime.fromJSDate(date);
  const formattedTime = luxon.toLocaleString(DateTime.TIME_SIMPLE)!;

  //Same day (12:30)
  if (checkSameDay(date, dateNow)) {
    return <span>{formattedTime}</span>;
  }

  //Yesterday (Yesterday)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 1
    ); //Today (now) -> Yesterday
    if (checkSameDay(date, compareDate)) {
      return <span>Yesterday</span>;
    }
  }

  //Same 7-day period (Sunday)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return <span>{luxon.toFormat("cccc")}</span>;
    }
  }

  //Same year (Dec 9)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return <span>{luxon.toFormat("LLL d")}</span>;
    }
  }

  //Different years (Dec 9, 2018)
  return (
    <span>
      <span>{luxon.toFormat("LLL d, yyyy")}</span>
      {formattedTime}
    </span>
  );
}

function checkSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function compareDates(date1: Date, date2: Date): number {
  if (date1.getFullYear() < date2.getFullYear()) return -1;
  else if (date1.getFullYear() > date2.getFullYear()) return 1;
  else if (date1.getMonth() < date2.getMonth()) return -1;
  else if (date1.getMonth() > date2.getMonth()) return 1;
  else if (date1.getDate() < date2.getDate()) return -1;
  else if (date1.getDate() > date2.getDate()) return 1;
  else return 0;
}
