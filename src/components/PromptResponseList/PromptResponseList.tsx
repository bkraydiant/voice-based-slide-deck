import React, {FC, useCallback, useEffect, useRef} from 'react';
import ChatGptImg from '../../img/chatgpt.png';
import MyImg from '../../img/me.png';
import ReactMarkdown from 'react-markdown';
import {ResponseInterface} from "./response-interface";
import hljs from 'highlight.js';
import './PromptResponseList.css';

interface PromptResponseListProps {
  onSpeaking: (speaking: boolean) => void;
  responseList: ResponseInterface[];
}

const PromptResponseList: FC<PromptResponseListProps> = ({ responseList, onSpeaking }) => {
  const responseListRef = useRef<HTMLDivElement>(null);
  const mdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hljs.highlightAll();
  })

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    onSpeaking(true);
    synth.cancel();

    setTimeout(() => {
      synth.speak(new SpeechSynthesisUtterance(text));
      console.log(`speaking ${text}`);
      const checkSpeaking = () => {
        console.log(`check speaking ${synth.speaking}`);
        if (!synth.speaking) {
          onSpeaking(false);
        } else {
          setTimeout(checkSpeaking, 1000);
        }
      };
      setTimeout(checkSpeaking, 2000);
    }, 1000);
  }, [onSpeaking]);

  useEffect(() => {
    hljs.highlightAll();
    mdRef.current?.scrollIntoView();
    if (responseList.length > 0) {
      const lastText = responseList[responseList.length - 1].response
      if (lastText) {
        speak(lastText);
      }
    }
  }, [responseList]);

  return (
    <div className="prompt-response-list" ref={responseListRef}>
      {responseList.map((responseData, index) => (
        <div className={"response-container " + (responseData.selfFlag ? 'my-question' : 'chatgpt-response')} key={responseData.id}>
          <img className="avatar-image" src={responseData.selfFlag ? MyImg : ChatGptImg} alt="avatar"/>
          <div className={(responseData.error ? 'error-response ' : '') + "prompt-content"} id={responseData.id}>
            { responseData.image &&
                <img src={responseData.image} className="ai-image" alt="generated ai"/>
            }
            { responseData.response &&
              <div ref={mdRef}>
                <ReactMarkdown
                  children={responseData.response ?? ''}
                  components={{
                    code({className, children}) {
                      return(
                        <code className={className}>
                          {children}
                        </code>
                      )
                    }
                  }}
                />
              </div>
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default PromptResponseList;
