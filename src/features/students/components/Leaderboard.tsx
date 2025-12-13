import { useEffect, useState } from "react";
import { getGlobalRanking, type GlobalRanking, type RankingItem } from "../../results/services/results.service";
import { Loader2, Medal, Trophy, Crown } from "lucide-react";

export default function Leaderboard() {
  const [ranking, setRanking] = useState<GlobalRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gng' | 'sst' | 'tol'>('gng');

  useEffect(() => {
    getGlobalRanking()
      .then(setRanking)
      .catch((err) => console.error("Ranking error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (!ranking) return null;

  const getList = () => {
    switch (activeTab) {
      case 'sst': return ranking.sst;
      case 'tol': return ranking.tol;
      default: return ranking.gng;
    }
  };

  const currentList = getList();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg animate-fade-in-up">
      <div className="p-6 pb-0 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Crown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white">Top Global</h2>
                 <p className="text-sm text-slate-500">Los mejores estudiantes</p>
            </div>
        </div>

        <div className="flex gap-2 mb-[-1px]">
            <TabButton active={activeTab === 'gng'} onClick={() => setActiveTab('gng')} label="Atención" />
            <TabButton active={activeTab === 'sst'} onClick={() => setActiveTab('sst')} label="Control" />
            <TabButton active={activeTab === 'tol'} onClick={() => setActiveTab('tol')} label="Estrategia" />
        </div>
      </div>

      <div className="p-4 min-h-[300px]">
        {currentList.length === 0 ? (
            <div className="text-center py-10 opacity-50">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Aún no hay récords</p>
            </div>
        ) : (
            <ul className="space-y-3">
                {currentList.map((item, index) => (
                    <RankingCard key={`${item.nombre}-${index}`} item={item} index={index} type={activeTab} />
                ))}
            </ul>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-all ${
                active 
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
        >
            {label}
        </button>
    )
}

function RankingCard({ item, index, type }: { item: RankingItem, index: number, type: string }) {
    let icon = <span className="font-bold text-slate-400 w-6 text-center">#{index + 1}</span>;
    let bg = "bg-slate-50 dark:bg-slate-800/50";
    
    if (index === 0) {
        icon = <Trophy className="w-5 h-5 text-yellow-500" />;
        bg = "bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-900 border border-yellow-200 dark:border-yellow-900/50";
    } else if (index === 1) {
        icon = <Medal className="w-5 h-5 text-slate-400" />;
        bg = "bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900";
    } else if (index === 2) {
        icon = <Medal className="w-5 h-5 text-amber-600" />;
        bg = "bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900";
    }

    const score = type === 'tol' ? item.tol_score : item.acc_score;
    const scoreLabel = type === 'tol' ? `${Math.round(score * 100)} pts` : `${Math.round(score * 100)}%`;

    return (
        <li className={`flex items-center gap-3 p-3 rounded-xl ${bg} transition-all`}>
            <div className="flex-shrink-0 w-8 flex justify-center">{icon}</div>
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                    {item.nombre.substring(0,2)}
                </div>
                <div className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {item.nombre}
                </div>
            </div>
            <div className="font-black text-slate-900 dark:text-white">
                {scoreLabel}
            </div>
        </li>
    );
}
