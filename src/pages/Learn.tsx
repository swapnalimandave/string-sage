import { useEffect, useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { ScribbleUnderline } from '@/components/fti/Doodle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TOPICS = [
  { id: 'budgeting-101', title: 'Budgeting 101', emoji: '💰', color: 'bg-lime' },
  { id: 'understanding-cibil', title: 'Understanding CIBIL', emoji: '📊', color: 'bg-purple' },
  { id: 'sip-magic', title: 'The Magic of SIP', emoji: '📈', color: 'bg-orange text-white' },
  { id: 'tax-basics', title: 'Tax Basics', emoji: '🧾', color: 'bg-cream' },
];

type Lesson = { story: string; lesson: string; wikipediaLink?: string; quiz: { q: string; options: string[]; answer: number; explanation: string }[] };

const Learn = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const generate = async (t: typeof TOPICS[number]) => {
    setTopic(t.id); setLesson(null); setAnswers([]); setSubmitted(false); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson', { body: { topic: t.title } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLesson(data as Lesson);
      setAnswers(new Array((data as Lesson).quiz.length).fill(-1));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate lesson';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const speak = (txt: string) => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(txt);
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const submitQuiz = async () => {
    if (!lesson || !user) return;
    const correct = answers.reduce((s, a, i) => s + (a === lesson.quiz[i].answer ? 1 : 0), 0);
    setSubmitted(true);
    const points = correct * 5;
    await supabase.from('learning_progress').insert({ user_id: user.id, topic: topic!, kind: 'quiz', score: correct, completed: true });
    const { data: pts } = await supabase.from('user_points').select('points').eq('user_id', user.id).maybeSingle();
    await supabase.from('user_points').update({ points: (pts?.points ?? 0) + points }).eq('user_id', user.id);
    toast.success(`Got ${correct}/${lesson.quiz.length} · +${points} points`);
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Learn Mode
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-lime" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">stories, lessons & quizzes — AI-fresh.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {TOPICS.map((t, i) => (
          <button key={t.id} onClick={() => generate(t)} className={`${t.color} brutal-border brutal-shadow rounded-2xl p-5 text-left hover:-translate-y-1 transition-transform`} style={{ transform: `rotate(${i%2?1:-1}deg)` }}>
            <div className="text-3xl">{t.emoji}</div>
            <div className="font-display font-bold text-xl mt-2">{t.title}</div>
            <div className="font-hand text-lg mt-1">tap to read</div>
          </button>
        ))}
      </div>

      {loading && <BrutalCard><div className="flex items-center gap-3"><Loader2 className="animate-spin" /> Generating your lesson…</div></BrutalCard>}

      {lesson && !loading && (
        <div className="grid lg:grid-cols-2 gap-5">
          <BrutalCard tilt={-1}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display font-bold text-2xl">📖 Story</h2>
              <BrutalButton size="sm" color="lime" onClick={() => speak(lesson.story + ' ' + lesson.lesson)}>{speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} {speaking ? 'Stop' : 'Read'}</BrutalButton>
            </div>
            <p className="whitespace-pre-line">{lesson.story}</p>
            <div className="brutal-border bg-cream rounded-xl p-3 mt-4">
              <p className="font-display font-bold mb-1">💡 Takeaway</p>
              <p className="text-sm">{lesson.lesson}</p>
            </div>
            {lesson.wikipediaLink && (
              <div className="mt-4 text-sm text-center">
                <a href={lesson.wikipediaLink} target="_blank" rel="noopener noreferrer" className="text-purple hover:underline font-bold brutal-shadow inline-block bg-white px-3 py-1 brutal-border rounded-lg">
                  📖 Read Official Wikipedia Article
                </a>
              </div>
            )}
          </BrutalCard>

          <BrutalCard color="cream" tilt={1}>
            <h2 className="font-display font-bold text-2xl mb-3">🧠 Quiz</h2>
            <div className="space-y-4">
              {lesson.quiz.map((q, qi) => (
                <div key={qi} className="brutal-border bg-card rounded-xl p-3">
                  <p className="font-bold mb-2">{qi+1}. {q.q}</p>
                  <div className="space-y-1.5">
                    {q.options.map((o, oi) => {
                      const picked = answers[qi] === oi;
                      const correct = submitted && oi === q.answer;
                      const wrong = submitted && picked && oi !== q.answer;
                      return (
                        <button key={oi} onClick={() => !submitted && setAnswers(a => a.map((x,i) => i===qi ? oi : x))}
                          className={`w-full text-left brutal-border rounded-lg p-2 text-sm ${correct?'bg-lime':wrong?'bg-orange text-white':picked?'bg-purple':'bg-cream'}`}>{o}</button>
                      );
                    })}
                  </div>
                  {submitted && answers[qi] !== q.answer && (
                    <div className="mt-3 p-3 bg-rose-100 brutal-border rounded-lg text-sm text-rose-900">
                      <p className="font-bold mb-1">❌ Incorrect</p>
                      <p className="mb-2"><span className="font-bold">Correct Answer:</span> {q.options[q.answer]}</p>
                      <p className="mb-2"><span className="font-bold">Explanation:</span> {q.explanation}</p>
                      <p className="text-xs font-bold text-rose-700 italic">Please refer to the lesson for more information.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!submitted && <BrutalButton color="lime" className="mt-4 w-full" onClick={submitQuiz} disabled={answers.includes(-1)}>Submit quiz</BrutalButton>}
          </BrutalCard>
        </div>
      )}
    </AppShell>
  );
};

export default Learn;
