import "./App.css";

import React from "react";
import useStopWatch from "./utils/hooks/stopwatch";
import { formatTime } from "./utils/utils";
import PlayIcon from "./PlayIcon";
import Pause from "./Pause";
import Microphone from "./microphone";
import MicrophoneSlash from "./microphone-slash";
import Trash from "./Trash";

type RecorderState = "inactive" | "recording" | "not-ready";
type SetRecorderState = React.Dispatch<React.SetStateAction<RecorderState>>;
type RecordedTrack = {
  url: string;
  duration: number;
};
type SetRecordedTracks = React.Dispatch<React.SetStateAction<RecordedTrack[]>>;

function App() {
  const [recorderState, setRecorderState] =
    React.useState<RecorderState>("not-ready");

  const [recordedTracks, setRecordedTracks] = React.useState<RecordedTrack[]>([
    { url: "", duration: 0 },
  ]);

  const { seconds, changeIsPaused, reset, isPaused } = useStopWatch();

  React.useEffect(() => {
    document.title = "Stopwatch";
  }, []);

  React.useEffect(() => {
    recorderState === "recording" &&
      setRecordedTracks((prevArr) => {
        const currentRecording = prevArr[prevArr.length - 1];
        currentRecording.duration = seconds;
        return [...prevArr.slice(0, prevArr.length - 1), currentRecording];
      });

    // Because if add seconds the duration would change unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, recorderState]);

  const recordingBtnRef = React.useRef<null | HTMLButtonElement>(null);
  React.useEffect(() => {
    const recordingBtn = recordingBtnRef.current;
    let recorderBtnEventsHandler: () => void = () => {};
    let dataavailableHandler: null | ((ev: BlobEvent) => void) = null;
    let errorHandler: null | ((errEvent: MediaRecorderErrorEvent) => void) =
      null;
    let mediaRecorder: null | MediaRecorder = null;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      (mediaStream) => {
        mediaRecorder = new MediaRecorder(mediaStream);

        ({ recorderBtnEventsHandler, dataavailableHandler, errorHandler } =
          setEventHandlersForRecorderEffect(
            reset,
            changeIsPaused,
            setRecorderState,
            setRecordedTracks,
            mediaRecorder,
            recordingBtnRef
          ));

        setRecorderState("inactive");
      },
      (err) => {
        console.error(err);
      }
    );

    return () => {
      recorderEffectClearnup(
        dataavailableHandler,
        mediaRecorder,
        errorHandler,
        recordingBtn,
        recorderBtnEventsHandler
      );
    };
  }, [changeIsPaused, reset]);

  return (
    <>
      <div className="voice-recorder">
        <div className="buttons">
          <button
            className={`btn-record btn-record--${recorderState}`}
            ref={recordingBtnRef}
            disabled={recorderState === "not-ready"}
          >
            <span>
              {recorderState.match(/inactive|not-ready/) ? (
                <Microphone />
              ) : (
                <MicrophoneSlash />
              )}
            </span>
            <span>{formatTime(seconds)}</span>
          </button>
        </div>
        {recordedTracks.length > 0 && (
          <section className="tracks">
            <h2>Your Recorded Tracks:</h2>
            <ol className="tracks-list">
              {recordedTracks.map(({ url, duration }) => {
                return (
                  <Recording
                    key={url}
                    url={url}
                    duration={duration}
                    isCurrentRecording={
                      url === recordedTracks[recordedTracks.length - 1].url
                    }
                    onDelete={(url) => {
                      URL.revokeObjectURL(url);
                      setRecordedTracks((prevTracks) =>
                        prevTracks.filter((track) => track.url !== url)
                      );
                    }}
                  />
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}

export default App;

function setEventHandlersForRecorderEffect(
  reset: () => void,
  changeIsPaused: () => void,
  setRecorderState: SetRecorderState,
  setRecordings: SetRecordedTracks, // TODO: x any
  mediaRecorder: MediaRecorder,
  recordingBtnRef: React.MutableRefObject<HTMLButtonElement | null>
) {
  const dataavailableHandler = (ev: BlobEvent): void => {
    setRecordings((prevRecordings) => {
      const currentRecording = prevRecordings[prevRecordings.length - 1];
      currentRecording.url = URL.createObjectURL(ev.data);
      return [...prevRecordings, { url: "", duration: 0 }];
    });
  };
  const errorHandler = (errEvent: MediaRecorderErrorEvent): void =>
    console.error(errEvent.error);

  const recorderBtnEventsHandler = function recorderBtnEventsHandler() {
    switch (mediaRecorder?.state) {
      case "recording": {
        changeIsPaused();

        mediaRecorder?.stop();
        reset();
        break;
      }
      case "inactive": {
        mediaRecorder?.start();
        changeIsPaused();
        break;
      }
      default: {
        return;
      }
    }

    if (mediaRecorder) {
      setRecorderState(mediaRecorder.state);
    }
  };
  mediaRecorder.addEventListener("dataavailable", dataavailableHandler);
  mediaRecorder.addEventListener("error", errorHandler);
  if (recordingBtnRef.current) {
    recordingBtnRef.current.onclick = recorderBtnEventsHandler;
  }

  document.onkeydown = (ev) => {
    if (ev.key === " ") {
      recorderBtnEventsHandler();
    }
  };

  return { errorHandler, dataavailableHandler, recorderBtnEventsHandler };
}

function recorderEffectClearnup(
  dataavailableHandler: ((ev: BlobEvent) => void) | null,
  mediaRecorder: MediaRecorder | null,
  errorHandler: ((errEvent: MediaRecorderErrorEvent) => void) | null,
  recordingBtn: HTMLButtonElement | null,
  recorderBtnEventsHandler: () => void
) {
  if (dataavailableHandler)
    mediaRecorder?.removeEventListener("dataavailable", dataavailableHandler);

  if (errorHandler) mediaRecorder?.removeEventListener("error", errorHandler);

  recordingBtn?.removeEventListener("click", recorderBtnEventsHandler);
  recordingBtn?.removeEventListener("keydown", (ev) => {
    if (ev.key === " ") {
      recorderBtnEventsHandler();
    }
  });
}

function Recording({
  url,
  duration,
  isCurrentRecording,
  onDelete,
}: {
  url: string;
  isCurrentRecording: Boolean;
  duration: number;
  onDelete: (url: string) => void;
}) {
  const audio = React.useMemo(() => new Audio(url), [url]);
  const [audioState, changeAudioState] = React.useReducer<
    (p: "playing" | "paused") => "playing" | "paused"
  >((p) => {
    return p === "playing" ? "paused" : "playing";
  }, "paused");
  React.useEffect(() => {
    audio.onended = changeAudioState;

    return audio.removeEventListener("ended", changeAudioState);
  }, [audio]);
  return (
    <li
      className="recording"
      key={url}
      style={isCurrentRecording ? { display: "none" } : {}}
    >
      <div className="recording__btns">
        <button
          className="recording__play/pause"
          onClick={() => {
            if (audioState === "paused") audio.play();
            else audio.pause();
            changeAudioState();
          }}
        >
          {audioState === "paused" ? <PlayIcon /> : <Pause />}
        </button>
        <button className="recording__delete" onClick={() => onDelete(url)}>
          <Trash />
        </button>
      </div>
      <p>{formatTime(duration)}</p>
    </li>
  );
}
