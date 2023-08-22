import {useState, useEffect, useCallback} from 'react';
import WebSpeechPromptInput from "../WebSpeechPromptInput/WebSpeechPromptInput";
import './App.css';

type SlideCard = {
  image: string;
  voiceOverText?: string;
  nextPageTrigger?: string | RegExp;
  canTouch?: boolean
};

const deck: SlideCard[] = [
  {
    image: 'page1.png',
    nextPageTrigger: 'I\'m hungry',
    canTouch: true
  },
  {
    image: 'page2.png',
    voiceOverText: 'what do you want to order?',
    nextPageTrigger: /bacon burger/,
    canTouch: true
  },
  {
    image: 'page3.png',
    voiceOverText: 'Sure, a BBQ Bacon Burger'
  }
];

const App = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const currentSlide = deck[slideIndex];

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    setIsSpeaking(true);
    synth.cancel();

    setTimeout(() => {
      synth.speak(new SpeechSynthesisUtterance(text));
      console.log(`speaking ${text}`);
      const checkSpeaking = () => {
        console.log(`is it still speaking? ${synth.speaking}`);
        if (!synth.speaking) {
          setIsSpeaking(false);
        } else {
          setTimeout(checkSpeaking, 200);
        }
      };
      setTimeout(checkSpeaking, 2000);
    }, 1000);
  }, [setIsSpeaking]);

  useEffect(() => {
    if (currentSlide.voiceOverText) {
      speak(currentSlide.voiceOverText);
    }
    setTimeout(() => setIsTransitioning(false), 5000);
  }, [slideIndex, currentSlide, speak]);

  const onSubmit = useCallback(() => {
    console.log(`voice input: ${prompt} looking for: ${currentSlide.nextPageTrigger}`);
    const triggered = currentSlide.nextPageTrigger !== undefined &&
      (currentSlide.nextPageTrigger instanceof RegExp ?
      prompt.match(currentSlide.nextPageTrigger) :
      prompt.includes(currentSlide.nextPageTrigger));

    if (triggered) {
      console.log("trigger word match");
    }
    if ((triggered || prompt.includes('next page')) && slideIndex < deck.length - 1) {
      console.log(`progressing to page ${slideIndex + 1}`);
      setSlideIndex(slideIndex + 1);
      setIsTransitioning(true);
    } else if (prompt.includes('previous page') && slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
      setIsTransitioning(true);
    }
    setPrompt('');
  }, [currentSlide, slideIndex, prompt]);

  return (
    <div className="App">
      <div id="slide">
        <img src={`/${currentSlide.image}`}/>
      </div>
      <div id="input-container">
        <WebSpeechPromptInput
          prompt={prompt}
          onSubmit={onSubmit}
          key="prompt-input"
          updatePrompt={(prompt) => { console.log(`updatePrompt:${prompt}`); setPrompt(prompt); }}
          speaking={isTransitioning || isSpeaking}
        />
      </div>
    </div>
  );
}

export default App;
