import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { Utensils, Receipt, Bike, Plus, Trash2, LogOut, ArrowLeft, Ban, Settings, Coffee, Beef, X, DollarSign, Image, Type, AlignLeft, Clock, MapPin, Edit2, Check, ChevronUp, ChevronDown, GripVertical, Eye, EyeOff, Package, Layers, Upload, Share2, Link2, Copy, ExternalLink, QrCode } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface Drink { id: string; name: string; price: number; is_available?: boolean; image?: string; }
interface Meat { id: string; name: string; }
interface Slide { id: string; image: string; title: string; description: string; }
interface MenuData { title: string; description: string; image: string; prices: { p: number; m: number; g: number }; meats: Meat[]; drinks: Drink[]; slides: Slide[]; isOpen: boolean; hasDelivery: boolean; deliveryFee: number; prepTime: number; }

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>{isOpen && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-xl">{title}</h3><button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button></div>
        {children}
      </motion.div>
    </motion.div>
  )}</AnimatePresence>
);

const ImageUploader = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande"); return; }
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-3">
      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">{label}</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-8 h-8 text-zinc-600 mb-2" /><span className="text-zinc-500 text-xs">Clique para escolher do celular ou computador</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

const DrinkEditor = ({ drink, onSave, onCancel }: { drink?: Drink; onSave: (d: Drink) => void; onCancel: () => void }) => {
  const [name, setName] = useState(drink?.name || '');
  const [price, setPrice] = useState(drink?.price?.toString() || '');
  const [image, setImage] = useState(drink?.image || '');
  return (
    <div className="space-y-4">
      <ImageUploader value={image} onChange={setImage} label="Foto da Bebida (opcional)" />
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Nome da Bebida</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" placeholder="Ex: Refrigerante Guaraná" /></div>
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Preço (R$)</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" placeholder="5.90" /></div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button onClick={() => { if (!name.trim()) return toast.error("Informe o nome"); onSave({ id: drink?.id || Date.now().toString(), name: name.trim(), price: parseFloat(price) || 0, image }); }} className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm">{drink ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </div>
  );
};

const MeatEditor = ({ meat, onSave, onCancel }: { meat?: Meat; onSave: (m: Meat) => void; onCancel: () => void }) => {
  const [name, setName] = useState(meat?.name || '');
  return (
    <div className="space-y-4">
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Nome da Carne/Complemento</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" placeholder="Ex: Frango Grelhado" /></div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button onClick={() => { if (!name.trim()) return toast.error("Informe o nome"); onSave({ id: meat?.id || Date.now().toString(), name: name.trim() }); }} className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm">{meat ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </div>
  );
};

const SlideEditor = ({ slide, onSave, onCancel }: { slide?: Slide; onSave: (s: Slide) => void; onCancel: () => void }) => {
  const [image, setImage] = useState(slide?.image || '');
  const [title, setTitle] = useState(slide?.title || '');
  const [description, setDescription] = useState(slide?.description || '');
  return (
    <div className="space-y-4">
      <ImageUploader value={image} onChange={setImage} label="Imagem do Slide" />
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Título</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" placeholder="Ex: Marmita do Dia" /></div>
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Descrição</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary resize-none" rows={2} placeholder="Ex: Especial de hoje" /></div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 py-3 rounded-xl text-zinc-400 font-bold text-sm">Cancelar</button>
        <button onClick={() => onSave({ id: slide?.id || Date.now().toString(), image, title, description })} className="flex-1 bg-primary py-3 rounded-xl text-white font-bold text-sm">{slide ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </div>
  );
};

const MainDishEditor = ({ menu, onSave }: { menu: MenuData; onSave: (m: MenuData) => void }) => {
  const [localMenu, setLocalMenu] = useState<MenuData>({ ...menu });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { if (!localMenu.title.trim()) return toast.error("Informe o nome do prato"); setSaving(true); await onSave(localMenu); setSaving(false); };
  return (
    <div className="space-y-6">
      <ImageUploader value={localMenu.image} onChange={img => setLocalMenu({ ...localMenu, image: img })} label="Foto do Prato" />
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-2"><Type className="w-4 h-4" /> Nome do Prato</label><input type="text" value={localMenu.title} onChange={e => setLocalMenu({ ...localMenu, title: e.target.value })} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary text-lg font-bold" placeholder="Ex: Marmita do Dia" /></div>
      <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Descrição</label><textarea value={localMenu.description} onChange={e => setLocalMenu({ ...localMenu, description: e.target.value })} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary resize-none" rows={3} placeholder="Descreva o prato..." /></div>
      <div>
        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Preços por Tamanho</label>
        <div className="grid grid-cols-3 gap-4">
          {[{ key: 'p', label: 'Pequeno (P)' }, { key: 'm', label: 'Médio (M)' }, { key: 'g', label: 'Grande (G)' }].map(({ key, label }) => (
            <div key={key}><span className="text-[10px] text-zinc-500 uppercase block mb-2 font-black">{label}</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">R$</span><input type="number" step="0.01" value={localMenu.prices[key as keyof typeof localMenu.prices]} onChange={e => setLocalMenu({ ...localMenu, prices: { ...localMenu.prices, [key]: parseFloat(e.target.value) || 0 } })} className="w-full bg-black/40 border border-white/10 p-4 pl-10 rounded-xl text-white outline-none focus:border-primary text-center font-bold" /></div></div>
          ))}
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-primary py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">{saving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Prato</>}</button>
    </div>
  );
};

const GeneralSettings = ({ menu, onSave }: { menu: MenuData; onSave: (m: MenuData) => void }) => {
  const [localMenu, setLocalMenu] = useState<MenuData>({ ...menu });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { setSaving(true); await onSave(localMenu); setSaving(false); };
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center">
          <div><h4 className="text-white font-bold text-lg">Status da Loja</h4><p className="text-zinc-500 text-xs mt-1">Marque se você está aberto para receber pedidos</p></div>
          <button onClick={() => setLocalMenu({ ...localMenu, isOpen: !localMenu.isOpen })} className={cn("w-16 h-10 rounded-full flex items-center px-1 transition-all", localMenu.isOpen ? "bg-green-500 justify-end" : "bg-zinc-700 justify-start")}><div className={cn("w-8 h-8 rounded-full bg-white shadow-lg transition-all", localMenu.isOpen && "scale-110")} /></button>
        </div>
        <div className="mt-3 text-center"><span className={cn("text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full", localMenu.isOpen ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{localMenu.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}</span></div>
      </div>
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center">
          <div><h4 className="text-white font-bold text-lg flex items-center gap-2"><Bike className="w-5 h-5 text-primary" /> Entrega / Delivery</h4><p className="text-zinc-500 text-xs mt-1">Permitir que clientes escolham entrega</p></div>
          <button onClick={() => setLocalMenu({ ...localMenu, hasDelivery: !localMenu.hasDelivery })} className={cn("w-16 h-10 rounded-full flex items-center px-1 transition-all", localMenu.hasDelivery ? "bg-green-500 justify-end" : "bg-zinc-700 justify-start")}><div className={cn("w-8 h-8 rounded-full bg-white shadow-lg", localMenu.hasDelivery && "scale-110")} /></button>
        </div>
        {localMenu.hasDelivery && <div className="mt-4"><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Taxa de Entrega (R$)</label><input type="number" step="0.01" value={localMenu.deliveryFee} onChange={e => setLocalMenu({ ...localMenu, deliveryFee: parseFloat(e.target.value) || 0 })} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" /></div>}
      </div>
      <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5">
        <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" /> Tempo de Preparo</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Mínimo (min)</label><input type="number" value={localMenu.prepTime?.min || 30} onChange={e => setLocalMenu({ ...localMenu, prepTime: { ...(localMenu.prepTime || {}), min: parseInt(e.target.value) || 30 } })} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" /></div>
          <div><label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Máximo (min)</label><input type="number" value={localMenu.prepTime?.max || 50} onChange={e => setLocalMenu({ ...localMenu, prepTime: { ...(localMenu.prepTime || {}), max: parseInt(e.target.value) || 50 } })} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary" /></div>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-primary py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">{saving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Configurações</>}</button>
    </div>
  );
};

const DrinksManager = ({ drinks, onUpdate }: { drinks: Drink[]; onUpdate: (d: Drink[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | undefined>();
  const handleSave = (drink: Drink) => { if (editingDrink) onUpdate(drinks.map(d => d.id === drink.id ? drink : d)); else onUpdate([...drinks, drink]); setShowModal(false); };
  return (
    <>
      <div className="space-y-4">
        {drinks.length === 0 ? <div className="text-center py-12 text-zinc-500 bg-zinc-800/30 rounded-2xl border border-dashed border-white/5"><Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Nenhuma bebida cadastrada</p><p className="text-xs text-zinc-600 mt-1">Adicione refrigerantes, sucos, águas...</p></div> : drinks.map(drink => (
          <div key={drink.id} className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
            {drink.image ? <img src={drink.image} alt={drink.name} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center"><Coffee className="w-6 h-6 text-zinc-700" /></div>}
            <div className="flex-1"><p className="text-white font-bold">{drink.name}</p><p className="text-primary font-bold text-sm">{formatBRL(drink.price)}</p></div>
            <div className={cn("w-2 h-2 rounded-full", drink.is_available !== false ? "bg-green-500" : "bg-red-500")} />
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdate(drinks.map(d => d.id === drink.id ? { ...d, is_available: !d.is_available } : d))} className="p-2 hover:bg-white/5 rounded-lg">{drink.is_available !== false ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}</button>
              <button onClick={() => { setEditingDrink(drink); setShowModal(true); }} className="p-2 hover:bg-white/5 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm('Remover esta bebida?')) onUpdate(drinks.filter(d => d.id !== drink.id)); }} className="p-2 hover:bg-white/5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        <button onClick={() => { setEditingDrink(undefined); setShowModal(true); }} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20"><Plus className="w-5 h-5" /> Adicionar Bebida</button>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDrink ? "Editar Bebida" : "Nova Bebida"}><DrinkEditor drink={editingDrink} onSave={handleSave} onCancel={() => setShowModal(false)} /></Modal>
    </>
  );
};

const MeatsManager = ({ meats, onUpdate }: { meats: Meat[]; onUpdate: (m: Meat[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMeat, setEditingMeat] = useState<Meat | undefined>();
  const handleSave = (meat: Meat) => { if (editingMeat) onUpdate(meats.map(m => m.id === meat.id ? meat : m)); else onUpdate([...meats, meat]); setShowModal(false); };
  return (
    <>
      <div className="space-y-3">
        {meats.length === 0 ? <div className="text-center py-12 text-zinc-500 bg-zinc-800/30 rounded-2xl border border-dashed border-white/5"><Beef className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Nenhum complemento cadastrado</p><p className="text-xs text-zinc-600 mt-1">Adicione tipos de carne, adicionais...</p></div> : meats.map((meat) => (
          <div key={meat.id} className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3"><GripVertical className="w-4 h-4 text-zinc-600" /><Beef className="w-5 h-5 text-primary/50" /><span className="text-white font-bold">{meat.name}</span></div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditingMeat(meat); setShowModal(true); }} className="p-2 hover:bg-white/5 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm('Remover este complemento?')) onUpdate(meats.filter(m => m.id !== meat.id)); }} className="p-2 hover:bg-white/5 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        <button onClick={() => { setEditingMeat(undefined); setShowModal(true); }} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20"><Plus className="w-5 h-5" /> Adicionar Complemento</button>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMeat ? "Editar Complemento" : "Novo Complemento"}><MeatEditor meat={editingMeat} onSave={handleSave} onCancel={() => setShowModal(false)} /></Modal>
    </>
  );
};

const SlidesManager = ({ slides, onUpdate }: { slides: Slide[]; onUpdate: (s: Slide[]) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | undefined>();
  const handleSave = (slide: Slide) => { if (editingSlide) onUpdate(slides.map(s => s.id === slide.id ? slide : s)); else onUpdate([...slides, slide]); setShowModal(false); };
  const handleDelete = (id: string) => { if (confirm('Remover este slide?')) onUpdate(slides.filter(s => s.id !== id)); };
  const moveUp = (idx: number) => { if (idx === 0) return; const newSlides = [...slides]; [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]]; onUpdate(newSlides); };
  const moveDown = (idx: number) => { if (idx === slides.length - 1) return; const newSlides = [...slides]; [newSlides[idx], newSlides[idx + 1]] = [newSlides[idx + 1], newSlides[idx]]; onUpdate(newSlides); };
  return (
    <>
      <div className="space-y-4">
        {slides.length === 0 ? <div className="text-center py-12 text-zinc-500 bg-zinc-800/30 rounded-2xl border border-dashed border-white/5"><Layers className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Nenhum slide cadastrado</p><p className="text-xs text-zinc-600 mt-1">Adicione imagens para o carrossel da loja</p></div> : slides.map((slide, idx) => (
          <div key={slide.id} className="bg-zinc-800/50 rounded-xl border border-white/5 overflow-hidden">
            <div className="flex">
              <div className="w-28 h-20 bg-zinc-900 flex-shrink-0">{slide.image ? <img src={slide.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-zinc-700" /></div>}</div>
              <div className="flex-1 p-3 flex items-center"><div className="flex-1 min-w-0"><p className="text-white font-bold text-sm truncate">{slide.title || 'Sem título'}</p><p className="text-zinc-500 text-xs truncate">{slide.description || 'Sem descrição'}</p></div></div>
              <div className="flex flex-col border-l border-white/5"><button onClick={() => moveUp(idx)} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white flex-1"><ChevronUp className="w-4 h-4" /></button><button onClick={() => moveDown(idx)} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white flex-1"><ChevronDown className="w-4 h-4" /></button></div>
              <div className="flex flex-col border-l border-white/5"><button onClick={() => { setEditingSlide(slide); setShowModal(true); }} className="p-2 hover:bg-white/5 text-primary flex-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(slide.id)} className="p-2 hover:bg-white/5 text-red-500 flex-1"><Trash2 className="w-4 h-4" /></button></div>
            </div>
          </div>
        ))}
        <button onClick={() => { setEditingSlide(undefined); setShowModal(true); }} className="w-full bg-primary/10 border border-primary/20 py-4 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20"><Plus className="w-5 h-5" /> Adicionar Slide</button>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSlide ? "Editar Slide" : "Novo Slide"}><SlideEditor slide={editingSlide} onSave={handleSave} onCancel={() => setShowModal(false)} /></Modal>
    </>
  );
};

// ======================================================
// COMPONENTE: COMPARTILHAR LINKS E QR CODE
// ======================================================
const ShareLinks = ({ storeSlug, storeName }: { storeSlug: string; storeName: string }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Obter a URL base do site
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://marmitaria.com';
  const storeUrl = `${baseUrl}/${storeSlug}`;
  const siteUrl = baseUrl;
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    }).catch(() => {
      toast.error("Erro ao copiar");
    });
  };
  
  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-primary font-bold text-xs flex items-center gap-2 hover:bg-primary/20 transition-colors"
      >
        <Share2 className="w-4 h-4" /> Compartilhar
      </button>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Compartilhar Loja">
        <div className="space-y-6">
          {/* QR CODE */}
          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 text-center">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <QrCode className="w-5 h-5 text-primary" />
              <h4 className="text-white font-bold">QR Code da Loja</h4>
            </div>
            <p className="text-zinc-500 text-xs mb-4">Escaneie este código para acessar a loja diretamente</p>
            <div className="bg-white p-4 rounded-2xl inline-block">
              <QRCodeSVG 
                value={storeUrl}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="text-zinc-400 text-xs mt-4 font-mono">{storeUrl}</p>
          </div>
          
          {/* Link da Loja */}
          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-5 h-5 text-primary" />
              <h4 className="text-white font-bold">Link da Sua Loja</h4>
            </div>
            <p className="text-zinc-500 text-xs mb-4">Compartilhe este link para que seus clientes acessem diretamente sua loja.</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={storeUrl}
                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm truncate"
              />
              <button 
                onClick={() => copyToClipboard(storeUrl, 'Link da loja')}
                className="bg-primary p-3 rounded-xl text-white hover:bg-primary/80 transition-colors"
                title="Copiar link"
              >
                <Copy className="w-5 h-5" />
              </button>
              <a 
                href={storeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
                title="Abrir link"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Link do Site (Vitrine) */}
          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-secondary" />
              <h4 className="text-white font-bold">Link do Site (Vitrine)</h4>
            </div>
            <p className="text-zinc-500 text-xs mb-4">Link da vitrine com todas as lojas. Use para mostrar o aplicativo.</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={siteUrl}
                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm truncate"
              />
              <button 
                onClick={() => copyToClipboard(siteUrl, 'Link do site')}
                className="bg-secondary p-3 rounded-xl text-white hover:bg-secondary/80 transition-colors"
                title="Copiar link"
              >
                <Copy className="w-5 h-5" />
              </button>
              <a 
                href={siteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
                title="Abrir link"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

const OrderCard: React.FC<{ order: any; onUpdateStatus: (id: string, status: string) => void; showDate?: boolean }> = ({ order, onUpdateStatus, showDate }) => {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          {showDate && <p className="text-[10px] font-mono text-zinc-600 uppercase mb-1">{format(new Date(order.created_at), "dd/MM")}</p>}
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{format(new Date(order.created_at), "HH:mm")}</p>
          <h3 className="text-white font-bold text-lg leading-tight">{order.customer_name}</h3>
          <p className="text-xs text-zinc-400">{order.customer_phone}</p>
          {order.delivery_address && order.delivery_address !== 'RETIRADA' && <p className="text-[10px] text-primary mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.delivery_address}</p>}
        </div>
        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase", order.status === 'pendente' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : order.status === 'confirmado' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20")}>{order.status}</span>
      </div>
      <div className="bg-black/30 rounded-2xl p-4 mb-4 space-y-2 flex-grow border border-white/5">
        {order.items_json?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-zinc-300"><b className="text-primary mr-2">{item.quantity}x</b> {typeof item.name === 'object' ? item.name.name : item.name}{item.size && <span className="text-zinc-600 text-xs ml-1">({item.size})</span>}</span>
            <span className="text-white font-bold">{formatBRL(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-mono mb-4"><span>{order.payment_method}</span><span className="text-white font-bold text-lg">{formatBRL(order.total_amount)}</span></div>
      <div className="grid grid-cols-1 gap-2">
        {order.status === 'pendente' && <button onClick={() => onUpdateStatus(order.id, 'confirmado')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest">Confirmar Pedido</button>}
        {order.status === 'confirmado' && <button onClick={() => onUpdateStatus(order.id, 'entregue')} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Bike className="w-4 h-4"/> Saiu para Entrega</button>}
        {order.status === 'entregue' && <div className="w-full bg-green-500/10 text-green-500 py-4 rounded-xl font-bold text-xs uppercase text-center border border-green-500/20">Pedido Concluído ✓</div>}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { toast.error("Você precisa estar logado."); return navigate('/login'); }
      const userEmail = user.email?.toLowerCase().trim() || '';
      if (userEmail === 'arleisilverio41@gmail.com') { setAdminData({ isSuperAdmin: true }); setStoreSlug('marmitaria-talita'); await loadStoreData('marmitaria-talita'); return; }
      const adminResult = await api.checkAdminAccess(userEmail);
      if (!adminResult) { toast.error("Acesso negado."); return navigate('/'); }
      if (adminResult.status === 'blocked') { setIsBlocked(true); setLoading(false); return; }
      setAdminData(adminResult);
      const finalSlug = location.state?.storeSlug || adminResult.slug;
      if (!finalSlug) { toast.error("Loja não encontrada."); return navigate('/'); }
      setStoreSlug(finalSlug);
      await loadStoreData(finalSlug);
    } catch (err) { console.error("Erro:", err); toast.error("Erro ao verificar acesso."); navigate('/'); }
  };

  const loadStoreData = async (slug: string) => {
    try {
      const [menuData, ordersData] = await Promise.all([api.getMenu(slug), api.getOrders(slug)]);
      setMenu({ title: menuData?.title || '', description: menuData?.description || '', image: menuData?.image || '', prices: menuData?.prices || { p: 0, m: 0, g: 0 }, meats: menuData?.meats || [], drinks: menuData?.drinks || [], slides: menuData?.slides || [], isOpen: menuData?.isOpen ?? true, hasDelivery: menuData?.hasDelivery ?? true, deliveryFee: menuData?.deliveryFee ?? 5, prepTime: menuData?.prepTime || { min: 30, max: 50 } });
      setOrders(ordersData);
    } catch (err) { console.error("Erro:", err); toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  };

  const handleSavePart = async (updatedMenu: MenuData) => { if (!storeSlug) return; try { await api.updateMenu(storeSlug, updatedMenu); setMenu(updatedMenu); toast.success("Alterações salvas!"); } catch { toast.error("Erro ao salvar."); } };
  const handleUpdateStatus = async (orderId: string, newStatus: string) => { try { await api.updateOrderStatus(orderId, newStatus); setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o)); toast.success(`Pedido ${newStatus}!`); } catch { toast.error("Erro ao atualizar."); } };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-zinc-500 font-mono text-xs uppercase">Sincronizando...</p></div>;
  if (isBlocked) return <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center"><div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30 shadow-2xl"><Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/><h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2><p className="text-zinc-500">Sua conta está inativa.</p><button onClick={() => navigate('/')} className="mt-8 text-zinc-400 underline">Voltar</button></div></div>;
  if (!menu) return null;

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div><h1 className="text-white font-bold text-lg uppercase">{menu.title || 'Painel Admin'}</h1><span className="text-[10px] text-primary font-black uppercase tracking-widest">{adminData?.isSuperAdmin ? 'Super Admin' : storeSlug}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <ShareLinks storeSlug={storeSlug} storeName={menu.title} />
            <button onClick={async () => { const updated = { ...menu, isOpen: !menu.isOpen }; setMenu(updated); try { await api.updateMenu(storeSlug, updated); toast.success(updated.isOpen ? "Loja Aberta!" : "Loja Fechada!"); } catch { toast.error("Erro."); } }} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>{menu.isOpen ? 'ABERTO' : 'FECHADO'}</button>
            <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-white")}><Receipt className="w-4 h-4" /> Pedidos</button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-white")}><Package className="w-4 h-4" /> Cardápio</button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-white")}><Settings className="w-4 h-4" /> Configs</button>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Pedidos de Hoje ({todayOrders.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todayOrders.length === 0 ? <div className="col-span-full py-20 text-center text-zinc-600 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl"><Receipt className="mx-auto w-16 h-16 mb-4 opacity-20" /><p className="font-heading font-bold text-lg">Nenhum pedido hoje</p></div> : todayOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />)}
              </div>
            </motion.div>
          )}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="glass-card p-6 rounded-3xl border border-white/5"><h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6"><Utensils className="text-primary w-6 h-6" /> Prato Principal</h2><MainDishEditor menu={menu} onSave={handleSavePart} /></div>
              <div className="glass-card p-6 rounded-3xl border border-white/5"><h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6"><Beef className="text-primary w-6 h-6" /> Carnes / Complementos</h2><MeatsManager meats={menu.meats} onUpdate={meats => handleSavePart({ ...menu, meats })} /></div>
              <div className="glass-card p-6 rounded-3xl border border-white/5"><h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6"><Coffee className="text-primary w-6 h-6" /> Bebidas</h2><DrinksManager drinks={menu.drinks} onUpdate={drinks => handleSavePart({ ...menu, drinks })} /></div>
              <div className="glass-card p-6 rounded-3xl border border-white/5"><h2 className="text-white font-bold text-xl flex items-center gap-2 mb-6"><Layers className="text-primary w-6 h-6" /> Slides do Carrossel</h2><SlidesManager slides={menu.slides} onUpdate={slides => handleSavePart({ ...menu, slides })} /></div>
            </motion.div>
          )}
          {activeTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><GeneralSettings menu={menu} onSave={handleSavePart} /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}