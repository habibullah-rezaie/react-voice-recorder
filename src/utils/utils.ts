export function formatTime(seconds: number, includeHour = false) {
  const hundredthOfSecond =
    seconds === 0 ? "00" : `${seconds}`.split(".")[1].slice(0, 2);
  const minString = `${Math.floor(seconds / 60)}`.padStart(2, "0");
  const secString = `${Math.floor(seconds % 60)}`.padStart(2, "0");
  const timeNoHour = `${minString}:${secString}:${hundredthOfSecond}`;
  if (!includeHour) {
    return timeNoHour;
  }

  const hourString = `${Math.floor(seconds / 3600)}`.padStart(2, "0");
  return `${hourString}:${timeNoHour}`;
}
