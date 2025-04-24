import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import jujinHeart from "./image/pkht.png";
import centerHeart from "./image/sujin.png";
import fairy from "./image/fairy.png";
import ground from "./image/ground.png";
import startSound from "./sounds/onclick.mp3";
import eatSound from "./sounds/game.mp3.wav";
import bgMusicFile from "./sounds/game back.wav";

function App() {
  const [screen, setScreen] = useState("home");
  const [showGame, setShowGame] = useState(false);
  const [homeHearts, setHomeHearts] = useState([]);
  const [quizHearts, setQuizHearts] = useState([]);
  const [fairyX, setFairyX] = useState(100);
  const [fairyY, setFairyY] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const bgmRef = useRef(null);

  // 예시 질문 은 하트 ID 0~4 에 매핑
  const questionBank = {
    0: { text: "첫 번째 퀴즈: 영준이와 수진이가 사귄날짜는?", choices: ["3월7일","7월15일","7월16일"], answer: 1 },
    1: { text: "두 번째 퀴즈: 수진이가 키우는 고양이 이름은?", choices: ["두두","도도","돈돈"], answer: 1 },
    2: { text: "세 번째 퀴즈: 수진이와 갔던 아쿠아리움 지역은?", choices: ["수원","서울","양평"], answer: 1 },
    3: { text: "네 번째 퀴즈: 수진이가 가장 좋아하는 데이트코스는?", choices: ["바다","행궁동","백화점"], answer: 1 },
    4: { text: "다섯 번째 퀴즈: 수진이가 가고싶은 여행지는?", choices: ["제주도","강릉","노"], answer: 0 },
  };

  // 홈 하트 및 BGM 초기화
  useEffect(() => {
    setHomeHearts(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 20 + Math.random() * 30,
        duration: 5 + Math.random() * 5,
      }))
    );
    bgmRef.current = new Audio(bgMusicFile);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;
  }, []);

  // 퀴즈 하트 초기화
  useEffect(() => {
    if (!showGame) return;
    setQuizHearts(
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: 300 + i * 200,
        top: 250,
        found: false,
      }))
    );
    setFairyX(100);
    setFairyY(0);
    setBgOffset(0);
  }, [showGame]);

  // 키 이벤트 & 충돌 검사
  useEffect(() => {
    const onKey = (e) => {
      if (screen !== "quiz" || !showGame) return;
      let x = fairyX, b = bgOffset;
      if (e.key === "ArrowRight") { x += 20; b -= 20; }
      else if (e.key === "ArrowLeft") { x -= 20; b += 20; }
      else if (e.key === " " && !isJumping) {
        setIsJumping(true);
        let h = 0;
        const up = setInterval(() => {
          h += 5; setFairyY(h);
          if (h >= 50) {
            clearInterval(up);
            const down = setInterval(() => {
              h -= 5; setFairyY(h);
              if (h <= 0) { clearInterval(down); setIsJumping(false); }
            }, 20);
          }
        }, 20);
        new Audio(startSound).play();
      }
      setFairyX(x); setBgOffset(b);

      // 충돌 시 퀴즈 띄우기
      quizHearts.forEach(h => {
        if (!h.found && Math.abs(x - (h.left + b)) < 40) {
          new Audio(eatSound).play();
          setQuizHearts(qs => qs.map(q => q.id === h.id ? {...q,found:true} : q));
          const q = questionBank[h.id] || questionBank[0];
          setCurrentQuestion({ id: h.id, ...q });
        }
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, showGame, fairyX, bgOffset, isJumping, quizHearts]);

  const startGame = () => {
    new Audio(startSound).play();
    if (!muted) bgmRef.current.play().catch(()=>{});
    setShowGame(true);
  };

  const toggleMute = () => {
    setMuted(m => {
      const nxt = !m;
      if (nxt) bgmRef.current.pause();
      else bgmRef.current.play().catch(()=>{});
      return nxt;
    });
  };

  const handleAnswer = idx => {
    if (!currentQuestion) return;
    if (idx === currentQuestion.answer) alert("정답입니다!");
    else alert("틀렸어요!");
    setCurrentQuestion(null);
  };

  return (
    <div className="App">
      {/* 반짝이 하트 */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="sparkle-heart"
          style={{
            top:`${Math.random()*100}%`,
            left:`${Math.random()*100}%`,
            animationDelay:`${Math.random()*5}s`
          }}/>
      ))}

      {/* 홈 */}
      {screen==="home" && !showGame && <>
        {homeHearts.map(h=>(
          <img key={h.id}
            src={jujinHeart}
            className="floating-heart"
            style={{
              left:`${h.left}%`,
              width:`${h.size}px`,
              animationDuration:`${h.duration}s`
            }}/>
        ))}
        <div className="center-heart-container">
          <img src={centerHeart}
            className="center-heart"
            onClick={()=>setScreen("quiz")}/>
          <div className="heart-message">하트를 눌러줘</div>
        </div>
      </>}

      {/* 퀴즈 */}
      {screen==="quiz" && (
        <div className="quiz-screen">
          <div className="window">
            <div className="window-header">
              <div className="window-title">
                💻 퀴즈 게임
                <button className="mute-btn" onClick={toggleMute}>
                  {muted?"🔇":"🔊"}
                </button>
              </div>
              <div className="window-controls">
                <button onClick={()=>setShowGame(false)}>-</button>
                <button onClick={()=>setScreen("home")}>❌</button>
              </div>
            </div>
            {!showGame ? (
              <div className="pink-content">
                <h2 className="start-text" onClick={startGame}>
                  🎮 퀴즈 게임 시작
                </h2>
              </div>
            ) : (
              <div className="game-content">
                <img src={ground} className="game-background"
                  style={{left:`${bgOffset}px`}}/>
                {quizHearts.map(h=>!h.found&&(
                  <img key={h.id} src={jujinHeart}
                    className="heart-item"
                    style={{left:`${h.left+bgOffset}px`,top:h.top}}/>
                ))}
                <img src={fairy} className="fairy-character"
                  style={{left:fairyX,bottom:fairyY}}/>
              </div>
            )}
          </div>
          {/* 퀴즈 모달 */}
          {currentQuestion && (
            <div className="quiz-modal-backdrop">
              <div className="quiz-modal">
                <p className="quiz-question">{currentQuestion.text}</p>
                <div className="quiz-choices">
                  {currentQuestion.choices.map((c,i)=>
                    <button key={i}
                      className="quiz-choice"
                      onClick={()=>handleAnswer(i)}>
                      {i+1}. {c}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;






