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
  const [lives, setLives] = useState(3);
  const [homeHearts, setHomeHearts] = useState([]);
  const [quizHearts, setQuizHearts] = useState([]);
  const [fairyX, setFairyX] = useState(100);
  const [fairyY, setFairyY] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [canMove, setCanMove] = useState(true);


  const bgmRef = useRef(null);
  const maxFairyX = 500; // 캐릭터가 이동할 수 있는 최대 X좌표

  const questionBank = {
    0: { text: "첫 번째 퀴즈: 사귄 날짜?", choices: ["3/7","7/15","7/16"], answer: 1 },
    1: { text: "두 번째: 고양이 이름?", choices: ["두두","도도","돈돈"], answer: 1 },
    2: { text: "세 번째: 아쿠아리움 지역?", choices: ["수원","서울","양평"], answer: 1 },
    3: { text: "네 번째: 좋아하는 데이트?", choices: ["바다","행궁동","백화점"], answer: 0 },
    4: { text: "다섯 번째: 가고싶은 여행?", choices: ["제주도","강릉","양평"], answer: 0 },
  };

  const [showCongrats, setShowCongrats] = useState(false);
  const [showNextPopup, setShowNextPopup] = useState(false);  // 새로운 팝업 상태 추가

  const handleCongratsClose = () => {
    setShowCongrats(false);      // 현재 축하 팝업 닫기
    setTimeout(() => {
      setShowNextPopup(true);    // 약간 delay 주고 새로운 팝업 띄우기
    }, 300); 
  };

  // 초기화: 홈 하트 + BGM
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
    bgmRef.current.loop = true; bgmRef.current.volume = 0.3;
  }, []);

  // 게임 시작 시: 퀴즈 하트 + 목숨 초기
  useEffect(() => {
    if (!showGame) return;
    setQuizHearts(
      Array.from({ length: 5 }, (_, i) => ({
        id: i, left: 200 + i * 200, top: 250, found: false
      }))
    );
    setFairyX(0); setFairyY(0); setBgOffset(0);
    setLives(3); setCurrentQuestion(null); setFeedback("");
  }, [showGame]);

  // 키 & 충돌
  useEffect(() => {
    const onKey = (e) => {
      if (screen !== "quiz" || !showGame || !canMove) return;
      let x = fairyX, b = bgOffset; 
      if (e.key === "ArrowRight") {
        if (fairyX < maxFairyX) { // 배경이 끝까지 이동하지 않았다면
          x += 10;
          b -= 10;
        } 
      }
      else if (e.key === "ArrowLeft") {
        if (bgOffset < 0) { // 왼쪽으로 갈 공간이 있다면
          x -= 10;
          b += 10;
        } 
      }
      else if (e.key === " " && !isJumping) {
        setIsJumping(true);
        let h=0;
        const up = setInterval(()=>{
          h+=5; setFairyY(h);
          if(h>=50){ clearInterval(up);
            const down=setInterval(()=>{
              h-=5; setFairyY(h);
              if(h<=0){ clearInterval(down); setIsJumping(false);}
            },20);
          }
        },20);
        new Audio(startSound).play();
      }
      setFairyX(x); setBgOffset(b);

      // 충돌 → 퀴즈 모달
      quizHearts.forEach(h=>{
        if(!h.found && Math.abs(x - (h.left+b))<40){
          new Audio(eatSound).play();
          setQuizHearts(qs=> qs.map(q=> q.id===h.id?{...q,found:true}:q));
          setCurrentQuestion({ id:h.id, ...questionBank[h.id] });
          setCanMove(false); // 🔒 이동 금지
        }
      });
    };
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [screen, showGame, fairyX, bgOffset, isJumping, quizHearts, canMove]);

  // 시작
  const startGame = () => {
    new Audio(startSound).play();
    if(!muted) bgmRef.current.play().catch(()=>{});
    setShowGame(true);
  };

  // 음소거
  const toggleMute = () => {
    setMuted(m=>{
      const nxt=!m;
      if(nxt) bgmRef.current.pause(); else bgmRef.current.play().catch(()=>{});
      return nxt;
    });
  };

  // 답안 누름
  const handleAnswer = idx => {
    if(!currentQuestion) return;
    if(idx===currentQuestion.answer){
      setFeedback("정답입니다! 🎉");
      setCorrectCount(c => {
        const next = c + 1;
  
        // 🎉 정답 5개 모두 맞춤!
        if (next === Object.keys(questionBank).length) {
          setTimeout(() => {
            setShowCongrats(true); // 팝업 열기!
          }, 500); // 잠깐 delay를 주는 게 자연스러움
        }
  
        return next;
      });
    } else {
      setFeedback("틀렸습니다 😢");
      setLives(l=>l-1);
    }
  };
  // 모달 닫기
const closeModal = () => {
  setCurrentQuestion(null);
  setFeedback("");
  setCanMove(true); // 🔓 이동 가능
  if (lives <= 0) {
    setShowGame(false);  // 게임 콘텐츠 숨기기
    setScreen("quiz");   // quiz 화면(시작 버튼)으로
  }
};


  return (
    <div className="App">

      {showNextPopup && (
        <div className="popup-backdrop">
          <div className="popup-box">
            <h2>너에게 닿기를..❤️ 체팅방에 초대되었습니다</h2>
            <p>채팅방으로 이동하시겠습니까?</p>
            <button onClick={() => {
              setShowNextPopup(false);
              setScreen("chat");  // ✅ 여기 추가!!
            }}>
              확인
            </button>
          </div>
        </div>
      )}



      {showCongrats && (
        <div className="popup-backdrop">
          <div className="popup-box">
            <h2>🎉 축하합니다!</h2>
            <p>모든 문제를 맞췄어요!</p>
            <button onClick={() => {
              handleCongratsClose(false)
            }}>
              닫기
            </button>
          </div>
        </div>
      )}


      {/* 반짝이 */}
      {Array.from({length:25}).map((_,i)=>
        <div key={i} className="sparkle-heart"
          style={{
            top:`${Math.random()*100}%`,
            left:`${Math.random()*100}%`,
            animationDelay:`${Math.random()*5}s`
          }}/>
      )}

      {/* 홈 */}
      {screen==="home" && !showGame && <>
        {homeHearts.map(h=>(
          <img key={h.id} src={jujinHeart} className="floating-heart"
            style={{
              left:`${h.left}%`,
              width:`${h.size}px`,
              animationDuration:`${h.duration}s`
            }}/>
        ))}
        <div className="center-heart-container">
          <img src={centerHeart} className="center-heart"
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

            {/* 시작 전 */}
            {!showGame ? (
              <div className="pink-content">
                <h2 className="start-text" onClick={startGame}>
                  🎮 퀴즈 게임 시작
                </h2>
              </div>
            ) : (
              <div className="game-content">
                <div className="game-background" style={{ backgroundPositionX: `${bgOffset}px` }} />
                {quizHearts.map(h=>!h.found&&(
                  <img key={h.id} src={jujinHeart} className="heart-item"
                    style={{left:`${h.left+bgOffset}px`,top:h.top}}/>
                ))}
                <img src={fairy} className="fairy-character"
                  style={{left:fairyX,bottom:fairyY}}/>

                {/* 목숨 (하트 3개) */}
                <div className="life-container">
                  {Array.from({length:lives>0?lives:0}).map((_,i)=>
                    <img key={i} src={jujinHeart} className="life-heart"/>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* 퀴즈 모달 */}
          {currentQuestion && (
            <div className="quiz-modal-backdrop">
              <div className="quiz-modal">
                <p className="quiz-question">{currentQuestion.text}</p>
                <div className="quiz-choices">
                  {currentQuestion.choices.map((c,i)=>(
                    <button key={i} className="quiz-choice"
                      onClick={()=>handleAnswer(i)}>
                      {i+1}. {c}
                    </button>
                  ))}
                </div>

                {feedback && (
                  <>
                    <p className="quiz-feedback">{feedback}</p>
                    <button className="quiz-close" onClick={closeModal}>
                      닫기
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {screen === "chat" && (
        <div className="quiz-screen">
          <div className="window">
            <div className="window-header">
              <div className="window-title">
                <div className="chat-screen">
                  <h2>💬 채팅방에 오신 걸 환영합니다!</h2>

                  {/* 채팅 메시지 영역 */}
                  <div className="chat-messages">
                    {/* 예시 메시지 */}
                    <div className="message received">안녕! 😊</div>
                    <div className="message sent">안녕~~ 💖</div>
                    <div className="message received">잘 지냈어?</div>
                  </div>

                  {/* 입력창 영역 */}
                  <div className="chat-input-area">
                    <input type="text" placeholder="메시지를 입력하세요..." className="chat-input" />
                    <button className="send-button">전송</button>
                  </div>
                </div>
              </div> 
            </div> 
          </div> 
        </div>
      )}
    </div>
  );
}

export default App;






