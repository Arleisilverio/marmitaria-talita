import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { 
  Utensils, Receipt, Bike, Plus, Trash2, LogOut, ArrowLeft, Ban, 
  Settings, Save, Coffee, Beef, X, DollarSign, Image, Type, AlignLeft,
  Clock, MapPin, Edit2, Check, ChevronUp, ChevronDown, GripVertical,
  Eye, EyeOff, Package, Layers
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// ======================================================
// TIPOS
// ======================================================
interface Drink {
  id: string;
  name: string;
  price: number;
  is_available?: boolean;
}

interface Meat {
  id: string;
  name: string;
}

interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface MenuData {
  title: string;
  description: string;
  image: string;
  prices: { p: number; m: number; g: number };
  meats: Meat[];
  drinks: Drink[];
  slides: Slide[];
  isOpen: boolean;
  hasDelivery: boolean;
  deliveryFee: number;
  prepTime: number;
}

interface OrderCardProps {
  order: any;
  onUpdateStatus: (id: string, status: string) => void;
  showDate?: boolean;
}

// ======================================================
// MODAL COMPONENTE
// ======================================================
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-xl">{title}</h3>
            <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ======================================================
// COMPONENTE: EDITOR DE BEBIDA
// ======================================================
const DrinkEditor = ({ drink, onSave, onCancel }: { drink?: Drink; onSave: (d: Drink) => void; onCancel: () => void }) => {
  const [name, setName] = useState(drink?.name || '');
  const [price, setPrice] = useState(drink?.price?.toString() || '');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Nome da Bebida</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="Ex: Suco de Laranja"
        />
      </div>
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Preço (R$)</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="5.90"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button 
          onClick={() => onSave({ id: drink?.id || Date.now().toString(), name, price: parseFloat(price) || 0 })} 
          className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm"
        >
          {drink ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
};

// ======================================================
// COMPONENTE: EDITOR DE CARNE
// ======================================================
const MeatEditor = ({ meat, onSave, onCancel }: { meat?: Meat; onSave: (m: Meat) => void; onCancel: () => void }) => {
  const [name, setName] = useState(meat?.name || '');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Nome da Carne/Complemento</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="Ex: Frango"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button 
          onClick={() => onSave({ id: meat?.id || Date.now().toString(), name })} 
          className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm"
        >
          {meat ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
};

// ======================================================
// COMPONENTE: EDITOR DE SLIDE
// ======================================================
const SlideEditor = ({ slide, onSave, onCancel }: { slide?: Slide; onSave: (s: Slide) => void; onCancel: () => void }) => {
  const [image, setImage] = useState(slide?.image || '');
  const [title, setTitle] = useState(slide?.title || '');
  const [description, setDescription] = useState(slide?.description || '');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">URL da Imagem</label>
        <input
          type="url"
          value={image}
          onChange={e => setImage(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="https://..."
        />
      </div>
      {image && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img src={image} alt="Preview" className="w-full h-32 object-cover" />
        </div>
      )}
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Título do Slide</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="Ex: Marmita do Dia"
        />
      </div>
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary resize-none"
          rows={2}
          placeholder="Ex: Especial de hoje com frango grelhado"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button 
          onClick={() => onSave({ id: slide?.id || Date.now().toString(), image, title, description })} 
          className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm"
        >
          {slide ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
};

// ======================================================
// COMPONENTE: EDITOR DE PRATO PRINCIPAL
// ======================================================
const MainDishEditor = ({ menu, onSave }: { menu: MenuData; onSave: (m: MenuData) => void }) => {
  const [localMenu, setLocalMenu] = useState<MenuData>({ ...menu });
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await onSave(localMenu);
    setSaving(false);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-2">
          <Type className="w-4 h-4" /> Nome do Prato / Título da Loja
        </label>
        <input
          type="text"
          value={localMenu.title}
          onChange={e => setLocalMenu({ ...localMenu, title: e.target.value })}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary text-lg font-bold"
          placeholder="Ex: Marmitaria Talita"
        />
      </div>
      
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-2">
          <AlignLeft className="w-4 h-4" /> Descrição
        </label>
        <textarea
          value={localMenu.description}
          onChange={e => setLocalMenu({ ...localMenu, description: e.target.value })}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary resize-none"
          rows={3}
          placeholder="Descreva o que faz seu estabelecimento especial..."
        />
      </div>
      
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-2">
          <Image className="w-4 h-4" /> Imagem Principal do Prato
        </label>
        <input
          type="url"
          value={localMenu.image}
          onChange={e => setLocalMenu({ ...localMenu, image: e.target.value })}
          className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
          placeholder="https://exemplo.com/imagem.jpg"
        />
        {localMenu.image && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
            <img src={localMenu.image} alt="Preview" className="w-full h-48 object-cover" />
          </div>
        )}
      </div>
      
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Preços por Tamanho
        </label>
        <div className="grid grid-cols-3 gap-4">
          {['p', 'm', 'g'].map(size => (
            <div key={size}>
              <span className="text-[10px] text-zinc-500 uppercase block mb-2 font-black">
                {size === 'p' ? 'Pequeno (P)' : size === 'm' ? 'Médio (M)' : 'Grande (G)'}
              </span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={localMenu.prices[size]}
                  onChange={e => setLocalMenu({ ...localMenu, prices: { ...localMenu.prices, [size]: parseFloat(e.target.value) || 0 } })}
                  className="w-full bg-black/40 border border-white/10 p-4 pl-10 rounded-xl text-white outline-none focus:border-primary text-center font-bold"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
      >
        {saving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Prato Principal</>}
      </button>
    </div>
  );
};

// ======================================================
// COMPONENTE: CONFIGURAÇÕES GERAIS
// ======================================================
const GeneralSettings = ({ menu, onSave }: { menu: MenuData; onSave: (m: MenuData) => void }) => {
  const [localMenu, setLocalMenu] = useState<MenuData>({ ...menu });
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await onSave(localMenu);
    setSaving(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-white font-bold text-lg">Status da Loja</h4>
            <p className="text-zinc-500 text-xs mt-1">Marque se você está aberto para receber pedidos</p>
          </div>
          <button
            onClick={() => setLocalMenu({ ...localMenu, isOpen: !localMenu.isOpen })}
            className={cn(
              "w-16 h-10 rounded-full flex items-center px-1 transition-all",
              localMenu.isOpen ? "bg-green-500 justify-end" : "bg-zinc-700 justify-start"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full bg-white shadow-lg transition-all", localMenu.isOpen && "scale-110")} />
          </button>
        </div>
        <div className="mt-3 text-center">
          <span className={cn(
            "text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full",
            localMenu.isOpen ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {localMenu.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}
          </span>
        </div>
      </div>
      
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-white font-bold text-lg flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" /> Entrega / Delivery
            </h4>
            <p className="text-zinc-500 text-xs mt-1">Permitir que clientes escolham entrega</p>
          </div>
          <button
            onClick={() => setLocalMenu({ ...localMenu, hasDelivery: !localMenu.hasDelivery })}
            className={cn(
              "w-16 h-10 rounded-full flex items-center px-1 transition-all",
              localMenu.hasDelivery ? "bg-green-500 justify-end" : "bg-zinc-700 justify-start"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full bg-white shadow-lg transition-all", localMenu.hasDelivery && "scale-110")} />
          </button>
        </div>
        {localMenu.hasDelivery && (
          <div className="mt-4">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Taxa de Entrega (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                value={localMenu.deliveryFee}
                onChange={e => setLocalMenu({ ...localMenu, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 p-4 pl-10 rounded-xl text-white outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" /> Tempo de Preparo
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Mínimo (min)</label>
            <input
              type="number"
              value={localMenu.prepTime?.min || 30}
              onChange={e => setLocalMenu({ 
                ...localMenu, 
                prepTime: { ...localMenu.prepTime as any, min: parseInt(e.target.value) || 30 } 
              })}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Máximo (min)</label>
            <input
              type="number"
              value={localMenu.prepTime?.max || 50}
              onChange={e => setLocalMenu({ 
                ...localMenu, 
                prepTime: { ...localMenu.prepTime as any, max: parseInt(e.target.value) || 50 } 
              })}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
      >
        {saving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Configurações</>}
      </button>
    </div>
  );
};

// ======================================================
// COMPONENTE: GERENCIAR BEBIDAS
// ======================================================
const DrinksManager = ({ drinks, onUpdate }: { drinks: Drink[]; onUpdate: (d: Drink[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | undefined>();
  
  const handleAdd = () => { setEditingDrink(undefined); setShowModal(true); };
  const handleEdit = (d: Drink) => { setEditingDrink(d); setShowModal(true); };
  
  const handleSave = (drink: Drink) => {
    if (editingDrink) {
      onUpdate(drinks.map(d => d.id === drink.id ? drink : d));
    } else {
      onUpdate([...drinks, drink]);
    }
    setShowModal(false);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Remover esta bebida?')) {
      onUpdate(drinks.filter(d => d.id !== id));
    }
  };
  
  const toggleAvailability = (id: string) => {
    onUpdate(drinks.map(d => d.id === id ? { ...d, is_available: !d.is_available } : d));
  };
  
  return (
    <>
      <div className="space-y-4">
        {drinks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma bebida cadastrada</p>
          </div>
        ) : (
          drinks.map(drink => (
            <div key={drink.id} className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-3 h-3 rounded-full", drink.is_available !== false ? "bg-green-500" : "bg-red-500")} />
                <div>
                  <p className="text-white font-bold">{drink.name}</p>
                  <p className="text-primary font-bold text-sm">{formatBRL(drink.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAvailability(drink.id)} className="p-2 hover:bg-white/5 rounded-lg">
                  {drink.is_available !== false ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                </button>
                <button onClick={() => handleEdit(drink)} className="p-2 hover:bg-white/5 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(drink.id)} className="p-2 hover:bg-white/5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
        <button onClick={handleAdd} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20">
          <Plus className="w-5 h-5" /> Adicionar Bebida
        </button>
      </div>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDrink ? "Editar Bebida" : "Nova Bebida"}>
        <DrinkEditor drink={editingDrink} onSave={handleSave} onCancel={() => setShowModal(false)} />
      </Modal>
    </>
  );
};

// ======================================================
// COMPONENTE: GERENCIAR CARNES/COMPLEMENTOS
// ======================================================
const MeatsManager = ({ meats, onUpdate }: { meats: Meat[]; onUpdate: (m: Meat[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMeat, setEditingMeat] = useState<Meat | undefined>();
  
  const handleAdd = () => { setEditingMeat(undefined); setShowModal(true); };
  const handleEdit = (m: Meat) => { setEditingMeat(m); setShowModal(true); };
  
  const handleSave = (meat: Meat) => {
    if (editingMeat) {
      onUpdate(meats.map(m => m.id === meat.id ? meat : m));
    } else {
      onUpdate([...meats, meat]);
    }
    setShowModal(false);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Remover esta carne/complemento?')) {
      onUpdate(meats.filter(m => m.id !== id));
    }
  };
  
  return (
    <>
      <div className="space-y-3">
        {meats.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Beef className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum complemento cadastrado</p>
          </div>
        ) : (
          meats.map((meat, idx) => (
            <div key={meat.id || idx} className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-zinc-600" />
                <span className="text-white font-bold">{meat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(meat)} className="p-2 hover:bg-white/5 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(meat.id)} className="p-2 hover:bg-white/5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
        <button onClick={handleAdd} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20">
          <Plus className="w-5 h-5" /> Adicionar Complemento
        </button>
      </div>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMeat ? "Editar Complemento" : "Novo Complemento"}>
        <MeatEditor meat={editingMeat} onSave={handleSave} onCancel={() => setShowModal(false)} />
      </Modal>
    </>
  );
};

// ======================================================
// COMPONENTE: GERENCIAR SLIDES/CARROSSEL
// ======================================================
const SlidesManager = ({ slides, onUpdate }: { slides: Slide[]; onUpdate: (s: Slide[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | undefined>();
  
  const handleAdd = () => { setEditingSlide(undefined); setShowModal(true); };
  const handleEdit = (s: Slide) => { setEditingSlide(s); setShowModal(true); };
  
  const handleSave = (slide: Slide) => {
    if (editingSlide) {
      onUpdate(slides.map(s => s.id === slide.id ? slide : s));
    } else {
      onUpdate([...slides, slide]);
    }
    setShowModal(false);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Remover este slide?')) {
      onUpdate(slides.filter(s => s.id !== id));
    }
  };
  
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newSlides = [...slides];
    [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]];
    onUpdate(newSlides);
  };
  
  const moveDown = (idx: number) => {
    if (idx === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[idx + 1]] = [newSlides[idx + 1], newSlides[idx]];
    onUpdate(newSlides);
  };
  
  return (
    <>
      <div className="space-y-4">
        {slides.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum slide cadastrado</p>
          </div>
        ) : (
          slides.map((slide, idx) => (
            <div key={slide.id} className="bg-zinc-800/50 rounded-xl border border-white/5 overflow-hidden">
              <div className="flex">
                <div className="w-24 h-20 bg-zinc-900 flex-shrink-0">
                  {slide.image && <img src={slide.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 p-3">
                  <p className="text-white font-bold text-sm">{slide.title || 'Sem título'}</p>
                  <p className="text-zinc-500 text-xs truncate">{slide.description || 'Sem descrição'}</p>
                </div>
                <div className="flex flex-col border-l border-white/5">
                  <button onClick={() => moveUp(idx)} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveDown(idx)} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col border-l border-white/5">
                  <button onClick={() => handleEdit(slide)} className="p-2 hover:bg-white/5 text-primary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(slide.id)} className="p-2 hover:bg-white/5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
        <button onClick={handleAdd} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20">
          <Plus className="w-5 h-5" /> Adicionar Slide
        </button>
      </div>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSlide ? "Editar Slide" : "Novo Slide"}>
        <SlideEditor slide={editingSlide} onSave={handleSave} onCancel={() => setShowModal(false)} />
      </Modal>
    </>
  );
};

// ======================================================
// COMPONENTE: CARD DE PEDIDO (definido separadamente com tipo explícito)
// ======================================================
function OrderCard({ order, onUpdateStatus, showDate }: OrderCardProps) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          {showDate && <p className="text-[10px] font-mono text-zinc-600 uppercase mb-1">{format(new Date(order.created_at), "dd/MM")}</p>}
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{format(new Date(order.created_at), "HH:mm")}</p>
          <h3 className="text-white font-bold text-lg leading-tight">{order.customer_name}</h3>
          <p className="text-xs text-zinc-400">{order.customer_phone}</p>
          {order.delivery_address && order.delivery_address !== 'RETIRADA' && (
            <p className="text-[10px] text-primary mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.delivery_address}</p>
          )}
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase",
          order.status === 'pendente' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : 
          order.status === 'confirmado' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
          "bg-green-500/10 text-green-500 border border-green-500/20"
        )}>
          {order.status}
        </span>
      </div>

      <div className="bg-black/30 rounded-2xl p-4 mb-4 space-y-2 flex-grow border border-white/5">
        {order.items_json?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-zinc-300">
              <b className="text-primary mr-2">{item.quantity}x</b> 
              {typeof item.name === 'object' ? item.name.name : item.name}
              {item.size && <span className="text-zinc-600 text-xs ml-1">({item.size})</span>}
            </span>
            <span className="text-white font-bold">{formatBRL(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-mono mb-4">
        <span>{order.payment_method}</span>
        <span className="text-white font-bold text-lg">{formatBRL(order.total_amount)}</span>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {order.status === 'pendente' && (
          <button onClick={() => onUpdateStatus(order.id, 'confirmado')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest">Confirmar Pedido</button>
        )}
        {order.status === 'confirmado' && (
          <button onClick={() => onUpdateStatus(order.id, 'entregue')} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <Bike className="w-4 h-4"/> Saiu para Entrega
          </button>
        )}
        {order.status === 'entregue' && (
          <div className="w-full bg-green-500/10 text-green-500 py-4 rounded-xl font-bold text-xs uppercase text-center border border-green-500/20">Pedido Concluído ✓</div>
        )}
      </div>
    </div>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL: ADMIN DASHBOARD
// ======================================================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Você precisa estar logado.");
        return navigate('/login');
      }

      const userEmail = user.email?.toLowerCase().trim() || '';
      
      if (userEmail === 'arleisilverio41@gmail.com') {
        setAdminData({ isSuperAdmin: true });
        setStoreSlug('marmitaria-talita');
        await loadStoreData('marmitaria-talita');
        return;
      }

      const adminResult = await api.checkAdminAccess(userEmail);
      
      if (!adminResult) {
        toast.error("Acesso negado. Você não é administrador de nenhuma loja.");
        return navigate('/');
      }

      if (adminResult.status === 'blocked') {
        setIsBlocked(true);
        setLoading(false);
        return;
      }

      setAdminData(adminResult);
      
      const slugFromState = location.state?.storeSlug;
      const finalSlug = slugFromState || adminResult.slug;
      
      if (!finalSlug) {
        toast.error("Loja não encontrada.");
        return navigate('/');
      }

      setStoreSlug(finalSlug);
      await loadStoreData(finalSlug);
      
    } catch (err) {
      console.error("Erro no checkAccess:", err);
      toast.error("Erro ao verificar acesso.");
      navigate('/');
    }
  };

  const loadStoreData = async (slug: string) => {
    try {
      const [menuData, ordersData] = await Promise.all([
        api.getMenu(slug),
        api.getOrders(slug)
      ]);
      
      const fullMenu: MenuData = {
        title: menuData?.title || '',
        description: menuData?.description || '',
        image: menuData?.image || '',
        prices: menuData?.prices || { p: 0, m: 0, g: 0 },
        meats: menuData?.meats || [],
        drinks: menuData?.drinks || [],
        slides: menuData?.slides || [],
        isOpen: menuData?.isOpen ?? true,
        hasDelivery: menuData?.hasDelivery ?? true,
        deliveryFee: menuData?.deliveryFee ?? 5,
        prepTime: menuData?.prepTime || { min: 30, max: 50 }
      };
      
      setMenu(fullMenu);
      setOrders(ordersData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados da loja.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!storeSlug || !menu) return;
    setSaving(true);
    try {
      await api.updateMenu(storeSlug, menu);
      toast.success("Cardápio salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePart = async (updatedMenu: MenuData) => {
    if (!storeSlug) return;
    setSaving(true);
    try {
      await api.updateMenu(storeSlug, updatedMenu);
      setMenu(updatedMenu);
      toast.success("Alterações salvas!");
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Pedido ${newStatus}!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Sincronizando Loja...</p>
    </div>
  );

  if (isBlocked) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
      <div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30 shadow-2xl">
        <Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2>
        <p className="text-zinc-500">Sua conta de lojista está inativa. Fale com o suporte.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-zinc-400 underline">Voltar</button>
      </div>
    </div>
  );

  if (!menu) return null;

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));
  const allOrders = orders;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight uppercase">{menu.title || 'Painel Admin'}</h1>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">
              {adminData?.isSuperAdmin ? 'Super Admin' : `Loja: ${storeSlug}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (!menu) return;
              const updated = { ...menu, isOpen: !menu.isOpen };
              setMenu(updated);
              try {
                await api.updateMenu(storeSlug, updated);
                toast.success(updated.isOpen ? "Loja Aberta!" : "Loja Fechada!");
              } catch {
                toast.error("Erro ao atualizar.");
              }
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {menu.isOpen ? 'LOJA ABERTA' : 'FECHADA'}
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-primary px-4 py-2 rounded-xl font-bold text-white text-xs flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> SALVAR TUDO</>}
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Receipt className="w-4 h-4" /> Pedidos
          </button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Package className="w-4 h-4" /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Settings className="w-4 h-4" /> Configs
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => document.getElementById('today-orders')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Hoje ({todayOrders.length})
                </button>
                <button 
                  onClick={() => document.getElementById('all-orders')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Todos ({allOrders.length})
                </button>
              </div>
              
              <div id="today-orders" className="mb-8">
                <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Pedidos de Hoje
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {todayOrders.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-zinc-600 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                      <Receipt className="mx-auto w-16 h-16 mb-4 opacity-20" />
                      <p className="font-heading font-bold text-lg">Nenhum pedido hoje</p>
                      <p className="text-zinc-500 text-sm mt-2">Aguardando novos pedidos...</p>
                    </div>
                  ) : (
                    todayOrders.map(order => (
                      <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                    ))
                  )}
                </div>
              </div>
              
              <div id="all-orders">
                <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> Todos os Pedidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allOrders.filter(o => !isSameDay(new Date(o.created_at), new Date())).map(order => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} showDate />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="glass-card p-6 rounded-3xl border border-white/5">
                <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6">
                  <Utensils className="text-primary w-6 h-6" /> Prato Principal
                </h2>
                <MainDishEditor menu={menu} onSave={handleSavePart} />
              </div>
              
              <div className="glass-card p-6 rounded-3xl border border-white/5">
                <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6">
                  <DollarSign className="text-primary w-6 h-6" /> Preços Rápidos
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {['p', 'm', 'g'].map(size => (
                    <div key={size}>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-2 font-black">P {size.toUpperCase()}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={menu.prices[size]} 
                          onChange={e => {
                            const updated = { ...menu, prices: { ...menu.prices, [size]: parseFloat(e.target.value) || 0 } };
                            setMenu(updated);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-8 text-white outline-none focus:border-primary font-bold text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-3xl border border-white/5">
                <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6">
                  <Beef className="text-primary w-6 h-6" /> Carnes / Complementos
                </h2>
                <MeatsManager 
                  meats={menu.meats} 
                  onUpdate={(meats) => handleSavePart({ ...menu, meats })} 
                />
              </div>
              
              <div className="glass-card p-6 rounded-3xl border border-white/5">
                <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6">
                  <Coffee className="text-primary w-6 h-6" /> Bebidas
                </h2>
                <DrinksManager 
                  drinks={menu.drinks} 
                  onUpdate={(drinks) => handleSavePart({ ...menu, drinks })} 
                />
              </div>
              
              <div className="glass-card p-6 rounded-3xl border border-white/5">
                <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6">
                  <Layers className="text-primary w-6 h-6" /> Slides do Carrossel
                </h2>
                <SlidesManager 
                  slides={menu.slides} 
                  onUpdate={(slides) => handleSavePart({ ...menu, slides })} 
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <GeneralSettings menu={menu} onSave={handleSavePart} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}