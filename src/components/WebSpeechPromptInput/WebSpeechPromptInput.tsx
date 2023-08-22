import { useEffect, useRef, useCallback, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import mic from './images/mic.gif';
import micSlash from './images/mic-slash.gif';
import micAnimation from './images/mic-animation.gif';
import '../PromptInput/PromptInput.css';
//import { webkitSpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from 'dom-speech-recognition';

interface WebSpeechPromptInputProps {
  prompt: string;
  onSubmit: () => void;
  updatePrompt: (prompt: string) => void;
  speaking?: boolean;
}

const IDLE_TIMEOUT = 2000;
const two_line = /\n\n/g;
const one_line = /\n/g;
const linebreak = (s: string): string => {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

const first_char = /\S/;
const capitalize = (s: string): string => {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

const showInfo = (s: string) => {
  const messages = new Map([
    ["start", 'Click on the microphone icon and begin speaking.'],
    ["speak_now", 'Speak now.'],
    ["no_speech", 'No speech was detected. You may need to adjust your <a href="//support.google.com/chrome/answer/2693767" target="_blank">microphone settings</a>.'],
    ["no_microphone", 'No microphone was found. Ensure that a microphone is installed and that <a href="//support.google.com/chrome/answer/2693767" target="_blank">microphone settings</a> are configured correctly.'],
    ["allow", 'Click the "Allow" button above to enable your microphone.'],
    ["denied", 'Permission to use microphone was denied.'],
    ["blocked", 'Permission to use microphone is blocked. To change, go to chrome://settings/content/microphone'],
    ["upgrade", 'Web Speech API is not supported by this browser. It is only supported by <a href="//www.google.com/chrome">Chrome</a> version 25 or later on desktop and Android mobile.'],
    ["stop", 'Stop listening, click on the microphone icon to restart'],
    ["copy", 'Content copy to clipboard successfully.'],
    ["end_prompt", 'Prompt end...submiting']
  ]);

  if (s) {
    const message = messages.get(s);
    if (message) {
      console.log(message);
    } else {
      console.log(s);
    }
  }
};

const WebSpeechPromptInput: React.FC<WebSpeechPromptInputProps> = ({ prompt, onSubmit, updatePrompt, speaking }) => {
  const [talkButtonImage, setTalkButtonImage] = useState<string>(mic);
  const [recognition, setRecognition] = useState<SpeechRecognition>();
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [startTimestamp, setStartTimestamp] = useState<number>();
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [transcript, setTranscript] = useState<{ interim: string, finale: string }>({ interim: '', finale: '' });
  const [, setIdleTimer] = useState<number>();
  const [idleTimedOut, setIdleTimedOut] = useState<boolean>(false);
  const [enableSpeech, setEnableSpeech] = useState<boolean>(false);

  const upgrade = useCallback((): void => {
    showInfo('upgrade');
  }, []);

  useEffect(() => {
    if (!recognition || readyToSubmit) {
      return;
    }
    if (enableSpeech && !speaking && !recognizing) {
      console.log(`start speech recogition: ${recognition} recoginizing: ${recognizing} speaking: ${speaking}`);
      contentEditableRef?.current?.focus();

      console.log('start recognizing');
      recognition.lang = 'en-US';
      recognition.start();
      setTalkButtonImage(micSlash);
      showInfo('allow');
      setStartTimestamp(Date.now());
    } else if ((!enableSpeech || speaking) && recognizing) {
      console.log('stopping recognition...');
      recognition.stop();
      return;
    }
  }, [speaking, recognition, recognizing, enableSpeech, readyToSubmit]);

  const onMicClick = useCallback((event: React.MouseEvent) => {
    setEnableSpeech((value) => !value);
    /*
    console.log(`onMicClick: recogition: ${recognition} recoginizing: ${recognizing} prompt: ${prompt}`);
    contentEditableRef?.current?.focus();

    if (!recognition) {
      return;
    }
    if (recognizing) {
      console.log('stopping...');
      recognition.stop();
      return;
    }
    console.log('start recognition');
    recognition.lang = 'en-US';
    recognition.start();
    setTalkButtonImage(micSlash);
    showInfo('allow');
    setStartTimestamp(event.timeStamp);
    */

  }, [enableSpeech]);

  useEffect(() => {
    if (!readyToSubmit) {
      return;
    }
    console.log(`ready to submit: ${prompt}`);
    onSubmit();
    setReadyToSubmit(false);
  }, [prompt, readyToSubmit, onSubmit]);

  const checkKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.shiftKey) {
        document.execCommand('insertHTML', false, '<br/><br/>');
      } else {
        setReadyToSubmit(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const recognitionOnStart = useCallback(() => {
    setRecognizing(true);
    showInfo('speak_now');
    setTalkButtonImage(micAnimation);
  }, [prompt]);

  const recognitionOnEnd = useCallback(() => {
    console.log(`At end: recognizing:${recognizing} prompt:${prompt}`);
    setRecognizing(false);
    setTalkButtonImage(mic);
    showInfo('stop');
    setReadyToSubmit(true);
  }, [prompt, recognizing]);

  useEffect(() => {
    if (idleTimedOut) {
      console.log(`on idle timeout ${recognition} ${recognizing}`);
      if (recognition && recognizing) {
        showInfo('end_prompt');
        recognition.stop();
      }
    }
    setIdleTimedOut(false);
  }, [idleTimedOut, recognition, recognizing]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      upgrade();
    } else if (!recognition) {
      console.log(`initializing speech recognition`);
      setRecognition(() => {
        const r = new webkitSpeechRecognition();
        showInfo('start');  
        r.continuous = true;
        r.interimResults = true;

        r.onstart = () => {
          console.log('At start prompt:', prompt);
          showInfo('speak_now');
          setTalkButtonImage(micAnimation);
          setRecognizing(true);
        }
        r.onend = () => {
          console.log(`stop recognizing...`);
          setRecognizing(false);
          setTalkButtonImage(mic);
          showInfo('stop');
          setReadyToSubmit(true);
        }
        r.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
            setTalkButtonImage(mic);
            showInfo('no_speech');
            console.log(`no speech: prompt ${prompt}`);
            setReadyToSubmit(true);
          }
          if (event.error === 'audio-capture') {
            setTalkButtonImage(mic);
            showInfo('no_microphone');
          }
          if (event.error === 'not-allowed') {
            if (startTimestamp && event.timeStamp - startTimestamp < 100) {
              showInfo('blocked');
            } else {
              showInfo('denied');
            }
          }
        };
        r.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = { interim: '', finale: '' };

          for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript.finale += event.results[i][0].transcript;
            } else {
              transcript.interim += event.results[i][0].transcript;
            }
          }
          console.log(`voice transcript: interim '${transcript.interim}' final: '${transcript.finale}'`);
          setTranscript(transcript);
          setIdleTimer((oldTimer: number | undefined): number => {
            if (oldTimer) {
              clearTimeout(oldTimer);
            }
            return window.setTimeout(() => setIdleTimedOut(true), IDLE_TIMEOUT);
          });
        };
        return r;
      });
    }
  }, [prompt, recognition, recognizing, onSubmit, updatePrompt, upgrade, startTimestamp, recognitionOnStart, recognitionOnEnd]);

  useEffect(() => {
    window.addEventListener("keydown", checkKeyPress);
    return () => {
      window.removeEventListener("keydown", checkKeyPress);
    };
  }, [checkKeyPress]);

  useEffect(() => {
    // transcript changes
    if (transcript.finale !== '') {
      const newPrompt = prompt + transcript.finale;
      setTranscript({ interim: '', finale: '' });
      updatePrompt(newPrompt);
    }
  },[transcript, prompt]);

  return (
    <div>
      <ContentEditable
        innerRef={contentEditableRef}
        html={prompt}
        disabled={false}
        id="prompt-input"
        className="prompt-input"
        onChange={(event) => updatePrompt(event.target.value)}
      />
      <button style={{ display: 'inline-block' }} onClick={onMicClick}>
        <img src={talkButtonImage} alt="Lets Talk"/>
      </button>
    </div>
  );
};

export default WebSpeechPromptInput;


