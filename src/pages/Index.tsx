import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSound } from '@/hooks/useSound';

interface Riddle {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  hint: string;
}

interface HighScore {
  score: number;
  date: string;
  levelsCompleted: number;
}

const riddles: Riddle[] = [
  {
    id: 1,
    question: "Что можно увидеть с закрытыми глазами?",
    options: ["Темноту", "Сон", "Свет", "Мечту"],
    correctAnswer: 1,
    timeLimit: 30,
    hint: "Это происходит каждую ночь"
  },
  {
    id: 2,
    question: "Летит — кричит, сядет — молчит. Кто это?",
    options: ["Птица", "Снег", "Пуля", "Самолет"],
    correctAnswer: 1,
    timeLimit: 25,
    hint: "Это падает с неба зимой"
  },
  {
    id: 3,
    question: "Что становится больше, когда его ставят вверх ногами?",
    options: ["Стакан", "Число 6", "Зонт", "Дерево"],
    correctAnswer: 1,
    timeLimit: 20,
    hint: "Подумай о цифрах"
  },
  {
    id: 4,
    question: "Чем больше из неё берёшь, тем больше она становится. Что это?",
    options: ["Вода", "Яма", "Знание", "Время"],
    correctAnswer: 1,
    timeLimit: 20,
    hint: "Копают в земле"
  },
  {
    id: 5,
    question: "У кого есть шея, но нет головы?",
    options: ["Змея", "Бутылка", "Рубашка", "Гитара"],
    correctAnswer: 1,
    timeLimit: 18,
    hint: "Из этого пьют"
  },
  {
    id: 6,
    question: "Что идёт, но никогда не приходит?",
    options: ["Почта", "Время", "Человек", "Автобус"],
    correctAnswer: 1,
    timeLimit: 18,
    hint: "Его нельзя остановить"
  },
  {
    id: 7,
    question: "В воде не тонет и в огне не горит. Что это?",
    options: ["Камень", "Лёд", "Дерево", "Металл"],
    correctAnswer: 1,
    timeLimit: 15,
    hint: "Это замёрзшая вода"
  },
  {
    id: 8,
    question: "Что может путешествовать по миру, оставаясь в одном углу?",
    options: ["Монета", "Марка", "Книга", "Карта"],
    correctAnswer: 1,
    timeLimit: 15,
    hint: "Клеится на конверты"
  },
  {
    id: 9,
    question: "Чем больше ты знаешь, тем меньше ты видишь. Что это?",
    options: ["Свет", "Темнота", "Туман", "Ночь"],
    correctAnswer: 1,
    timeLimit: 12,
    hint: "Отсутствие света"
  },
  {
    id: 10,
    question: "Что принадлежит тебе, но другие используют это чаще?",
    options: ["Телефон", "Имя", "Дом", "Одежда"],
    correctAnswer: 1,
    timeLimit: 12,
    hint: "Так тебя называют"
  }
];

const HINT_COST = 50;

const Index = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(riddles[0].timeLimit);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'victory'>('menu');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [usedHints, setUsedHints] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sound = useSound();

  useEffect(() => {
    const savedScores = localStorage.getItem('riddleHighScores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          if (soundEnabled) {
            if (prev <= 6) {
              sound.playUrgentTick();
            } else if (prev % 5 === 0) {
              sound.playTick();
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft, soundEnabled, sound]);

  const saveHighScore = (finalScore: number, levelsCompleted: number) => {
    const newScore: HighScore = {
      score: finalScore,
      date: new Date().toLocaleDateString('ru-RU'),
      levelsCompleted
    };

    const updatedScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setHighScores(updatedScores);
    localStorage.setItem('riddleHighScores', JSON.stringify(updatedScores));
  };

  const handleTimeOut = () => {
    if (soundEnabled) sound.playGameOver();
    toast.error('Время вышло!');
    saveHighScore(score, currentLevel);
    setGameState('gameOver');
  };

  const useHint = () => {
    if (score < HINT_COST) {
      toast.error(`Недостаточно очков! Нужно ${HINT_COST} очков`);
      return;
    }

    if (usedHints.has(currentLevel)) {
      toast.info('Подсказка уже использована на этом уровне');
      return;
    }

    if (soundEnabled) sound.playHint();
    setScore(prev => prev - HINT_COST);
    setUsedHints(prev => new Set([...prev, currentLevel]));
    setShowHint(true);
    toast.success('Подсказка открыта!');
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const isCorrect = answerIndex === riddles[currentLevel].correctAnswer;

    setTimeout(() => {
      if (isCorrect) {
        if (soundEnabled) sound.playCorrect();
        const timeBonus = Math.floor(timeLeft * 10);
        setScore(prev => prev + 100 + timeBonus);
        toast.success(`Правильно! +${100 + timeBonus} очков`);
        
        if (currentLevel < riddles.length - 1) {
          setGameState('levelComplete');
        } else {
          saveHighScore(score + 100 + timeBonus, riddles.length);
          setGameState('victory');
        }
      } else {
        if (soundEnabled) sound.playWrong();
        toast.error('Неправильно! Попробуй ещё раз');
        saveHighScore(score, currentLevel);
        setGameState('gameOver');
      }
      
      setShowFeedback(false);
      setSelectedAnswer(null);
    }, 1000);
  };

  const startGame = () => {
    if (soundEnabled) sound.playClick();
    setCurrentLevel(0);
    setScore(0);
    setTimeLeft(riddles[0].timeLimit);
    setUsedHints(new Set());
    setShowHint(false);
    setGameState('playing');
  };

  const nextLevel = () => {
    if (soundEnabled) sound.playLevelComplete();
    const newLevel = currentLevel + 1;
    setCurrentLevel(newLevel);
    setTimeLeft(riddles[newLevel].timeLimit);
    setShowHint(false);
    setGameState('playing');
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setTimeLeft(riddles[0].timeLimit);
    setUsedHints(new Set());
    setShowHint(false);
    setGameState('menu');
  };

  const progressPercentage = ((currentLevel + 1) / riddles.length) * 100;

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 animate-scale-in backdrop-blur-sm bg-white/95">
          <div className="text-center space-y-6">
            <div className="animate-pulse-glow inline-block">
              <Icon name="Brain" size={80} className="text-primary mx-auto" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Загадки & Головоломки
            </h1>
            <p className="text-xl text-muted-foreground">
              Проверь свою смекалку! Реши все загадки, пока не истекло время
            </p>
            <div className="grid grid-cols-3 gap-4 my-8">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                <Icon name="Layers" size={32} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{riddles.length}</div>
                <div className="text-sm text-muted-foreground">Уровней</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5">
                <Icon name="Timer" size={32} className="text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary">12-30с</div>
                <div className="text-sm text-muted-foreground">На уровень</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
                <Icon name="Lightbulb" size={32} className="text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-accent">{HINT_COST}</div>
                <div className="text-sm text-muted-foreground">Подсказка</div>
              </div>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={startGame}
                className="text-xl px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all animate-slide-up"
              >
                <Icon name="Play" size={24} className="mr-2" />
                Начать игру
              </Button>
              
              <Button
                size="lg"
                variant={soundEnabled ? "outline" : "secondary"}
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) sound.playClick();
                }}
                className="text-xl px-6 py-6 animate-slide-up"
              >
                <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={24} />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-xl px-8 py-6 animate-slide-up"
                  >
                    <Icon name="Trophy" size={24} className="mr-2" />
                    Рекорды
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                      <Icon name="Trophy" size={32} className="inline text-yellow-500 mr-2" />
                      Таблица рекордов
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {highScores.length > 0 ? (
                      highScores.map((score, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-primary/20 text-primary'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-bold text-lg">{score.score} очков</div>
                              <div className="text-sm text-muted-foreground">
                                {score.levelsCompleted} / {riddles.length} уровней • {score.date}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="Trophy" size={48} className="mx-auto mb-2 opacity-30" />
                        <p>Пока нет рекордов</p>
                        <p className="text-sm">Сыграй первую игру!</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentRiddle = riddles[currentLevel];
    const timePercentage = (timeLeft / currentRiddle.timeLimit) * 100;
    const canUseHint = score >= HINT_COST && !usedHints.has(currentLevel);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <div className="max-w-3xl mx-auto pt-8 space-y-6">
          <div className="flex items-center justify-between animate-fade-in flex-wrap gap-3">
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full">
              <Icon name="Star" size={24} className="text-yellow-500" />
              <span className="text-2xl font-bold">{score}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full">
              <Icon name="Layers" size={24} className="text-primary" />
              <span className="text-xl font-semibold">
                {currentLevel + 1} / {riddles.length}
              </span>
            </div>
          </div>

          <div className="space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Прогресс игры</span>
              <span className="text-white/80">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white/30" />
          </div>

          <Card className="p-8 animate-scale-in backdrop-blur-sm bg-white/95">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className={`flex items-center gap-4 p-4 rounded-xl transition-all flex-1 ${
                  timeLeft <= 5 ? 'bg-destructive/10 animate-pulse' : 'bg-accent/10'
                }`}>
                  <Icon 
                    name="Timer" 
                    size={32} 
                    className={timeLeft <= 5 ? 'text-destructive' : 'text-accent'} 
                  />
                  <span className={`text-4xl font-bold ${
                    timeLeft <= 5 ? 'text-destructive' : 'text-accent'
                  }`}>
                    {timeLeft}с
                  </span>
                </div>
                
                <Button
                  onClick={useHint}
                  disabled={!canUseHint || showHint}
                  variant={showHint ? "secondary" : "outline"}
                  size="lg"
                  className="px-6 py-6"
                >
                  <Icon name="Lightbulb" size={24} className={showHint ? "text-yellow-500" : ""} />
                  <span className="ml-2">{HINT_COST}</span>
                </Button>
              </div>
              
              <Progress 
                value={timePercentage} 
                className={`h-2 ${timeLeft <= 5 ? 'bg-destructive/20' : 'bg-accent/20'}`}
              />

              {showHint && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-yellow-800">Подсказка:</div>
                      <div className="text-yellow-700">{currentRiddle.hint}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
                  {currentRiddle.question}
                </h2>

                <div className="grid gap-4">
                  {currentRiddle.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      disabled={showFeedback}
                      variant="outline"
                      className={`p-6 text-lg h-auto justify-start transition-all hover:scale-[1.02] ${
                        showFeedback && selectedAnswer === index
                          ? index === currentRiddle.correctAnswer
                            ? 'bg-green-500/20 border-green-500 text-green-700'
                            : 'bg-red-500/20 border-red-500 text-red-700'
                          : 'hover:bg-primary/5 hover:border-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 text-left">{option}</span>
                        {showFeedback && selectedAnswer === index && (
                          <Icon 
                            name={index === currentRiddle.correctAnswer ? "Check" : "X"} 
                            size={24}
                            className={index === currentRiddle.correctAnswer ? 'text-green-600' : 'text-red-600'}
                          />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'levelComplete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-xl p-8 animate-scale-in backdrop-blur-sm bg-white/95">
          <div className="text-center space-y-6">
            <div className="animate-bounce">
              <Icon name="CheckCircle" size={80} className="text-green-500 mx-auto" />
            </div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Уровень пройден!
            </h2>
            <p className="text-xl text-muted-foreground">
              Отличная работа! Двигаемся дальше
            </p>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
              <Icon name="Star" size={32} className="text-yellow-500" />
              {score}
            </div>
            <Button 
              size="lg" 
              onClick={nextLevel}
              className="text-xl px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Icon name="ArrowRight" size={24} className="mr-2" />
              Следующий уровень
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'victory') {
    const isNewRecord = highScores.length === 0 || score > highScores[0].score;
    if (soundEnabled) sound.playVictory();
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-xl p-8 animate-scale-in backdrop-blur-sm bg-white/95">
          <div className="text-center space-y-6">
            <div className="animate-pulse-glow">
              <Icon name="Trophy" size={100} className="text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              {isNewRecord ? '🎉 Новый рекорд!' : 'Победа!'}
            </h2>
            <p className="text-xl text-muted-foreground">
              Поздравляем! Ты прошёл все уровни!
            </p>
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="text-sm text-muted-foreground mb-2">Финальный счёт</div>
              <div className="flex items-center justify-center gap-2 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                <Icon name="Star" size={48} className="text-yellow-500" />
                {score}
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={restartGame}
              className="text-xl px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Icon name="RotateCcw" size={24} className="mr-2" />
              Играть снова
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-xl p-8 animate-scale-in backdrop-blur-sm bg-white/95">
        <div className="text-center space-y-6">
          <div className="animate-pulse">
            <Icon name="XCircle" size={80} className="text-destructive mx-auto" />
          </div>
          <h2 className="text-4xl font-bold text-destructive">
            Игра окончена
          </h2>
          <p className="text-xl text-muted-foreground">
            Не расстраивайся! Попробуй ещё раз
          </p>
          <div className="p-6 rounded-xl bg-muted">
            <div className="text-sm text-muted-foreground mb-2">Твой счёт</div>
            <div className="flex items-center justify-center gap-2 text-4xl font-bold text-primary">
              <Icon name="Star" size={40} className="text-yellow-500" />
              {score}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Пройдено {currentLevel} из {riddles.length} уровней
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={restartGame}
              className="text-xl px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Icon name="RotateCcw" size={24} className="mr-2" />
              Попробовать снова
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;