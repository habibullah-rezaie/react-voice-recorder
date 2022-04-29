import React from "react";

export default function useStopWatch() {
  const [seconds, setSeconds] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(true);

  React.useEffect(() => {
    let timeoutId: undefined | number = undefined;
    if (!isPaused) {
      timeoutId = window.setInterval(() => {
        setSeconds((time: number) => time + 0.01);
      }, 10);
    }

    return () => {
      if (timeoutId !== undefined) window.clearInterval(timeoutId);
    };
  }, [isPaused]);

  const isStartTime = seconds === 0;

  const changeIsPaused = React.useCallback(() => {
    setIsPaused((pause) => !pause);
  }, []);

  const reset = React.useCallback(() => {
    setSeconds(0);
  }, []);

  return { isPaused, seconds, isStartTime, changeIsPaused, reset };
}