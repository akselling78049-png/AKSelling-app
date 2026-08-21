import { Home, LayoutGrid, BadgePercent, User, ShoppingCart } from 'lucide-react';
import type { PageTab } from '@/types';

interface BottomNavProps {
  activeTab: PageTab;
  onNavigate: (tab: PageTab) => void;
  cartCount: number;
}

const tabs: { id: PageTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'होम', icon: Home },
  { id: 'categories', label: 'कैटेगरी', icon: LayoutGrid },
  { id: 'deals', label: 'डील', icon: BadgePercent },
  { id: 'account', label: 'अकाउंट', icon: User },
  { id: 'cart', label: 'कार्ट', icon: ShoppingCart },
];

export default function BottomNav({ activeTab, onNavigate, cartCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-7xl items-center justify-around px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
